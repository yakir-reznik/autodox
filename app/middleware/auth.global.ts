// Puppeteer page routes that can bypass auth with valid secret header
const puppeteerPageRoutes = ["/print/"];

function isPuppeteerPageRoute(path: string): boolean {
	return puppeteerPageRoutes.some((route) => path.startsWith(route));
}

export default defineNuxtRouteMiddleware(async (to, from) => {
	const { loggedIn, user } = useUserSession();

	// Public routes that don't require authentication
	const publicRoutes = [
		"/",
		"/login",
		"/signup",
		"/homepage/1",
		"/homepage/2",
		"/homepage/3",
		"/homepage/4",
	];

	// Routes that start with /fill are also public
	if (to.path.startsWith("/fill/")) {
		return;
	}

	// Puppeteer print routes: allow for puppeteer (secret header) or logged-in admins
	if (isPuppeteerPageRoute(to.path)) {
		// useState carries SSR auth result to client hydration (prevents redirect after SSR validated)
		const puppeteerAuthed = useState("puppeteer-authed", () => false);
		const event = useRequestEvent();
		if (event) {
			// SSR: check puppeteer secret header
			const puppeteerSecret = event.node?.req?.headers?.["x-puppeteer-secret"];
			const expectedSecret = process.env.PUPPETEER_SECRET;
			if (puppeteerSecret && expectedSecret && puppeteerSecret === expectedSecret) {
				puppeteerAuthed.value = true;
				return;
			}
		} else if (puppeteerAuthed.value) {
			// Client-side hydration: SSR already validated the puppeteer secret
			return;
		}
		// Allow logged-in admins (works on both SSR and client)
		if (loggedIn.value && user.value?.roles.includes("admin")) {
			return;
		}
		// Not authenticated — redirect to login
		if (!loggedIn.value) {
			return navigateTo("/login");
		}
		return navigateTo("/");
	}

	// Check if current route is public
	if (publicRoutes.includes(to.path)) {
		// If logged in and trying to access login or signup page, redirect to forms
		if (loggedIn.value && (to.path === "/login" || to.path === "/signup")) {
			return navigateTo("/manage");
		}
		return;
	}

	// For all other routes, require authentication
	if (!loggedIn.value) {
		return navigateTo("/login");
	}

	// Submissions routes: allow authenticated users with specific access rules
	if (to.path === "/manage/submissions" || to.path.startsWith("/manage/submissions/user/")) {
		const match = to.path.match(/^\/manage\/submissions\/user\/(\d+)$/);
		if (match) {
			const targetUserId = Number(match[1]);
			if (user.value?.id !== targetUserId && !user.value?.roles.includes("admin")) {
				return showError({ statusCode: 401 });
			}
		}
		return;
	}

	// Users and admins can access the management panel; viewers are redirected
	if (!user.value?.roles.includes("user")) {
		return navigateTo("/");
	}
});
