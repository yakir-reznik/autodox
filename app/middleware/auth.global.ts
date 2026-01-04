export default defineNuxtRouteMiddleware(async (to, from) => {
	const { loggedIn, user } = useUserSession();

	// Public routes that don't require authentication
	const publicRoutes = ["/", "/login"];

	// Routes that start with /fill are also public
	if (to.path.startsWith("/fill/")) {
		return;
	}

	// Check if current route is public
	if (publicRoutes.includes(to.path)) {
		// If logged in and trying to access login page, redirect to forms
		if (loggedIn.value && to.path === "/login") {
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
