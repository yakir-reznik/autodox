export default defineEventHandler((event) => {
	throw createError({
		statusCode: 404,
		message: "API endpoint not found",
	});
});
