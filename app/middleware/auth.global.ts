// Puppeteer page routes that can bypass auth with valid secret header
const puppeteerPageRoutes = ["/print/"];

function isPuppeteerPageRoute(path: string): boolean {
	return puppeteerPageRoutes.some((route) => path.startsWith(route));
}

export default defineNuxtRouteMiddleware(async (to, from) => {
	const { loggedIn, user } = useUserSession();

	// Public routes that don't require authentication
	const publicRoutes = ["/", "/login", "/signup"];

	// Routes that start with /fill are also public
	if (to.path.startsWith("/fill/")) {
		return;
	}

	// Puppeteer routes are accessible with valid secret header (during SSR)
	// On client-side (after hydration), allow if we're on a puppeteer route since SSR already validated
	if (isPuppeteerPageRoute(to.path)) {
		const event = useRequestEvent();
		// Client-side: no request event, but if we got here the server already validated during SSR
		if (!event) {
			return;
		}
		// Server-side: validate the puppeteer secret header
		const puppeteerSecret = event.node?.req?.headers?.["x-puppeteer-secret"];
		const expectedSecret = process.env.PUPPETEER_SECRET;
		if (puppeteerSecret && expectedSecret && puppeteerSecret === expectedSecret) {
			return;
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

	// Only admins can access admin routes (everything except fill)
	if (user.value?.role !== "admin") {
		return navigateTo("/");
	}
});
