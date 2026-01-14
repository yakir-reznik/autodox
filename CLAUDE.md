# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Autodox is a Nuxt 4 form builder application that allows users to create, edit, and fill dynamic forms. Built with Vue 3, TypeScript, Drizzle ORM, and MySQL. The application is client-side only (SSR disabled) with RTL (Right-to-Left) support for Hebrew language.

## Common Commands

### Development

```bash
# Install dependencies
pnpm install

# Start development server (http://localhost:3000)
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

### Database

Calude code is not alowed to run database commands. Ask the operator to run these instead

```bash
# Generate Drizzle migrations
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate

# Create admin user (bootstrap script)
npx tsx scripts/create-admin.ts

# Start MySQL server (macOS)
brew services start mysql

# Connect to MySQL via terminal
mysql -u root -p
```

Database connection string: `mysql://root:e18e18@localhost:3306/autodox`

## High-Level Architecture

### Database Schema (Drizzle ORM + MySQL)

**Three main tables:**

1. **users_table** - User management with role-based access (admin|viewer)
2. **forms_table** - Form metadata (title, description, status, creator, timestamps)
3. **form_elements_table** - Form elements with hierarchical structure

**Critical architectural patterns:**

- **Dual ID System**: Elements have both `clientId` (temporary, client-side) and `id` (database). The form builder composable maintains mapping between tempIds and real IDs during save operations.

- **Fractional Positioning**: Elements use decimal `position` values (0.5, 1.0, 1.5, etc.) for drag-and-drop reordering without renumbering entire sequences.

- **Soft Deletion**: Elements use `isDeleted` flag instead of hard deletes to maintain data integrity.

- **Hierarchical Elements**: Elements can be nested using `parentId` (sections contain child elements).

- **JSON Configuration**: Element-specific settings stored in flexible `config` JSON field that varies by element type.

**23 supported element types:**

- Input fields: text, email, number, textarea, date, time, datetime
- Selection fields: dropdown, radio, checkbox, checkboxes
- Special: signature
- Layout: heading_h1, heading_h2, heading_h3, paragraph, image, video, divider, spacer, section

### Frontend Architecture

**Composables** (app/composables/):

- `useFormBuilder.ts` - Core state management with reactive element tracking, CRUD operations, and dual ID mapping
- `useAutoSave.ts` - Debounced auto-save (2 seconds) with status tracking
- `useElementDefaults.ts` - Default configurations for all element types and utility functions

**Component Structure:**

- `app/components/ui/` - Reusable UI components (Button, Input, Select, etc.)
- `app/components/form-builder/` - Form builder editor components
  - `FormBuilder.vue` - Root component orchestrating builder state, auto-save, and three-panel layout
  - `FormCanvas.vue` - Drag-drop canvas using vuedraggable
  - `ElementPalette.vue` - Categorized element library with clone-based dragging
  - `PropertyPanel.vue` - Context-sensitive property editor
  - `elements/` - Render components for each element type in builder mode
  - `properties/` - Property panel editors for different element types
- `app/components/form-fill/` - Form rendering components for fill mode

**Pages:**

- `/` - Landing page
- `/forms` - Forms list
- `/forms/new` - Creates new form and redirects to editor
- `/edit/[id]` - Form builder editor
- `/fill/[id]` - Form filling interface

### API Routes (server/api/forms/)

RESTful API with standard CRUD operations:

- `GET /api/forms` - List all forms
- `POST /api/forms` - Create form
- `GET /api/forms/[id]` - Get form with elements (filters soft-deleted)
- `PATCH /api/forms/[id]` - Update form metadata
- `DELETE /api/forms/[id]` - Delete form (cascade deletes elements)
- `PUT /api/forms/[id]/elements` - **Complex bulk operation**: handles create/update/soft-delete of elements, maps tempIds to real IDs, resolves parent references

### Key Data Flow

**Form Editing Flow:**

1. Load form via `GET /api/forms/[id]`
2. Convert server elements to builder elements (add clientId)
3. User modifies elements → `isDirty` flag set
4. Auto-save debounces → `PUT /api/forms/[id]/elements`
5. Server processes bulk operation, maps tempIds to real IDs
6. Client updates local state with real IDs from server response

**Element ID Mapping:**

- New elements get temporary clientId (e.g., `temp-123`)
- On save, server assigns real database ID
- Server returns mapping: `{ tempIdMap: { 'temp-123': 45 } }`
- Client updates elements and parent references with real IDs

### Technology Stack

- **Frontend**: Nuxt 4 (SSR disabled), Vue 3, TypeScript
- **Styling**: TailwindCSS with RTL support
- **Database**: MySQL with Drizzle ORM
- **Key Libraries**:
  - vuedraggable - Drag-and-drop
  - mysql2 - Database driver
  - drizzle-orm & drizzle-kit - Type-safe ORM

### Important Conventions

