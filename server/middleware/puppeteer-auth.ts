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

	// Only process Puppeteer API routes
	if (!isPuppeteerRoute(path, puppeteerApiRoutes)) {
		return;
	}

	const puppeteerSecret = getHeader(event, "X-Puppeteer-Secret");

	if (isValidPuppeteerSecret(puppeteerSecret)) {
		event.context.puppeteerAuthenticated = true;
	}
});
