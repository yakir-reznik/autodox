export default defineNuxtPlugin(() => {
	const router = useRouter()
	const toasts = useToasts()

	globalThis.$fetch = $fetch.create({
		onResponseError({ response }) {
			if (
				(response.status === 401 || response.status === 403) &&
				router.currentRoute.value.path.startsWith("/manage")
			) {
				// router.push("/manage/unauthorized")
				toasts.add({
					theme: "error",
					title: response.status === 401 ? "נדרשת התחברות" : "אין הרשאה",
					subtitle: response.status === 401 ? "יש להתחבר מחדש כדי להמשיך" : "אין לך הרשאה לבצע פעולה זו",
				})
			}
		},
	})
})
