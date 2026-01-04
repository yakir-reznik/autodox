<script setup lang="ts">
	useHead({
		title: "Login - Autodox",
	});

	const email = ref("");
	const password = ref("");
	const error = ref("");
	const loading = ref(false);
	const { fetch } = useUserSession();
	const router = useRouter();

	async function handleLogin() {
		error.value = "";
		loading.value = true;

		try {
			const response = await $fetch("/api/auth/login", {
				method: "POST",
				body: {
					email: email.value,
					password: password.value,
				},
			});

			if (response.success) {
				// Refresh the session to ensure it's recognized
				await fetch();
				// Redirect to forms page after successful login
				await router.push("/forms");
			}
		} catch (e: any) {
			error.value = e.data?.statusMessage || "שם משתמש או סיסמא שגויים";
		} finally {
			loading.value = false;
		}
	}
</script>

<template>
	<div dir="rtl" class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
		<div class="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
			<div class="text-center mb-8">
				<h1 class="text-3xl font-bold text-gray-900">Autodox</h1>
				<p class="mt-2 text-sm text-gray-600">התחבר כדי לערוך טפסים</p>
			</div>

			<form @submit.prevent="handleLogin" class="space-y-6">
				<div>
					<label for="email" class="block text-sm font-medium text-gray-700 mb-1">
						אימייל
					</label>
					<UiInput
						class="ltr"
						id="email"
						v-model="email"
						type="email"
						placeholder="israel.israeli@gmail.com"
						:disabled="loading"
						required
					/>
				</div>

				<div>
					<label for="password" class="block text-sm font-medium text-gray-700 mb-1">
						סיסמה
					</label>
					<UiInput
						class="ltr"
						id="password"
						v-model="password"
						type="password"
						placeholder="Aa123456"
						:disabled="loading"
						required
					/>
				</div>

				<div v-if="error" class="rounded-lg bg-red-50 p-3 text-sm text-red-600">
					{{ error }}
				</div>

				<UiButton type="submit" variant="primary" class="w-full" :disabled="loading">
					{{ loading ? "מתחבר..." : "התחבר" }}
				</UiButton>
			</form>
		</div>
	</div>
</template>
