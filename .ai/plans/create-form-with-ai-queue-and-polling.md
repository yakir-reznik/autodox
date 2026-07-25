# AI Form Import Queue + Polling

## Summary

- Convert `/manage/form/ai` from a long blocking POST into: upload/submit task, then poll task status.
- Use an in-memory `p-queue` task registry with a 10-minute task timeout, no DB migration.
- Update the UI from real task statuses, with rotating Hebrew “alive” messages during the AI generation stage every 8 seconds.

## Implementation Progress

- [x] Add shared AI import task response/status types.
- [x] Add an in-memory AI import queue with 10-minute timeout and retained terminal results.
- [x] Convert the POST endpoint to enqueue work and add a polling endpoint.
- [x] Pass abort signals into OpenRouter requests for timed-out tasks.
- [x] Update the AI create-form page to poll task status and rotate generation messages.
- [x] Run `pnpm run typecheck`.
- [x] Move queued task file payloads from memory to private temp files on disk.

## Key Changes

- Add shared AI import task types, likely in `shared/types/ai-form-import.ts`:
  - Statuses: `queued`, `generating`, `repairing`, `creating`, `success`, `failed`, `expired`.
  - Response shapes for create-task and get-task-status.
- Add `server/utils/aiFormImportQueue.ts`:
  - `PQueue` concurrency defaults to `1`, configurable with `AI_FORM_IMPORT_QUEUE_CONCURRENCY`. Set to `5` for now to allow some parallelism.
  - Timeout is `10 * 60 * 1000`.
  - Store tasks in memory by random task id, scoped to `userId`.
  - Clean up completed/failed/expired tasks after a short retention window, e.g. 30 minutes.
  - Pass an `AbortSignal` through AI provider calls so timed-out requests are actually aborted.
- Refactor current AI import logic into reusable task execution:
  - Keep upload validation in `server/api/forms/ai-import.post.ts`.
  - POST returns quickly with `{ success: true, taskId, status: "queued" }`.
  - Add `GET /api/forms/ai-import/[taskId]` for polling.
  - Preserve optional `formId` backend support for replacement jobs.

## UI Behavior

- In [ai.vue](/Users/yakirreznik/dev/autodox/app/pages/manage/form/ai.vue), replace local fake stage timers with polling.
- Flow:
  - File selected resets state.
  - Click starts upload, then receives `taskId`.
  - Poll every 2 seconds until `success`, `failed`, or `expired`.
  - On `success`, store `formId`, stop polling, start existing redirect countdown.
  - On failure, show server error, validation errors, and invalid JSON like today.
- Display steps from actual status:
  - Uploading: client-only while POSTing file.
  - Queued: waiting for worker.
  - Generating/repairing: AI model work.
  - Creating: validating/saving form.
- During `generating`, rotate a Hebrew message every 8 seconds, for example:
  - `ממתינים שה-AI יסיים לבנות את הטופס.`
  - `המודל עדיין עובד על זה.`
  - `עוד רגע זה מוכן...`
  - `ה-AI קורא את המסמך לעומק.`
  - `מסדרים שדות, כותרות ואפשרויות.`
- Clear all polling/message/redirect timers in `resetAiFeedback` and `onBeforeUnmount`.

## Test Plan

- Run `pnpm run typecheck`.
- Manual scenarios:
  - Successful file import redirects to `/manage/form/{id}/edit`.
  - Large/unsupported file fails before task creation.
  - AI validation failure still shows invalid JSON and validation errors.
  - Long generation keeps polling and rotates messages every 8 seconds.
  - A task exceeding 10 minutes becomes failed/expired with a clear Hebrew error.
  - Refreshing during an in-memory task loses UI tracking by design unless the task id is persisted later.

## Assumptions

- In-memory queue is the chosen implementation, so active tasks do not survive server restarts or multi-server routing.
- UI copy stays Hebrew to match the app’s RTL/Hebrew convention.
- No new tests are added unless explicitly approved; validation is typecheck plus manual QA.
