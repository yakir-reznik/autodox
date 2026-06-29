# Frontend 401/403 → /manage/unauthorized Redirect

## Context

API endpoints will start returning 401 (unauthenticated) and 403 (forbidden) once server-side authorization checks are added (see `authorization-and-user-roles.md`). Without handling these on the frontend, the user would see a raw error or a broken page. The goal is to redirect the user to `/manage/unauthorized` when any API call inside the management panel returns 401 or 403.

The codebase makes API calls two ways — raw `$fetch` in composables (`useFormBuilder`, `useFormShares`, etc.) and `useFetch` in pages. Both ultimately go through `ofetch`, so a single `$fetch.create()` interceptor in a Nuxt plugin covers both. The fill routes (`/fill/**`) also make API calls, so the interceptor must guard by current route and only redirect when the user is inside `/manage/**`.

---

## Implementation

### Step 1 — Create `app/plugins/management-panel-unauthorized-error-redirect.ts`

New Nuxt plugin that wraps the default `$fetch` with an `onResponseError` hook:

```ts
export default defineNuxtPlugin(() => {
  const router = useRouter();

  globalThis.$fetch = $fetch.create({
    onResponseError({ response }) {
      if (
        (response.status === 401 || response.status === 403) &&
        router.currentRoute.value.path.startsWith("/manage")
      ) {
        router.push("/manage/unauthorized");
      }
    },
  });
});
```

The `path.startsWith("/manage")` guard ensures fill routes, homepage, print routes etc. are unaffected — only requests that originate while the user is on a `/manage/**` page trigger the redirect.

---

## Critical Files

| File                                          | Change                            |
| --------------------------------------------- | --------------------------------- |
| `app/plugins/manage-unauthorized-redirect.ts` | New — global `$fetch` interceptor |

---

## Verification

1. Log in as a user with insufficient permissions and navigate to any `/manage/**` page that triggers a protected API call → should redirect to `/manage/unauthorized`.
2. Open the public form fill page (`/fill/[id]`) and trigger a 403 (e.g., password-protected form) → should NOT redirect to `/manage/unauthorized`; the fill page handles its own error state.
3. Open browser network tab: confirm the interceptor does not swallow the error in a way that breaks `useFetch` error refs elsewhere.
