# CLAUDE.md

Guidance for Claude Code when working with this Nuxt 4 form builder application.

## Project Overview

**Autodox**: Nuxt 4 form builder (Vue 3, TypeScript, Drizzle ORM, MySQL)
- Client-side only (SSR disabled)
- RTL support for Hebrew (dir="rtl", lang="he")
- 23 element types (text, email, number, textarea, date, time, datetime, dropdown, radio, checkbox, checkboxes, signature, headings, paragraph, image, video, divider, spacer, section)

## Commands

**Dev**: `pnpm dev` | **Build**: `pnpm build` | **Preview**: `pnpm preview`

**Database** (ask operator to run):
- `npx drizzle-kit generate` - Generate migrations
- `npx drizzle-kit migrate` - Run migrations
- `npx tsx scripts/create-admin.ts` - Create admin user
- DB connection: `mysql://root:e18e18@localhost:3306/autodox`

## Architecture

### Database (3 tables)
- **users_table**: Role-based access (admin|viewer)
- **forms_table**: Form metadata
- **form_elements_table**: Hierarchical elements with soft deletion

**Critical patterns**:
- **Dual ID**: Elements have `clientId` (temp) + `id` (DB). Server maps `temp-*` to real IDs
- **Fractional positioning**: 0.5, 1.0, 1.5 for drag-drop without full renumbering
- **Soft deletion**: `isDeleted` flag instead of hard delete
- **Hierarchical**: `parentId` for nesting (sections contain children)
- **JSON config**: Element-specific settings vary by type

### Frontend Structure
- **Composables**: `useFormBuilder` (state + CRUD), `useAutoSave` (2s debounce), `useElementDefaults`
- **Components**: `app/components/ui/`, `form-builder/`, `form-fill/`
- **Pages**: `/forms` (list), `/forms/new`, `/edit/[id]`, `/fill/[id]`

### API Routes
- `GET /api/forms` - List, `POST /api/forms` - Create
- `GET|PATCH|DELETE /api/forms/[id]` - CRUD operations
- `PUT /api/forms/[id]/elements` - Bulk upsert with tempId mapping

### Data Flow
1. Load form → add `clientId` to elements
2. Modify → set `isDirty` → auto-save debounce
3. Save → server maps tempIds to real IDs → client updates refs

## Nuxt Best Practices

### Project Structure
- Use `app/` directory (Nuxt 4 default)
- Pages in `app/pages/`, auto-routing enabled
- API routes in `server/api/`, auto-registered
- Composables in `app/composables/`, auto-imported
- Components in `app/components/`, auto-imported
- Types in `app/types/`, share between client/server

### Composables
- Prefix with `use*` (e.g., `useFormBuilder`)
- Keep composables pure and reusable
- Use `useState` for shared state across components
- Avoid side effects in composable initialization

### Components
- Use `<script setup>` syntax
- Extract reusable UI to `app/components/ui/`
- Feature components in domain folders (e.g., `form-builder/`)
- Use TypeScript with proper type inference

### API Routes
- Use `defineEventHandler` for all endpoints
- Return objects directly (auto JSON serialization)
- Use proper HTTP methods (GET, POST, PATCH, DELETE, PUT)
- Handle errors with `createError` or `throw` with status codes
- Validate input with Zod or similar

### State Management
- Use composables with `useState` for simple state
- Avoid Pinia/Vuex unless truly needed
- Keep state close to where it's used

### Performance
- Use `useLazyAsyncData` or `useLazyFetch` for non-blocking data
- Avoid `await` in `<script setup>` top level (blocks hydration)
- Use `v-once` for static content, `v-memo` for expensive lists
- Lazy load heavy components with `defineAsyncComponent`

### TypeScript
- Enable strict mode in `tsconfig.json`
- Use `type` over `interface` for consistency
- Define shared types in `app/types/`
- Avoid `any`, use `unknown` when type is unclear

### Security
- Validate all user input on server side
- Use parameterized queries (Drizzle prevents SQL injection)
- Sanitize HTML if rendering user content
- Add CORS headers if needed in `nuxt.config.ts`

### Code Quality
- Keep components under 300 lines (extract smaller components)
- Limit composable complexity (single responsibility)
- Use meaningful variable names (no `temp`, `data`, `item`)
- Avoid deep nesting (max 3 levels)

## Project-Specific Conventions

- **RTL**: All layouts must support RTL (use `start`/`end` instead of `left`/`right`)
- **Types**: Share types in `app/types/form-builder.ts`
- **Element config**: Check `useElementDefaults.ts` for type-specific shapes
- **Validation**: Stored in element config, structure varies by field type
- **Parent refs**: Resolve tempIds to real IDs when saving nested elements
