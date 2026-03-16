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

	// Puppeteer routes: allow with valid secret header (server-side only)
	// Browser users fall through to normal auth checks (must be logged-in admin)
	if (isPuppeteerPageRoute(to.path)) {
		const event = useRequestEvent();
		if (event) {
			const puppeteerSecret = event.node?.req?.headers?.["x-puppeteer-secret"];
			const expectedSecret = process.env.PUPPETEER_SECRET;
			if (puppeteerSecret && expectedSecret && puppeteerSecret === expectedSecret) {
				return;
			}
		}
	}

	// Check if current route is public
	if (publicRoutes.includes(to.path)) {
		// If logged in and trying to access login or signup page, redirect to forms
		if (loggedIn.value && (to.path === "/login" || to.path === "/signup")) {
			return navigateTo("/forms");
		}
		return;
	}

	// For all other routes, require authentication
	if (!loggedIn.value) {
		return navigateTo("/login");
	}

	// Submissions routes: allow authenticated users with specific access rules
	if (to.path === "/submissions" || to.path.startsWith("/submissions/user/")) {
		const match = to.path.match(/^\/submissions\/user\/(\d+)$/);
		if (match) {
			const targetUserId = Number(match[1]);
			if (user.value?.id !== targetUserId && user.value?.role !== "admin") {
				return showError({ statusCode: 401 });
			}
		}
		return;
	}

	// Only admins can access admin routes (everything except fill)
	if (user.value?.role !== "admin") {
		return navigateTo("/");
	}
});
