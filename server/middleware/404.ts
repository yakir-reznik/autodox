export default defineEventHandler((event) => {
	// Only handle API routes that weren't matched
	const url = event.node.req.url;
	if (!url?.startsWith("/api/")) {
		return;
	}

	// Return JSON 404 for unmatched API routes
	throw createError({
		statusCode: 404,
		statusMessage: "Not Found",
		data: {
			message: "API endpoint not found",
		},
	});
});
