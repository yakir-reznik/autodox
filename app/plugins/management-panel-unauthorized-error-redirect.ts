export default defineNuxtPlugin(() => {
	const router = useRouter()

	globalThis.$fetch = $fetch.create({
		onResponseError({ response }) {
			if (
				(response.status === 401 || response.status === 403) &&
				router.currentRoute.value.path.startsWith("/manage")
			) {
				router.push("/manage/unauthorized")
			}
		},
	})
})
