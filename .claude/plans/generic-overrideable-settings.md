# Generic Overrideable Form Settings Pattern

## Problem

`password` and `webhookUrl` can be defined at the form level and overridden per submission. The resolution logic (`submission.field ?? form.field`) is duplicated across API endpoints with ad-hoc inline code. Adding a new overrideable setting requires finding and updating every resolution point.

## Solution

Create a single source of truth (`OVERRIDEABLE_FORM_SETTINGS`) and a resolution utility (`resolveFormSettings`). Refactor existing endpoints to use it.

## Steps

### 1. ~~Create `server/utils/overrideableFormSettings.ts`~~ DONE

- Define `OVERRIDEABLE_FORM_SETTINGS = ["password", "webhookUrl"] as const`
- Export `OverrideableFormSetting` type derived from the array
- Export `resolveFormSettings(form, submission?)` — for each key, returns `submission[key] ?? form[key] ?? null`
- Comment documenting how to add a new setting (add column to both tables, add key to array, run migration)

### 2. ~~Refactor `server/api/forms/[id].get.ts`~~ DONE

Replace line 83:
```typescript
const effectivePassword = submission?.password ?? form.password;
```
With:
```typescript
const { password: effectivePassword } = resolveFormSettings(form, submission);
```

### 3. ~~Refactor `server/api/forms/[id]/verify-password.post.ts`~~ DONE

Replace the manual password resolution block (lines 38 + 56-58) with:
```typescript
const { password: effectivePassword } = resolveFormSettings(form, submission);
```
Keep the DB fetch and expiry validation as-is. Only the `if (submission.password)` assignment becomes a `resolveFormSettings` call.

### 4. ~~Refactor `server/api/forms/[id]/submit.post.ts`~~ DONE

Public submission branch (line 114) — replace `webhookUrl: form.webhookUrl` with:
```typescript
const { webhookUrl } = resolveFormSettings(form);
```
Then use `webhookUrl` in both the insert and the webhook delivery check.

Token-based branch (line 80) stays as-is — it reads `submission.webhookUrl` directly because the value was already resolved at creation time.

### 5. ~~Keep `create-submission-link.post.ts` as-is (no utility)~~ DONE (no changes needed)

This endpoint has write-time resolution with validation and snake_case→camelCase mapping (`webhook_url` → `webhookUrl`). Wrapping this in a utility adds complexity without benefit. Leave the existing explicit code.

### 6. ~~Update architecture docs~~ DONE

Add a section to `.claude/docs/architecture.md` documenting the overrideable form settings pattern, the utility location, and the steps to add a new setting.

## Files to modify

| File | Change |
|------|--------|
| `server/utils/overrideableFormSettings.ts` | New: utility + source of truth |
| `server/api/forms/[id].get.ts` | Use `resolveFormSettings` for password |
| `server/api/forms/[id]/verify-password.post.ts` | Use `resolveFormSettings` for password |
| `server/api/forms/[id]/submit.post.ts` | Use `resolveFormSettings` for webhook (public branch) |
| `.claude/docs/architecture.md` | Document the pattern |

## Verification

1. Run `pnpm dev` and confirm no TypeScript errors
2. Open a form with a password → verify password gate still works
3. Open a submission link with a submission-level password override → verify the override takes effect
4. Submit a public form with a webhook configured → verify webhook fires
