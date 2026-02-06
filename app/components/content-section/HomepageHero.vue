<script setup lang="ts">
defineProps<{
	scrollTo: (id: string) => void;
}>();
</script>

<template>
	<!-- ==================== HERO ==================== -->
	<section class="relative min-h-screen overflow-hidden bg-slate-950 pt-16">
		<div class="dot-grid absolute inset-0"></div>

		<div
			class="pointer-events-none absolute top-[-20%] right-[-10%] h-[700px] w-[700px] rounded-full bg-blue-600/15 blur-[120px] mesh-1"
		></div>
		<div
			class="pointer-events-none absolute top-[20%] left-[-15%] h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-[100px] mesh-2"
		></div>
		<div
			class="pointer-events-none absolute bottom-[-10%] right-[20%] h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[80px] mesh-3"
		></div>

		<div
			class="absolute top-[18%] right-[10%] h-16 w-16 rounded-2xl border border-blue-400/10 shape-float"
		></div>
		<div
			class="absolute top-[45%] left-[8%] h-12 w-12 rounded-full border border-violet-400/15 shape-float-delayed"
		></div>
		<div
			class="absolute bottom-[30%] right-[22%] h-8 w-8 rotate-45 rounded-lg border border-cyan-400/10 shape-spin"
		></div>

		<div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
			<div
				class="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center pb-20 pt-12"
			>
				<div class="mx-auto max-w-3xl text-center">
					<h1
						class="hero-enter text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
					>
						<span class="text-white">טפסים חכמים.</span>
						<br />
						<span
							class="bg-linear-to-l from-blue-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent"
						>
							תוצאות אמיתיות.
						</span>
					</h1>

					<p
						class="hero-enter-d2 mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400 sm:text-xl"
					>
						צור טפסים דינמיים בדקות עם ממשק גרירה ושחרור. שתף, אסוף ונתח תשובות —
						הכל במקום אחד.
					</p>

					<div
						class="hero-enter-d3 mt-10 flex flex-wrap items-center justify-center gap-4"
					>
						<NuxtLink to="/signup">
							<BaseButton
								variant="primary"
								size="lg"
								class="!rounded-xl !px-8 !py-3.5 !text-base"
							>
								<Icon name="ph:rocket-launch-fill" class="h-5 w-5" />
								התחל בחינם
							</BaseButton>
						</NuxtLink>
						<button
							@click="scrollTo('features')"
							class="flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 px-8 py-3.5 text-base font-medium text-white/80 transition-all hover:border-white/20 hover:bg-white/5 hover:text-white"
						>
							גלה עוד
							<Icon name="ph:arrow-down" class="h-4 w-4" />
						</button>
					</div>
				</div>

				<!-- Form mockup -->
				<div
					class="hero-enter-d4 relative mx-auto mt-16 w-full max-w-2xl"
					style="perspective: 1200px"
				>
					<div style="transform: rotateY(-2deg) rotateX(3deg)">
						<div
							class="absolute -inset-8 rounded-3xl bg-blue-500/10 blur-2xl"
						></div>

						<div
							class="relative overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-blue-500/10"
						>
							<div
								class="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-4 py-3"
							>
								<div class="flex gap-1.5">
									<div class="h-2.5 w-2.5 rounded-full bg-red-400"></div>
									<div class="h-2.5 w-2.5 rounded-full bg-yellow-400"></div>
									<div class="h-2.5 w-2.5 rounded-full bg-green-400"></div>
								</div>
								<div
									dir="ltr"
									class="flex-1 rounded-md bg-white px-3 py-1 text-center font-mono text-[11px] text-gray-400"
								>
									autodox.app/fill/event-2025
								</div>
							</div>

							<div dir="rtl" class="space-y-5 p-6 sm:p-8">
								<div class="mockup-field" style="animation-delay: 1s">
									<h3 class="text-lg font-bold text-gray-900">
										טופס הרשמה לכנס 2025
									</h3>
									<p class="mt-1 text-sm text-gray-400">
										מלא את הפרטים שלך להרשמה
									</p>
								</div>

								<div class="mockup-field" style="animation-delay: 1.2s">
									<label
										class="mb-1.5 block w-full text-sm font-medium text-gray-700"
									>
										שם מלא
									</label>
									<div
										class="flex h-10 w-full items-center rounded-lg border border-gray-200 bg-gray-50 px-3"
									>
										<span class="text-sm text-gray-900">ישראל ישראלי</span>
										<span
											class="typing-cursor mr-0.5 h-4 w-0.5 bg-blue-500"
										></span>
									</div>
								</div>

								<div class="mockup-field" style="animation-delay: 1.4s">
									<label
										class="mb-1.5 block w-full text-sm font-medium text-gray-700"
									>
										אימייל
									</label>
									<div
										class="flex h-10 w-full items-center rounded-lg border border-gray-200 bg-white px-3"
									>
										<span dir="ltr" class="text-sm text-gray-300"
											>your@email.com</span
										>
									</div>
								</div>

								<div class="mockup-field" style="animation-delay: 1.6s">
									<label
										class="mb-2 block w-full text-sm font-medium text-gray-700"
									>
										בחר מסלול
									</label>
									<div class="flex w-full gap-4">
										<label class="flex items-center gap-2">
											<div
												class="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 border-blue-500"
											>
												<div
													class="h-2 w-2 rounded-full bg-blue-500"
												></div>
											</div>
											<span class="text-sm text-gray-700">מתחילים</span>
										</label>
										<label class="flex items-center gap-2">
											<div
												class="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300"
											></div>
											<span class="text-sm text-gray-500">מתקדמים</span>
										</label>
										<label class="flex items-center gap-2">
											<div
												class="h-4 w-4 shrink-0 rounded-full border-2 border-gray-300"
											></div>
											<span class="text-sm text-gray-500">מקצוענים</span>
										</label>
									</div>
								</div>

								<div class="mockup-field" style="animation-delay: 1.8s">
									<div
										class="flex h-10 w-full items-center justify-center rounded-lg bg-blue-600"
									>
										<span class="text-sm font-medium text-white"
											>שלח טופס</span
										>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Floating badges -->
					<div
						class="badge-enter absolute -top-3 -left-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg sm:-top-4 sm:-left-6"
						style="animation-delay: 2s"
					>
						<div
							class="flex h-7 w-7 items-center justify-center rounded-full bg-green-100"
						>
							<Icon
								name="ph:check-circle-fill"
								class="h-4 w-4 text-green-500"
							/>
						</div>
						<span class="whitespace-nowrap text-xs font-medium text-gray-700"
							>שמירה אוטומטית</span
						>
					</div>

					<div
						class="badge-enter absolute -bottom-3 -right-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg sm:-bottom-4 sm:-right-6"
						style="animation-delay: 2.3s"
					>
						<div
							class="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100"
						>
							<Icon name="ph:users-fill" class="h-4 w-4 text-blue-500" />
						</div>
						<span class="whitespace-nowrap text-xs font-medium text-gray-700"
							>24 תשובות חדשות</span
						>
					</div>
				</div>

				<!-- Scroll indicator -->
				<div class="hero-enter-d4 mt-12">
					<button
						@click="scrollTo('stats')"
						class="scroll-indicator flex h-10 w-6 cursor-pointer items-start justify-center rounded-full border border-white/20 pt-1.5"
					>
						<div class="scroll-dot h-2 w-1 rounded-full bg-white/50"></div>
					</button>
				</div>
			</div>
		</div>
	</section>
</template>
