# CLAUDE.md

Autodox is a **Nuxt 4** form builder for creating and filling dynamic forms (Vue 3, TypeScript, Drizzle ORM, MySQL).

## Key Facts

- **Hebrew RTL**: All UI text is in Hebrew. The app uses `dir="rtl"` and `lang="he"`.
- **SSR disabled**: Client-side only rendering.
- **Type safety**: Shared types between client and server in `app/types/form-builder.ts`.
- **Auto-imports**: Nuxt auto-imports Vue APIs (`ref`, `computed`), composables from `app/composables/`, and components from `app/components/`. No manual imports needed.

## Core Principles

- **Simplicity first**: Write simple, practical, human-readable code. Avoid over-engineering.
- **Suggest alternatives**: If you see a better solution to what I'm asking for, suggest it before implementing.
- **Minimal comments**: Code should be self-explanatory. Only comment non-obvious logic.
- **Modular structure**: Keep files focused. Extract reusable logic to composables, components to separate files, and shared types to `app/types/`.

## Commands

```bash
pnpm dev      # Start dev server (http://localhost:3000)
pnpm build    # Build for production
```

## Constraints

- **No database commands**: Ask the operator to run migrations, schema changes, etc.
- **Tailwind only**: Avoid custom CSS unless absolutely necessary for animations/keyframes.
- **Plans location**: Save implementation plans to `.claude/plans/` as kebab-case markdown files.

## Documentation

- [Architecture](.claude/docs/architecture.md) - Database schema, frontend structure, data flow
- [Conventions](.claude/docs/conventions.md) - Code style, components, TypeScript patterns
- [API Reference](.claude/docs/api-reference.md) - REST endpoints and patterns
