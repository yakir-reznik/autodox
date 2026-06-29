# Management Panel Sidebar

## Context

The app has a `/manage` route with a `management-panel` layout that is currently empty. A navigation sidebar is needed to serve all management pages. The sidebar should use shadcn-vue's Sidebar component system, be collapsible, and appear on the right (the app is Hebrew RTL).

---

## Step 1 — Build `app/components/management-panel/Sidebar.vue`

Replace the empty file with a full sidebar component.

**Script setup:**
```ts
const { user, clear } = useUserSession()
const route = useRoute()

const mainNavItems = [
  { label: 'לוח בקרה', to: '/manage', icon: 'heroicons:squares-2x2' },
  { label: 'ניהול טפסים', to: '/forms', icon: 'heroicons:document-text' },
  { label: 'טפסים משותפים', to: '/forms/shared', icon: 'heroicons:users' },
  { label: 'הגשות', to: '/submissions', icon: 'heroicons:inbox-stack' },
  { label: 'פרופיל וחשבון', to: '/user', icon: 'heroicons:user-circle' },
]

const adminNavItems = computed(() =>
  user.value?.role === 'admin'
    ? [
        { label: 'דוחות', to: '/admin/reports', icon: 'heroicons:chart-bar' },
      ]
    : []
)

const actionItems = [
  { label: 'יצירת טופס חדש', to: '/forms/new', icon: 'heroicons:document-plus' },
  // NOTE: "יצירת הגשה חדשה" is UI-only for now — the full flow requires a form-picker
  // pre-modal (not yet built). Render as a disabled-looking link or a plain button with no
  // `to` prop. Do NOT wire up any navigation or query-param logic. This is a future task.
  { label: 'יצירת הגשה חדשה', to: null, icon: 'heroicons:plus-circle', disabled: true },
]

const isActive = (to: string) =>
  route.path === to || (to !== '/manage' && route.path.startsWith(to))

async function handleLogout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  navigateTo('/login')
}
```

**Template structure:**
```
<UiSidebar side="right" collapsible="icon">
  <UiSidebarHeader>
    <!-- Logo block: icon + "Autodox" text -->
    <!-- Use data-[state=collapsed]:hidden on text span -->
  </UiSidebarHeader>

  <UiSidebarContent>
    <!-- Group: ניווט (mainNavItems) -->
    <!-- Group: ניהול (adminNavItems, v-if adminNavItems.length) -->
    <!-- Group: פעולות (actionItems) — same pattern but label "פעולות" -->
    <!-- Each item: <UiSidebarMenuItem> > <UiSidebarMenuButton as-child :is-active="isActive(item.to)"> > <NuxtLink :to="item.to"> > <Icon> + <span> -->
  </UiSidebarContent>

  <UiSidebarFooter>
    <!-- User name + email block -->
    <!-- Link to /user (פרופיל משתמש) -->
    <!-- Logout button calling handleLogout() -->
  </UiSidebarFooter>
</UiSidebar>
```

**Key implementation details:**
- `side="right"` anchors sidebar to the right edge (RTL)
- `collapsible="icon"` collapses to icon-only strip (RTL-safe — no translateX)
- `as-child` on `<UiSidebarMenuButton>` lets `<NuxtLink>` be the rendered element
- Use `data-[state=collapsed]:hidden` on text labels in header and nav items so they hide when collapsed (shadcn sidebar sets `data-state` attribute on the root)
- User footer: `user.value?.name`, `user.value?.email`

---

## Step 2 — Update `app/layouts/management-panel.vue`

Replace the current bare `<div>` with a proper `SidebarProvider` layout:

```vue
<template>
  <UiSidebarProvider>
    <UiSidebarInset class="flex flex-col min-h-svh">
      <header class="flex items-center gap-2 border-b px-4 py-3 h-14">
        <UiSidebarTrigger />
        <slot name="header" />
      </header>
      <main class="flex-1 overflow-auto p-6">
        <slot />
      </main>
    </UiSidebarInset>
    <ManagementPanelSidebar />
  </UiSidebarProvider>
</template>
```

**Key points:**
- `<ManagementPanelSidebar />` comes after `<UiSidebarInset>` in DOM order — in RTL flex, this places it on the right
- `<UiSidebarTrigger />` goes in the header, at `flex-start` = right in RTL, adjacent to the sidebar edge
- Named `#header` slot lets pages inject breadcrumbs or titles
- Remove the old `<div id="management-panel">` wrapper

---

## Step 3 — Note on auth middleware

`app/middleware/auth.global.ts` line 82: non-admins are redirected to `/`. Currently `/manage` is admin-only. If you want all logged-in users to access manage pages, add an exception before line 82. For now, leave as-is (admin-only).

---

## Critical Files

- `app/components/management-panel/Sidebar.vue` — main work
- `app/layouts/management-panel.vue` — wrap with SidebarProvider
- `app/middleware/auth.global.ts` — no change needed unless access rules change

---

## Verification

1. Run `pnpm dev` and navigate to `/manage` (as admin)
2. Sidebar should appear on the right with nav items
3. Click the trigger button — sidebar should collapse to icon-only strip
4. Click each nav link — verify active state highlights correctly
5. Logout button — should clear session and redirect to `/login`
6. Test as non-admin: verify admin-only items (דוחות) are hidden
