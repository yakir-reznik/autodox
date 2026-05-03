# CLAUDE.md

Autodox is a **Nuxt 4** form builder for creating and filling dynamic forms (Vue 3, TypeScript, Drizzle ORM, MySQL).

## General

- **Be concise with you're answers and descriptions of actions you took**
- **Talk to the operator in english unless explicitly asked otherwise**

## Key Facts

- **Use tabs** use tabs over spaces for indentation when writing code
- **Hebrew RTL**: All UI text is in Hebrew. The app uses `dir="rtl"` and `lang="he"`.
- **Type safety**: Shared types between client and server in `app/types/form-builder.ts`.
- **Auto-imports**: Nuxt auto-imports Vue APIs (`ref`, `computed`), composables from `app/composables/`, and components from `app/components/`. No manual imports needed.

## Core Principles

- **Simplicity first**: Write simple, practical, human-readable code. Avoid over-engineering.
- **Suggest alternatives**: If you see a better solution to what I'm asking for, suggest it before implementing.
- **Minimal comments**: Code should be self-explanatory. Only comment non-obvious logic.
- **Modular structure**: Keep files focused. Extract reusable logic to composables, components to separate files, and shared types to `app/types/` use types over interfaces.
- **Writing plans**: When planning write implementation steps in a way that each step can be done by a standalone agent without previous context.
- **Implementing plans**: When implementing plans mark steps as complete in the plans markdown file

## Constraints

- **No tests without permission**: Do not add tests for features without explicit operator approval. Ask when you think tests would be valuable.
- **Testing stack**: Vitest and `@nuxt/test-utils` for tests when approved.
- **No database commands**: Ask the operator to run migrations, schema changes, etc.
- **Tailwind only**: Avoid custom CSS unless absolutely necessary for animations/keyframes.
- **Package.json commands**: Only `pnpm run typecheck` and `pnpm run test:failures` are allowed. Do not run `pnpm dev`, `pnpm build`, drizzle commands (e.g., `drizzle-kit generate`, `db:generate`), or `pnpm run test` directly — always use `test:failures` to avoid polluting context with passing test output.

## Documentation

- [Architecture](.claude/docs/architecture.md) - Database schema, frontend structure, data flow
- [Conventions](.claude/docs/conventions.md) - Code style, components, TypeScript patterns
- [API Reference](.claude/docs/api-reference.md) - REST endpoints and patterns
