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
	const route = useRoute();

	// Handle Google OAuth error
	if (route.query.error === "google") {
		error.value = "התחברות עם Google נכשלה";
	}

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

			<div class="relative my-6">
				<div class="absolute inset-0 flex items-center">
					<div class="w-full border-t border-gray-300"></div>
				</div>
				<div class="relative flex justify-center text-sm">
					<span class="px-2 bg-white text-gray-500">או</span>
				</div>
			</div>

			<a
				href="/auth/google"
				class="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
			>
				<svg class="h-5 w-5" viewBox="0 0 24 24">
					<path
						fill="#4285F4"
						d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
					/>
					<path
						fill="#34A853"
						d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
					/>
					<path
						fill="#FBBC05"
						d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
					/>
					<path
						fill="#EA4335"
						d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
					/>
				</svg>
				התחבר עם Google
			</a>
		</div>
	</div>
</template>