- **RTL Support**: Application is built for Hebrew (dir="rtl", lang="he")
- **Styling**: Use Tailwind CSS for all styling. Only use custom CSS/Sass when absolutely necessary for complex animations, keyframes, or styles that cannot be achieved with Tailwind utilities.
- **Type Safety**: Shared types between server schema and client in `app/types/form-builder.ts`
- **Element Configuration**: Each element type has a specific config shape defined in `useElementDefaults.ts`
- **Validation Rules**: Stored in element config, structure varies by field type
- **Parent References**: When saving nested elements, tempIds in parentId must be resolved to real IDs

## Nuxt Best Practices

### Component Naming

- **Use PascalCase** for component filenames: `FormBuilder.vue`, `PropertyPanel.vue`
- **Multi-word names** are required (avoid single-word components like `Button.vue` in app code; use `BaseButton.vue` or `UiButton.vue`)
- **Prefixes for component types**:
  - `Base*` - Base UI components (BaseButton, BaseInput)
  - `App*` - App-specific layout components (AppHeader, AppSidebar)
  - `The*` - Single-instance components (TheNavbar, TheFooter)
- **Organize by feature**: Keep related components together in feature directories
  - `app/components/form-builder/` - Form builder feature
  - `app/components/form-fill/` - Form filling feature
  - `app/components/ui/` - Reusable UI components

### Data Loading

**Server-Side Data Fetching (SSR/SSG):**

- Use `useFetch()` for API calls that should run on server and hydrate on client
- Use `useAsyncData()` for more control over data fetching and caching

```typescript
// Good - runs on server, hydrates on client
const { data, pending, error } = await useFetch("/api/forms");

// Good - with custom key and transform
const { data } = await useAsyncData("forms", () => $fetch("/api/forms"));
```

**Client-Side Only Data Fetching:**

- Use `$fetch` directly for client-side only requests
- Wrap in `onMounted` or use inside event handlers

```typescript
// Good - client-side only
async function deleteForm(id: number) {
  await $fetch(`/api/forms/${id}`, { method: "DELETE" });
}
```

**Important Notes:**

- This app has SSR disabled (`ssr: false` in nuxt.config), so all data fetching is client-side
- Still use composables for consistency and potential future SSR enablement
- `useFetch` and `useAsyncData` provide better DX with reactivity and loading states

### Auto-Imports

Nuxt automatically imports:

- Components from `app/components/`
- Composables from `app/composables/`
- Utils from `app/utils/`
- Vue APIs (`ref`, `computed`, `watch`, etc.)
- Nuxt APIs (`navigateTo`, `useFetch`, etc.)

**Do NOT manually import** these - rely on auto-imports:

```typescript
// Bad - unnecessary imports
import { ref, computed } from "vue";
import { navigateTo } from "nuxt/app";

// Good - auto-imported
const count = ref(0);
const doubled = computed(() => count.value * 2);
await navigateTo("/forms");
```

### Composables

- **Naming**: Prefix with `use` (useFormBuilder, useAutoSave)
- **Location**: Place in `app/composables/` for auto-import
- **State**: Use composables for shared state and logic
- **Return object**: Return reactive refs/computed values and methods

```typescript
// Good composable pattern
export function useFormBuilder() {
  const elements = ref<FormElement[]>([]);
  const selectedElement = ref<FormElement | null>(null);

  const addElement = (element: FormElement) => {
    elements.value.push(element);
  };

  return {
    elements,
    selectedElement,
    addElement,
  };
}
```

### File-Based Routing

- **Pages**: Files in `app/pages/` automatically create routes
  - `pages/index.vue` → `/`
  - `pages/forms/index.vue` → `/forms`
  - `pages/edit/[id].vue` → `/edit/:id` (dynamic route)
- **Navigation**: Use `navigateTo()` for programmatic navigation
- **Links**: Use `<NuxtLink>` for declarative navigation

### API Routes

- **Location**: `server/api/` directory
- **File naming**:
  - `server/api/forms/index.get.ts` → `GET /api/forms`
  - `server/api/forms/index.post.ts` → `POST /api/forms`
  - `server/api/forms/[id].get.ts` → `GET /api/forms/:id`
  - `server/api/forms/[id]/elements.put.ts` → `PUT /api/forms/:id/elements`
- **Event handlers**: Use `defineEventHandler()`
- **Request data**: Use `getQuery()`, `readBody()`, `getRouterParams()`

```typescript
// Good API route pattern
export default defineEventHandler(async (event) => {
  const { id } = getRouterParams(event);
  const body = await readBody(event);
  // ... handle request
  return { success: true, data: result };
});
```

### TypeScript

- **Enable strict mode**: Already configured in this project
- **Type imports**: Use `import type` for type-only imports
- **Component props**: Define with TypeScript interfaces
- **API types**: Share types between client and server

```typescript
// Good - type-only import
import type { FormElement } from "~/types/form-builder";

// Good - typed component props
interface Props {
  element: FormElement;
  readonly?: boolean;
}

const props = defineProps<Props>();
```

### Performance

- **Debounce frequent operations**: Use `useDebounceFn()` or custom debounce
- **Avoid unnecessary reactivity**: Use `shallowRef()` for large objects when deep reactivity isn't needed
- **Virtual scrolling**: For large lists (already using draggable in this project)

### Common Patterns in This Project

- **Soft deletes**: Mark as deleted rather than removing from database
