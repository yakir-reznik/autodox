# Conventions

## Code Style

- **Simplicity**: Prefer straightforward solutions over clever ones.
- **Readability**: Optimize for humans reading the code, not machines.
- **Minimal comments**: Only comment non-obvious logic. Good code is self-documenting.
- **No over-engineering**: Solve the current problem, not hypothetical future ones.

## Components

**Naming:**

- PascalCase filenames: `FormBuilder.vue`, `PropertyPanel.vue`
- Prefixes for categories:
  - `Base*` - Base UI components
  - `App*` - App layout components
  - `The*` - Single-instance components

**Organization:**

```
app/components/
├── ui/           # Reusable UI (Button, Input, Select)
├── form-builder/ # Builder feature
└── form-fill/    # Fill feature
```

## TypeScript

- Use `import type` for type-only imports
- Shared types live in `app/types/form-builder.ts`
- Define component props with interfaces:

```typescript
interface Props {
  element: FormElement;
  readonly?: boolean;
}
const props = defineProps<Props>();
```

## Styling

- **Tailwind CSS only** for all styling
- Custom CSS only when necessary for animations/keyframes
- RTL support: Application uses `dir="rtl"` and `lang="he"`
- Design should be simple, minimal, functional, and practical

## Data Fetching

Since SSR is disabled, all data fetching is client-side.

**For reactive data with loading states:**

```typescript
const { data, pending, error } = await useFetch("/api/forms");
```

**For event handlers and one-off requests:**

```typescript
async function deleteForm(id: number) {
  await $fetch(`/api/forms/${id}`, { method: "DELETE" });
}
```

## File-Based Routing

- `pages/index.vue` → `/`
- `pages/forms/index.vue` → `/forms`
- `pages/edit/[id].vue` → `/edit/:id`
- Use `navigateTo()` for programmatic navigation
- Use `<NuxtLink>` for declarative navigation
