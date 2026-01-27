import { getHeader } from "h3";
import {
	puppeteerApiRoutes,
	isPuppeteerRoute,
	isValidPuppeteerSecret,
} from "~~/server/utils/puppeteer-routes";

/**
 * Server middleware that checks for Puppeteer authentication on allowed routes.
 * Sets event.context.puppeteerAuthenticated = true if valid secret is provided.
 */
export default defineEventHandler((event) => {
	const path = event.path;

	console.log("[Puppeteer Middleware] Path:", path);
	console.log("[Puppeteer Middleware] Is Puppeteer route:", isPuppeteerRoute(path, puppeteerApiRoutes));

	// Only process Puppeteer API routes
	if (!isPuppeteerRoute(path, puppeteerApiRoutes)) {
		return;
	}

	const puppeteerSecret = getHeader(event, "X-Puppeteer-Secret");
	console.log("[Puppeteer Middleware] Secret received:", !!puppeteerSecret);
	console.log("[Puppeteer Middleware] Secret valid:", isValidPuppeteerSecret(puppeteerSecret));

	if (isValidPuppeteerSecret(puppeteerSecret)) {
		event.context.puppeteerAuthenticated = true;
		console.log("[Puppeteer Middleware] Authenticated!");
	}
});
