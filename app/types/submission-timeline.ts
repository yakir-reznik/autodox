// Base interface for all submission timeline events
export type BaseSubmissionTimelineEvent = {
  timestamp: Date
  type: 'lifecycle' | 'entrance' | 'webhook'
}

// Lifecycle events (created, started, submitted, locked, expires)
export type SubmissionLifecycleEvent = BaseSubmissionTimelineEvent & {
  type: 'lifecycle'
  event: 'created' | 'started' | 'submitted' | 'locked' | 'expires'
  status?: string
}

// Submission entrance events
export type SubmissionEntranceEvent = BaseSubmissionTimelineEvent & {
  type: 'entrance'
  id: number
  ipAddress: string | null
  userAgent: string | null
  referrer: string | null
  isFormLocked: boolean
}

// Webhook delivery events
export type SubmissionWebhookEvent = BaseSubmissionTimelineEvent & {
  type: 'webhook'
  id: number
  webhookUrl: string
  status: string
  httpStatusCode: number | null
  errorMessage: string | null
  retryCount: number
  deliveredAt: Date | null
}

// Union type of all timeline event types
export type SubmissionTimelineEvent =
  | SubmissionLifecycleEvent
  | SubmissionEntranceEvent
  | SubmissionWebhookEvent
