/**
 * Routes that Puppeteer can access with the X-Puppeteer-Secret header.
 * These routes bypass normal authentication when the correct secret is provided.
 */

// Page routes (checked by app middleware)
export const puppeteerPageRoutes = ["/print/"];

// API routes (checked by server middleware)
export const puppeteerApiRoutes = ["/api/submissions/"];

/**
 * Check if a path matches any of the allowed Puppeteer routes
 */
export function isPuppeteerRoute(
	path: string,
	routes: string[]
): boolean {
	return routes.some((route) => path.startsWith(route));
}

/**
 * Validate the Puppeteer secret header
 */
export function isValidPuppeteerSecret(secret: string | undefined): boolean {
	const expectedSecret = process.env.PUPPETEER_SECRET;
	return !!secret && !!expectedSecret && secret === expectedSecret;
}
