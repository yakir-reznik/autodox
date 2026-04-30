export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);

	return {
		...(session.user ? { user: session.user } : {}),
		loggedIn: !!session.user,
	};
});
