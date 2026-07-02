# User Credits For Admin AI Form Generation

## Summary

Add a credit system with user balances and an auditable ledger. In this version, AI form generation stays admin-only and costs credits, with a default cost of `5` credits per AI import. Payments/top-ups are not implemented now, but the schema should leave room for them later.

## Key Changes

- Add credit tables in `server/db/schema.ts`:
  - `user_credit_balances_table`: one row per user with `userId`, `balance`, `updatedAt`, and optional `updatedBy`.
  - `credit_transactions_table`: append-only ledger with `userId`, signed `amountDelta`, `balanceAfter`, `type`, `source`, `action`, optional `description`, optional `metadata` JSON, optional external/payment reference fields, `createdBy`, and `createdAt`.
- Use ledger types/sources that are future-payment friendly:
  - `type`: `admin_set`, `spend`, `refund`, `top_up`.
  - `source`: `admin`, `system`, `payment`.
  - V1 only uses `admin_set`, `spend`, and `refund`; `top_up`/`payment` are reserved for later.
- Add app setting:
  - `aiFormImportCreditCost`, default `5`, stored through existing `app_settings_table`.
  - Show it on the existing admin settings page under AI form generation settings.
- Add credit utility layer:
  - `getUserCreditBalance(userId)` returns `0` when no balance row exists.
  - `setUserCreditBalance({ userId, balance, adminUserId, description })` upserts the balance and writes an `admin_set` ledger row.
  - `spendUserCredits({ userId, amount, action, metadata })` atomically prevents negative balances and writes a `spend` ledger row.
  - `refundUserCredits(...)` writes a compensating `refund` row and restores the balance.
- Update admin AI import:
  - Keep `POST /api/forms/ai-import` protected with `requireRoles(event, ["admin"])`.
  - Charge the current admin user `aiFormImportCreditCost` before calling the AI provider.
  - If credits are insufficient, return `402` with current balance and required cost.
  - If the AI/provider flow fails after spending, refund the credits.
  - Store metadata on spend/refund rows: model, usage when available, created/replaced form id when available, filename, and MIME type.
- Add admin credit management screen:
  - New route: `/manage/credits`.
  - Sidebar admin-only item: `קרדיטים`.
  - Screen lists users with name, email, role, and current balance.
  - Admin can search users and set an exact non-negative credit balance.
- Add API endpoints:
  - `GET /api/admin/credits/users?q=`: admin-only, returns users with balances.
  - `PATCH /api/admin/credits/users/[id]`: admin-only, sets exact balance and writes ledger.
  - Optional `GET /api/user/credits`: authenticated users can see their own balance for future UI reuse, even though only admins spend credits in v1.

## Test Plan

- Run `pnpm run typecheck`.
- Do not add automated tests unless explicitly approved.
- Manual checks:
  - Admin with at least `5` credits can generate a form with AI and balance decreases.
  - Admin with fewer than `5` credits is blocked before provider call.
  - Provider failure refunds credits.
  - Admin can search users and set exact credit count.
  - Non-admin cannot access admin credit APIs or credit management screen.
  - Ledger rows are created for admin set, spend, and refund.

## Assumptions

- Credits are per user, not per organization, because the current schema has users but no organization/account table.
- AI form generation remains admin-only in this step.
- Default AI generation cost is `5` credits and can be changed later from admin settings.
- Payment/top-up UI and payment provider integration are out of scope, but table fields/enums should not block adding them later.
- No database commands are run by the implementer; the operator runs migrations when ready.
