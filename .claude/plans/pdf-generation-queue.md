# PDF Generation Queue Implementation

## Overview
Add an in-memory queue to limit concurrent PDF generations using `p-queue` library.

## Files to Modify/Create

| File | Action |
|------|--------|
| `package.json` | Add `p-queue` dependency |
| `server/utils/generatePDF.ts` | Export `getCachedPDF` function |
| `server/utils/pdfGenerationQueue.ts` | **Create** - Queue singleton with deduplication |
| `server/api/submissions/[token]/download-pdf.get.ts` | Update import to use queue |
| `server/utils/webhookDelivery.ts` | Update import to use queue |

## Implementation

### 1. Install p-queue
```bash
pnpm add p-queue
```

### 2. Update `server/utils/generatePDF.ts`

Export the cache check function:
```diff
- function getCachedPDF(token: string): Buffer | null {
+ export function getCachedPDF(token: string): Buffer | null {
```

### 3. Create `server/utils/pdfGenerationQueue.ts`

```typescript
import PQueue from "p-queue";
import { generateSubmissionPDF, getCachedPDF } from "./generatePDF";

const PDF_CONCURRENCY = parseInt(process.env.PDF_QUEUE_CONCURRENCY || "2", 10);
const PDF_TIMEOUT_MS = 60000; // 60 seconds

const pdfGenerationQueue = new PQueue({
  concurrency: PDF_CONCURRENCY,
  timeout: PDF_TIMEOUT_MS,
  throwOnTimeout: true,
});

// Track in-flight requests for deduplication
const inFlightRequests = new Map<string, Promise<Buffer>>();

/**
 * Queue a PDF generation request with deduplication.
 * Checks disk cache first - cached PDFs are served immediately without queuing.
 * If the same token is already being processed, returns the existing promise.
 */
export async function queuePDFGeneration(token: string): Promise<Buffer> {
  // Check disk cache first - no need to queue if already cached
  const cachedPDF = getCachedPDF(token);
  if (cachedPDF) {
    console.log("[PDF Generation Queue] Returning cached PDF for token:", token);
    return cachedPDF;
  }

  // Check if already in flight
  const existing = inFlightRequests.get(token);
  if (existing) {
    console.log("[PDF Generation Queue] Returning existing in-flight request for token:", token);
    return existing;
  }

  // Queue the generation
  const promise = pdfGenerationQueue.add(async () => {
    return generateSubmissionPDF(token);
  }, { throwOnTimeout: true }) as Promise<Buffer>;

  inFlightRequests.set(token, promise);

  try {
    return await promise;
  } finally {
    inFlightRequests.delete(token);
  }
}

export function getQueueStats() {
  return {
    pending: pdfGenerationQueue.pending,
    size: pdfGenerationQueue.size,
    concurrency: PDF_CONCURRENCY,
    inFlight: inFlightRequests.size,
  };
}
```

### 4. Update `server/api/submissions/[token]/download-pdf.get.ts`

```diff
- import { generateSubmissionPDF } from "~~/server/utils/generatePDF";
+ import { queuePDFGeneration } from "~~/server/utils/pdfGenerationQueue";

// In handler:
- const pdfBuffer = await generateSubmissionPDF(token);
+ const pdfBuffer = await queuePDFGeneration(token);
```

### 5. Update `server/utils/webhookDelivery.ts`

```diff
- import { generateSubmissionPDF } from "./generatePDF";
+ import { queuePDFGeneration } from "./pdfGenerationQueue";

// In buildWebhookPayload:
- const pdfBuffer = await generateSubmissionPDF(submission.token);
+ const pdfBuffer = await queuePDFGeneration(submission.token);
```

## Configuration

- `PDF_QUEUE_CONCURRENCY` env var (default: 2) - number of concurrent PDF generations allowed
- `PDF_TIMEOUT_MS` hardcoded to 60 seconds - timeout per generation

## Key Features

1. **Cache-first**: Disk cache is checked before queuing - cached PDFs served immediately
2. **Concurrency limiting**: Only N PDFs generate at once (default 2)
3. **Deduplication**: Duplicate requests for same token share one Promise
4. **Timeout**: 60 second timeout per generation

## Verification

1. Start dev server: `pnpm dev`
2. Open multiple browser tabs requesting same PDF download simultaneously
3. Check console for `[PDF Generation Queue]` logs showing cache hits and deduplication
4. Verify PDFs generate successfully
