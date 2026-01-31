import PQueue from "p-queue";
import { generateSubmissionPDF } from "./generatePDF";

const PDF_CONCURRENCY = parseInt(process.env.PDF_QUEUE_CONCURRENCY || "2", 10);
const PDF_TIMEOUT_MS = 60000; // 60 seconds

const pdfQueue = new PQueue({
  concurrency: PDF_CONCURRENCY,
  timeout: PDF_TIMEOUT_MS,
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
    { timeout: PDF_TIMEOUT_MS },
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
