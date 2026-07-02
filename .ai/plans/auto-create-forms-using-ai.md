# AI Form Import V1

## Summary

Add an admin-only AI import workflow that accepts PDF, DOC/DOCX, or image files, extracts form JSON, validates it, and creates/replaces the form automatically when valid.

Use OpenRouter for v1 because it supports multiple models behind one API, PDF/file inputs, image inputs, and structured JSON outputs.

## Implementation Status

- [x] Extracted shared upload JSON validation, normalization, config mapping, condition resolution, create, and replace utilities.
- [x] Updated manual create/replace JSON routes to use the shared utility.
- [x] Added admin-only `POST /api/forms/ai-import` with multipart file validation, AI extraction, one repair attempt, create/replace behavior, and 422 invalid-output response.
- [x] Added provider-neutral AI form import layer and OpenRouter implementation.
- [x] Added runtime config and example env values for OpenRouter.
- [x] Added an admin-only AI import panel to the upload page while keeping the manual JSON workflow unchanged.
- [x] Ran `pnpm run typecheck`.

## Key Changes

- Add an AI import panel/tab to `/Users/yakirreznik/dev/autodox/app/pages/manage/form/upload.vue`, visible only to admins.
- Flow: admin selects file -> clicks Hebrew “צור טופס עם AI” -> server extracts JSON -> validates JSON -> creates/replaces the form -> redirects to the form editor.
- Do not show JSON review before creation.
- If the first AI output is invalid, send the JSON plus validation errors back to the AI once for repair.
- If the repaired JSON is still invalid, show an error state with the invalid JSON and validation reasons.
- Keep the existing manual JSON workflow unchanged.
- Enforce admin access on the new backend endpoint with `requireRoles(event, ["admin"])`.

## Implementation Changes

- Extract shared upload-JSON logic from the current create/replace JSON routes into a server utility:
  - shared upload body/element types
  - recursive validation that returns structured errors
  - normalization before validation
  - config mapping
  - condition resolution
  - create form from upload JSON
  - replace existing form structure from upload JSON
- Update `/api/forms/upload-json` and `/api/forms/[id]/upload-json` to call the shared utility so manual and AI imports use the same validation and creation behavior.
- Add `POST /api/forms/ai-import`:
  - accepts multipart form data with one file
  - accepts optional `formId` for replace mode
  - allows PDF, DOC, DOCX, JPEG, PNG, WEBP
  - rejects empty files and oversized files; default max 10MB
  - calls the configured AI provider
  - validates normalized output
  - on validation failure, calls the provider once more with the invalid JSON and validation errors
  - creates/replaces the form only after valid JSON
  - returns `{ success: true, formId, usage?, model? }` on success
  - returns `422` with `{ success: false, json, errors }` after the repair attempt also fails
- Add a provider-neutral server layer:
  - `AiFormImportProvider` interface with `extractForm(file, prompt, schema)` and `repairFormJson(json, errors, schema)`
  - `OpenRouterFormImportProvider` implementation
  - env/runtime config: `OPEN_ROUTER_API_KEY`, `AI_FORM_IMPORT_PROVIDER=openrouter`, `AI_FORM_IMPORT_MODEL=google/gemini-2.5-flash-lite`
- Use OpenRouter structured outputs with a JSON schema matching the existing upload JSON shape.
- Prompt should preserve: exact text fidelity, Hebrew RTL, no translation, right alignment for Hebrew headings/paragraphs, field detection, required detection when visible, and layout/order preservation.
- Normalize AI output before validation:
  - accept `alignment` but convert it to existing `align`
  - strip unknown properties
  - validate nested children for both `section` and `repeater`
  - return clear path-based validation errors.

## Test Plan

- Run only allowed check: `pnpm run typecheck`.
- No automated tests will be added unless explicitly approved.
- Manual scenarios:
  - admin imports Hebrew PDF and is redirected to the created form editor
  - admin imports image scan and is redirected to the created form editor
  - admin imports DOC/DOCX and gets either a form or clear provider/file error
  - non-admin cannot call `/api/forms/ai-import`
  - invalid first AI JSON triggers exactly one repair attempt
  - invalid repaired JSON shows an error screen with JSON and reasons
  - replace mode updates an existing form only after valid JSON.

## Assumptions

- V1 creates/replaces automatically after validation.
- V1 does not include a JSON review step before creation.
- V1 uses OpenRouter as the aggregator and starts with a cheap configurable model.
- No credit system, billing tables, or migrations are included.
- No database commands are run.
- Legacy `.doc` support depends on provider/file-parser handling; if unsupported, the endpoint returns a clear error.
