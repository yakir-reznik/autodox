export default defineEventHandler(async (event) => {
	const session = await getUserSession(event);
	const user = session.user
		? {
			...session.user,
			roles: Array.isArray(session.user.roles) ? session.user.roles : [],
		}
		: undefined;

	return {
		...(user ? { user } : {}),
		loggedIn: !!user,
	};
});
