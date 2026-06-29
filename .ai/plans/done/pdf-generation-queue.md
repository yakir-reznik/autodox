# PDF Generation Queue Implementation

## Overview

Add an in-memory queue to limit concurrent PDF generations using `p-queue` library.

## Files to Modify/Create

| File                                                 | Action                                          |
| ---------------------------------------------------- | ----------------------------------------------- |
| `package.json`                                       | Add `p-queue` dependency                        |
| `server/utils/pdfQueue.ts`                           | **Create** - Queue singleton with deduplication |
| `server/api/submissions/[token]/download-pdf.get.ts` | Update import to use queue                      |
| `server/utils/webhookDelivery.ts`                    | Update import to use queue                      |

## Implementation

### 1. Install p-queue ✅

```bash
pnpm add p-queue
```

### 2. Create `server/utils/pdfQueue.ts` ✅

```typescript
import PQueue from "p-queue";
import { generateSubmissionPDF } from "./generatePDF";

const PDF_CONCURRENCY = parseInt(process.env.PDF_QUEUE_CONCURRENCY || "2", 10);
const PDF_TIMEOUT_MS = 60000; // 60 seconds

const pdfQueue = new PQueue({
  concurrency: PDF_CONCURRENCY,
  timeout: PDF_TIMEOUT_MS,
  throwOnTimeout: true,
});

// Track in-flight requests for deduplication
const inFlightRequests = new Map<string, Promise<Buffer>>();

/**
 * Queue a PDF generation request with deduplication.
 * If the same token is already being processed, returns the existing promise.
 */
export async function queuePDFGeneration(token: string): Promise<Buffer> {
  const existing = inFlightRequests.get(token);
  if (existing) {
    console.log("[PDF Queue] Returning existing in-flight request for token:", token);
    return existing;
  }

  const promise = pdfQueue.add(
    async () => {
      return generateSubmissionPDF(token);
    },
    { throwOnTimeout: true },
  ) as Promise<Buffer>;

  inFlightRequests.set(token, promise);

  try {
    return await promise;
  } finally {
    inFlightRequests.delete(token);
  }
}

export function getQueueStats() {
  return {
    pending: pdfQueue.pending,
    size: pdfQueue.size,
    concurrency: PDF_CONCURRENCY,
    inFlight: inFlightRequests.size,
  };
}
```

### 3. Update `server/api/submissions/[token]/download-pdf.get.ts`

```diff
- import { generateSubmissionPDF } from "~~/server/utils/generatePDF";
+ import { queuePDFGeneration } from "~~/server/utils/pdfQueue";

// In handler:
- const pdfBuffer = await generateSubmissionPDF(token);
+ const pdfBuffer = await queuePDFGeneration(token);
```

### 4. Update `server/utils/webhookDelivery.ts`

```diff
- import { generateSubmissionPDF } from "./generatePDF";
+ import { queuePDFGeneration } from "./pdfQueue";

// In buildWebhookPayload:
- const pdfBuffer = await generateSubmissionPDF(submission.token);
+ const pdfBuffer = await queuePDFGeneration(submission.token);
```

## Configuration

- `PDF_QUEUE_CONCURRENCY` env var (default: 2) - number of concurrent PDF generations allowed
- `PDF_TIMEOUT_MS` hardcoded to 60 seconds - timeout per generation

## Key Features

1. **Concurrency limiting**: Only N PDFs generate at once (default 2)
2. **Deduplication**: Duplicate requests for same token share one Promise
3. **Timeout**: 60 second timeout per generation
4. **Cache integration**: Existing cache check in `generateSubmissionPDF` still applies

## Verification

1. Start dev server: `pnpm dev`
2. Open multiple browser tabs requesting same PDF download simultaneously
3. Check console for `[PDF Queue]` logs showing deduplication
4. Verify PDFs generate successfully
