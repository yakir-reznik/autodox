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
				await fetch();
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
	<div dir="rtl" class="flex min-h-screen">
		<!-- Form Panel -->
		<div class="flex-1 flex items-center justify-center p-6 sm:p-12 bg-gray-50">
			<div class="w-full max-w-md">
				<!-- Logo -->
				<div class="mb-8">
					<div class="flex items-center gap-2">
						<div
							class="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center"
						>
							<Icon name="ph:stack-fill" class="w-6 h-6 text-white" />
						</div>
						<h1 class="text-3xl font-bold text-gray-900">Autodox</h1>
					</div>
					<p class="mt-2 text-gray-500">התחבר לחשבון שלך</p>
				</div>

				<!-- Google Sign In -->
				<a
					href="/auth/google"
					class="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50"
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

				<!-- Divider -->
				<div class="relative my-6">
					<div class="absolute inset-0 flex items-center">
						<div class="w-full border-t border-gray-200"></div>
					</div>
					<div class="relative flex justify-center text-sm">
						<span class="px-4 bg-gray-50 text-gray-400">או התחבר עם אימייל</span>
					</div>
				</div>

				<!-- Login Form -->
				<form @submit.prevent="handleLogin" class="space-y-5">
					<div>
						<label for="email" class="block text-sm font-medium text-gray-700 mb-1.5">
							אימייל
						</label>
						<BaseInput
							class="ltr"
							id="email"
							v-model="email"
							type="email"
							placeholder="your@email.com"
							:disabled="loading"
							required
						/>
					</div>

					<div>
						<label
							for="password"
							class="block text-sm font-medium text-gray-700 mb-1.5"
						>
							סיסמה
						</label>
						<BaseInput
							class="ltr"
							id="password"
							v-model="password"
							type="password"
							placeholder="••••••••"
							:disabled="loading"
							required
						/>
					</div>

					<div
						v-if="error"
						class="rounded-xl bg-red-50 border border-red-100 p-3 text-sm text-red-600"
					>
						{{ error }}
					</div>

					<BaseButton
						type="submit"
						variant="primary"
						class="w-full !py-3 !rounded-xl"
						:disabled="loading"
					>
						{{ loading ? "מתחבר..." : "התחבר" }}
					</BaseButton>
				</form>

				<p class="mt-8 text-center text-sm text-gray-500">
					אין לך חשבון?
					<NuxtLink
						to="/signup"
						class="font-semibold text-blue-600 hover:text-blue-500 mr-1"
					>
						הירשם עכשיו
					</NuxtLink>
				</p>
			</div>
		</div>

		<!-- Decorative Panel -->
		<div
			class="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 via-blue-500 to-blue-700 relative overflow-hidden"
		>
			<!-- Background glow orbs -->
			<div
				class="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-pulse-slow"
			></div>
			<div
				class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-400/15 rounded-full blur-3xl animate-pulse-slower"
			></div>

			<!-- Floating shapes - Layer 1 (back, blurred) -->
			<div
				class="absolute top-[15%] left-[10%] w-24 h-24 bg-white/5 rounded-3xl blur-sm animate-drift-1"
			></div>
			<div
				class="absolute bottom-[20%] right-[15%] w-32 h-32 bg-cyan-300/10 rounded-full blur-sm animate-drift-2"
			></div>

			<!-- Floating shapes - Layer 2 (mid) -->
			<div
				class="absolute top-[10%] right-[20%] w-20 h-20 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl animate-float-rotate"
			></div>
			<div
				class="absolute top-[35%] left-[8%] w-16 h-16 bg-yellow-400/25 rounded-full animate-bounce-gentle"
			></div>
			<div
				class="absolute bottom-[25%] right-[25%] w-28 h-28 bg-white/10 rounded-full animate-drift-3"
			></div>
			<div
				class="absolute bottom-[40%] left-[20%] w-14 h-14 bg-emerald-400/20 rounded-xl animate-spin-slow"
			></div>
			<div
				class="absolute top-[50%] left-[35%] w-36 h-36 bg-white/5 rounded-3xl animate-float-diagonal"
			></div>

			<!-- Floating shapes - Layer 3 (front, sharp) -->
			<div
				class="absolute top-[8%] left-[45%] w-10 h-10 bg-pink-400/30 rounded-full animate-bounce-delayed"
			></div>
			<div
				class="absolute top-[25%] right-[8%] w-8 h-8 bg-white/25 rounded-lg animate-ping-slow"
			></div>
			<div
				class="absolute bottom-[15%] left-[40%] w-12 h-12 bg-gradient-to-tr from-violet-400/25 to-fuchsia-400/25 rounded-xl animate-float-rotate-reverse"
			></div>
			<div
				class="absolute bottom-[35%] left-[5%] w-6 h-6 bg-amber-300/35 rounded-full animate-twinkle"
			></div>
			<div
				class="absolute top-[60%] right-[10%] w-10 h-10 bg-white/15 rounded-2xl animate-drift-1"
			></div>

			<!-- Decorative lines -->
			<div
				class="absolute top-[20%] right-[35%] w-px h-32 bg-gradient-to-b from-transparent via-white/20 to-transparent animate-shimmer"
			></div>
			<div
				class="absolute bottom-[30%] left-[30%] w-24 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shimmer-delayed"
			></div>

			<!-- Content -->
			<div class="relative z-10 flex flex-col justify-center px-12 xl:px-20">
				<div class="bg-white/10 backdrop-blur-sm rounded-3xl p-8 max-w-md">
					<h2 class="text-3xl xl:text-4xl font-bold text-white mb-4">ברוכים הבאים!</h2>
					<p class="text-blue-100 text-lg">
						צור טפסים דינמיים בקלות ונהל את המידע שלך במקום אחד
					</p>
				</div>

				<!-- Feature highlights -->
				<div class="mt-12 space-y-4">
					<div class="flex items-center gap-3 text-white/90">
						<div
							class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
						>
							<Icon name="ph:lightning-fill" class="w-5 h-5" />
						</div>
						<span>יצירת טפסים מהירה ופשוטה</span>
					</div>
					<div class="flex items-center gap-3 text-white/90">
						<div
							class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
						>
							<Icon name="ph:share-network-fill" class="w-5 h-5" />
						</div>
						<span>שיתוף בקליק אחד</span>
					</div>
					<div class="flex items-center gap-3 text-white/90">
						<div
							class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"
						>
							<Icon name="ph:chart-bar-fill" class="w-5 h-5" />
						</div>
						<span>צפייה ומעקב אחר תשובות</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style>
	/* Slow pulsing glow */
	@keyframes pulse-slow {
		0%,
		100% {
			opacity: 0.6;
			transform: scale(1);
		}
		50% {
			opacity: 1;
			transform: scale(1.1);
		}
	}
	@keyframes pulse-slower {
		0%,
		100% {
			opacity: 0.5;
			transform: scale(1);
		}
		50% {
			opacity: 0.8;
			transform: scale(1.15);
		}
	}

	/* Drifting movements */
	@keyframes drift-1 {
		0%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		25% {
			transform: translate(20px, -30px) rotate(5deg);
		}
		50% {
			transform: translate(-10px, -50px) rotate(-3deg);
		}
		75% {
			transform: translate(-30px, -20px) rotate(3deg);
		}
	}
	@keyframes drift-2 {
		0%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		33% {
			transform: translate(-40px, 20px) rotate(-8deg);
		}
		66% {
			transform: translate(20px, 40px) rotate(5deg);
		}
	}
	@keyframes drift-3 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(30px, -40px) scale(1.1);
		}
	}

	/* Float with rotation */
	@keyframes float-rotate {
		0% {
			transform: translateY(0) rotate(0deg);
		}
		25% {
			transform: translateY(-25px) rotate(10deg);
		}
		50% {
			transform: translateY(-10px) rotate(0deg);
		}
		75% {
			transform: translateY(-35px) rotate(-10deg);
		}
		100% {
			transform: translateY(0) rotate(0deg);
		}
	}
	@keyframes float-rotate-reverse {
		0% {
			transform: translateY(0) rotate(0deg);
		}
		25% {
			transform: translateY(-20px) rotate(-15deg);
		}
		50% {
			transform: translateY(-5px) rotate(0deg);
		}
		75% {
			transform: translateY(-30px) rotate(15deg);
		}
		100% {
			transform: translateY(0) rotate(0deg);
		}
	}

	/* Diagonal float */
	@keyframes float-diagonal {
		0%,
		100% {
			transform: translate(0, 0) rotate(-12deg);
		}
		50% {
			transform: translate(-25px, -35px) rotate(-5deg);
		}
	}

	/* Gentle bounce */
	@keyframes bounce-gentle {
		0%,
		100% {
			transform: translateY(0) scale(1);
		}
		50% {
			transform: translateY(-20px) scale(1.05);
		}
	}
	@keyframes bounce-delayed {
		0%,
		100% {
			transform: translateY(0);
		}
		40% {
			transform: translateY(-25px);
		}
		60% {
			transform: translateY(-25px);
		}
	}

	/* Slow spin */
	@keyframes spin-slow {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}

	/* Soft ping */
	@keyframes ping-slow {
		0%,
		100% {
			transform: scale(1);
			opacity: 0.8;
		}
		50% {
			transform: scale(1.3);
			opacity: 0.4;
		}
	}

	/* Twinkle effect */
	@keyframes twinkle {
		0%,
		100% {
			opacity: 0.3;
			transform: scale(0.8);
		}
		50% {
			opacity: 1;
			transform: scale(1.2);
		}
	}

	/* Shimmer lines */
	@keyframes shimmer {
		0%,
		100% {
			opacity: 0;
			transform: translateY(20px);
		}
		50% {
			opacity: 1;
			transform: translateY(-20px);
		}
	}
	@keyframes shimmer-delayed {
		0%,
		100% {
			opacity: 0;
			transform: translateX(-20px);
		}
		50% {
			opacity: 1;
			transform: translateX(20px);
		}
	}

	.animate-pulse-slow {
		animation: pulse-slow 8s ease-in-out infinite;
	}
	.animate-pulse-slower {
		animation: pulse-slower 10s ease-in-out infinite 2s;
	}
	.animate-drift-1 {
		animation: drift-1 12s ease-in-out infinite;
	}
	.animate-drift-2 {
		animation: drift-2 15s ease-in-out infinite 1s;
	}
	.animate-drift-3 {
		animation: drift-3 10s ease-in-out infinite 0.5s;
	}
	.animate-float-rotate {
		animation: float-rotate 7s ease-in-out infinite;
	}
	.animate-float-rotate-reverse {
		animation: float-rotate-reverse 8s ease-in-out infinite 1s;
	}
	.animate-float-diagonal {
		animation: float-diagonal 9s ease-in-out infinite;
	}
	.animate-bounce-gentle {
		animation: bounce-gentle 5s ease-in-out infinite;
	}
	.animate-bounce-delayed {
		animation: bounce-delayed 4s ease-in-out infinite 0.5s;
	}
	.animate-spin-slow {
		animation: spin-slow 20s linear infinite;
	}
	.animate-ping-slow {
		animation: ping-slow 3s ease-in-out infinite;
	}
	.animate-twinkle {
		animation: twinkle 2.5s ease-in-out infinite;
	}
	.animate-shimmer {
		animation: shimmer 6s ease-in-out infinite;
	}
	.animate-shimmer-delayed {
		animation: shimmer-delayed 7s ease-in-out infinite 2s;
	}
</style>
