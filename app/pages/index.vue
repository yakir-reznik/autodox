<script setup lang="ts">
	definePageMeta({
		layout: false,
	});

	useHead({
		title: "Autodox - בונה הטפסים החכם",
		meta: [
			{
				name: "description",
				content:
					"צור טפסים דינמיים ומקצועיים בדקות. גרור ושחרר, לוגיקה חכמה, עיצובים מותאמים ועוד.",
			},
		],
		bodyAttrs: {
			style: "background-color: #020617",
		},
	});

	const scrolled = ref(false);
	const statsTriggered = ref(false);

	const counters = reactive({
		users: 0,
		forms: 0,
		submissions: 0,
		uptime: 0,
	});

	function animateCounter(
		key: keyof typeof counters,
		target: number,
		duration: number,
		decimals = 0,
	) {
		const start = performance.now();
		const tick = (now: number) => {
			const t = Math.min((now - start) / duration, 1);
			const eased = 1 - Math.pow(1 - t, 3);
			counters[key] = Number((eased * target).toFixed(decimals));
			if (t < 1) requestAnimationFrame(tick);
		};
		requestAnimationFrame(tick);
	}

	function triggerCounters() {
		if (statsTriggered.value) return;
		statsTriggered.value = true;
		animateCounter("users", 12500, 2000);
		animateCounter("forms", 48000, 2500);
		animateCounter("submissions", 250000, 3000);
		animateCounter("uptime", 99.9, 1500, 1);
	}

	function scrollTo(id: string) {
		document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
	}

	onMounted(() => {
		const onScroll = () => {
			scrolled.value = window.scrollY > 50;
		};
		window.addEventListener("scroll", onScroll, { passive: true });

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("revealed");
						if (entry.target.hasAttribute("data-stats")) triggerCounters();
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
		);

		nextTick(() => {
			document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
		});

		onUnmounted(() => {
			window.removeEventListener("scroll", onScroll);
			observer.disconnect();
		});
	});

	const features = [
		{
			icon: "ph:hand-grabbing-fill",
			title: "גרור ושחרר",
			desc: "בנה טפסים בקלות עם ממשק אינטואיטיבי. פשוט גרור רכיבים למקום הרצוי.",
			color: "text-blue-500",
			bg: "bg-blue-500/10",
		},
		{
			icon: "ph:git-branch-fill",
			title: "לוגיקה מותנית",
			desc: "הצג או הסתר שדות אוטומטית לפי תשובות קודמות. טפסים חכמים באמת.",
			color: "text-violet-500",
			bg: "bg-violet-500/10",
		},
		{
			icon: "ph:palette-fill",
			title: "ערכות עיצוב",
			desc: "בחר מתוך ערכות נושא מעוצבות מראש או התאם צבעים וסגנונות.",
			color: "text-pink-500",
			bg: "bg-pink-500/10",
		},
		{
			icon: "ph:share-network-fill",
			title: "שיתוף בקליק",
			desc: "שתף טפסים בקישור ישיר, QR קוד, או הטמע באתר שלך.",
			color: "text-emerald-500",
			bg: "bg-emerald-500/10",
		},
		{
			icon: "ph:chart-bar-fill",
			title: "מעקב תשובות",
			desc: "צפה בתשובות בזמן אמת. סנן, מיין וייצא נתונים בקלות.",
			color: "text-amber-500",
			bg: "bg-amber-500/10",
		},
		{
			icon: "ph:devices-fill",
			title: "מותאם לכל מסך",
			desc: "הטפסים שלך נראים מושלם בנייד, טאבלט ומחשב.",
			color: "text-cyan-500",
			bg: "bg-cyan-500/10",
		},
		{
			icon: "ph:shield-check-fill",
			title: "הגנה בסיסמה",
			desc: "הגן על הטפסים שלך עם סיסמה או טוקן. שליטה מלאה בגישה.",
			color: "text-slate-500",
			bg: "bg-slate-500/10",
		},
		{
			icon: "ph:file-pdf-fill",
			title: "ייצוא ל-PDF",
			desc: "ייצא תשובות ל-PDF מקצועי בלחיצת כפתור.",
			color: "text-red-500",
			bg: "bg-red-500/10",
		},
	];
</script>

<template>
	<div dir="rtl" lang="he" class="overflow-x-hidden bg-white">
		<!-- ==================== NAVIGATION ==================== -->
		<nav
			class="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
			:class="
				scrolled
					? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10'
					: 'bg-transparent'
			"
		>
			<div class="mx-auto max-w-7xl px-6 lg:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center gap-2.5">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-700"
						>
							<Icon name="ph:stack-fill" class="h-5 w-5 text-white" />
						</div>
						<span class="text-xl font-bold text-white">Autodox</span>
					</div>

					<div class="hidden items-center gap-8 md:flex">
						<button
							@click="scrollTo('features')"
							class="cursor-pointer text-sm text-white/60 transition-colors hover:text-white"
						>
							יתרונות
						</button>
						<button
							@click="scrollTo('how-it-works')"
							class="cursor-pointer text-sm text-white/60 transition-colors hover:text-white"
						>
							איך זה עובד?
						</button>
						<NuxtLink
							to="/login"
							class="text-sm text-white/60 transition-colors hover:text-white"
						>
							התחברות
						</NuxtLink>
						<NuxtLink to="/signup">
							<BaseButton variant="primary" size="sm">התחל בחינם</BaseButton>
						</NuxtLink>
					</div>

					<div class="flex items-center gap-3 md:hidden">
						<NuxtLink
							to="/login"
							class="text-sm text-white/60 transition-colors hover:text-white"
						>
							התחברות
						</NuxtLink>
						<NuxtLink to="/signup">
							<BaseButton variant="primary" size="sm">התחל בחינם</BaseButton>
						</NuxtLink>
					</div>
				</div>
			</div>
		</nav>

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
								<Icon name="ph:check-circle-fill" class="h-4 w-4 text-green-500" />
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

		<!-- ==================== STATS ==================== -->
		<section
			id="stats"
			data-stats
			class="reveal relative bg-linear-to-l from-blue-600 via-blue-700 to-indigo-700 py-12"
		>
			<div class="mx-auto max-w-7xl px-6 lg:px-8">
				<div class="grid grid-cols-2 gap-8 lg:grid-cols-4">
					<div class="text-center">
						<div class="text-3xl font-extrabold text-white sm:text-4xl">
							{{ counters.users.toLocaleString() }}+
						</div>
						<div class="mt-1 text-sm text-blue-200">משתמשים פעילים</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-extrabold text-white sm:text-4xl">
							{{ counters.forms.toLocaleString() }}+
						</div>
						<div class="mt-1 text-sm text-blue-200">טפסים נוצרו</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-extrabold text-white sm:text-4xl">
							{{ counters.submissions.toLocaleString() }}+
						</div>
						<div class="mt-1 text-sm text-blue-200">תשובות נאספו</div>
					</div>
					<div class="text-center">
						<div class="text-3xl font-extrabold text-white sm:text-4xl">
							{{ counters.uptime }}%
						</div>
						<div class="mt-1 text-sm text-blue-200">זמינות</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== FEATURES ==================== -->
		<section id="features" class="relative bg-gray-50 py-24 sm:py-32">
			<div class="mx-auto max-w-7xl px-6 lg:px-8">
				<div class="reveal mx-auto max-w-2xl text-center">
					<h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
						הכלים שלך ליצירת טפסים מושלמים
					</h2>
					<p class="mt-4 text-lg leading-relaxed text-gray-500">
						כל מה שצריך כדי לבנות, לשתף ולנתח טפסים מקצועיים
					</p>
				</div>

				<div
					class="reveal stagger mt-16 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4"
				>
					<div
						v-for="(feature, i) in features"
						:key="i"
						class="group rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5"
					>
						<div
							:class="[feature.bg, feature.color]"
							class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
						>
							<Icon :name="feature.icon" class="h-6 w-6" />
						</div>
						<h3 class="text-lg font-bold text-gray-900">{{ feature.title }}</h3>
						<p class="mt-2 text-sm leading-relaxed text-gray-500">
							{{ feature.desc }}
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== HOW IT WORKS ==================== -->
		<section id="how-it-works" class="relative bg-white py-24 sm:py-32">
			<div class="mx-auto max-w-7xl px-6 lg:px-8">
				<div class="reveal mx-auto max-w-2xl text-center">
					<h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
						פשוט. מהיר. יעיל.
					</h2>
					<p class="mt-4 text-lg text-gray-500">שלושה צעדים זה כל מה שצריך</p>
				</div>

				<div class="relative mt-20">
					<div
						class="absolute top-16 right-[16.67%] left-[16.67%] hidden h-0.5 bg-linear-to-l from-blue-200 via-blue-400 to-blue-200 lg:block"
					></div>

					<div class="reveal stagger grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
						<div class="text-center">
							<div
								class="relative z-10 mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-blue-50"
							>
								<div
									class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-blue-500 to-blue-700 shadow-lg shadow-blue-500/25"
								>
									<Icon name="ph:plus-circle-fill" class="h-9 w-9 text-white" />
								</div>
							</div>
							<span class="text-5xl font-black text-blue-300">01</span>
							<h3 class="mt-2 text-xl font-bold text-gray-900">צור טופס</h3>
							<p class="mt-2 text-gray-500">
								בחר רכיבים, גרור ושחרר, והתאם אישית בקלות
							</p>
						</div>

						<div class="text-center">
							<div
								class="relative z-10 mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-violet-50"
							>
								<div
									class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-violet-700 shadow-lg shadow-violet-500/25"
								>
									<Icon name="ph:share-fill" class="h-9 w-9 text-white" />
								</div>
							</div>
							<span class="text-5xl font-black text-violet-300">02</span>
							<h3 class="mt-2 text-xl font-bold text-gray-900">שתף</h3>
							<p class="mt-2 text-gray-500">שלח קישור, הטמע באתר, או שתף QR קוד</p>
						</div>

						<div class="text-center">
							<div
								class="relative z-10 mx-auto mb-6 flex h-32 w-32 items-center justify-center rounded-full bg-emerald-50"
							>
								<div
									class="flex h-20 w-20 items-center justify-center rounded-full bg-linear-to-br from-emerald-500 to-emerald-700 shadow-lg shadow-emerald-500/25"
								>
									<Icon name="ph:chart-line-up-fill" class="h-9 w-9 text-white" />
								</div>
							</div>
							<span class="text-5xl font-black text-emerald-300">03</span>
							<h3 class="mt-2 text-xl font-bold text-gray-900">אסוף ונתח</h3>
							<p class="mt-2 text-gray-500">צפה בתשובות בזמן אמת וייצא דוחות</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== CTA ==================== -->
		<section class="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
			<div
				class="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-[100px]"
			></div>
			<div class="dot-grid absolute inset-0 opacity-50"></div>

			<div class="relative z-10 mx-auto max-w-7xl px-6 text-center lg:px-8">
				<div class="reveal">
					<h2 class="text-3xl font-extrabold text-white sm:text-4xl md:text-5xl">
						מוכנים ליצור טפסים שעובדים?
					</h2>
					<p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-slate-400">
						הצטרפו לאלפי משתמשים שכבר משתמשים ב-Autodox ליצירת טפסים חכמים ומקצועיים
					</p>
					<div class="mt-10">
						<div class="relative inline-block">
							<div
								class="absolute -inset-1.5 rounded-2xl bg-blue-500/20 blur-lg"
							></div>
							<NuxtLink to="/signup">
								<BaseButton
									variant="primary"
									size="lg"
									class="relative !rounded-xl !px-10 !py-4 !text-lg"
								>
									<Icon name="ph:rocket-launch-fill" class="h-5 w-5" />
									צור חשבון בחינם
								</BaseButton>
							</NuxtLink>
						</div>
					</div>
					<p class="mt-4 text-sm text-slate-500">ללא כרטיס אשראי. ללא התחייבות.</p>
				</div>
			</div>
		</section>

		<!-- ==================== FOOTER ==================== -->
		<footer class="border-t border-slate-800 bg-slate-950 py-8">
			<div class="mx-auto max-w-7xl px-6 lg:px-8">
				<div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
					<div class="flex items-center gap-2">
						<div
							class="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-br from-blue-500 to-blue-700"
						>
							<Icon name="ph:stack-fill" class="h-4 w-4 text-white" />
						</div>
						<span class="text-sm font-semibold text-white">Autodox</span>
					</div>
					<div class="flex gap-6 text-sm text-slate-500">
						<a href="#" class="transition-colors hover:text-slate-300">תנאי שימוש</a>
						<a href="#" class="transition-colors hover:text-slate-300">פרטיות</a>
						<a href="#" class="transition-colors hover:text-slate-300">צור קשר</a>
					</div>
					<p class="text-sm text-slate-500">
						&copy; {{ new Date().getFullYear() }} Autodox. כל הזכויות שמורות.
					</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<style>
	@import url("https://fonts.googleapis.com/css2?family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&display=swap");

	* {
		/* font-family: "Rubik", sans-serif; */
		font-family: "Rubik", sans-serif;
	}

	h1,
	h1 > *,
	h2,
	h2 > *,
	h3,
	h3 > *,
	h4,
	h4 > *,
	h5,
	h5 > *,
	h6,
	h6 > * {
		font-family: "Google Sans", sans-serif;
	}

	/* ---- Dot grid ---- */
	.dot-grid {
		background-image: radial-gradient(circle, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
		background-size: 32px 32px;
	}

	/* ---- Hero entrance ---- */
	.hero-enter {
		animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
	}
	.hero-enter-d2 {
		animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.3s both;
	}
	.hero-enter-d3 {
		animation: fadeUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
	}
	.hero-enter-d4 {
		animation: fadeUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both;
	}

	@keyframes fadeUp {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ---- Mockup fields ---- */
	.mockup-field {
		display: block;
		width: 100%;
		animation: fieldSlide 0.5s ease-out both;
	}

	@keyframes fieldSlide {
		from {
			opacity: 0;
			transform: translateY(12px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ---- Typing cursor ---- */
	.typing-cursor {
		animation: cursorBlink 0.8s step-end infinite;
	}

	@keyframes cursorBlink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}

	/* ---- Badge entrance ---- */
	.badge-enter {
		animation: badgeIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes badgeIn {
		from {
			opacity: 0;
			transform: translateY(15px) scale(0.85);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* ---- Gradient mesh ---- */
	.mesh-1 {
		animation: meshDrift1 20s ease-in-out infinite;
	}
	.mesh-2 {
		animation: meshDrift2 25s ease-in-out infinite 2s;
	}
	.mesh-3 {
		animation: meshDrift3 18s ease-in-out infinite 4s;
	}

	@keyframes meshDrift1 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		25% {
			transform: translate(40px, -30px) scale(1.05);
		}
		50% {
			transform: translate(-20px, 40px) scale(0.95);
		}
		75% {
			transform: translate(-40px, -20px) scale(1.02);
		}
	}

	@keyframes meshDrift2 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		33% {
			transform: translate(-50px, 30px) scale(1.1);
		}
		66% {
			transform: translate(30px, -40px) scale(0.9);
		}
	}

	@keyframes meshDrift3 {
		0%,
		100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(40px, -30px) scale(1.08);
		}
	}

	/* ---- Floating shapes ---- */
	.shape-float {
		animation: shapeFloat 12s ease-in-out infinite;
	}
	.shape-float-delayed {
		animation: shapeFloat 15s ease-in-out infinite 2s;
	}
	.shape-spin {
		animation: shapeSpin 20s linear infinite;
	}

	@keyframes shapeFloat {
		0%,
		100% {
			transform: translate(0, 0) rotate(0deg);
		}
		25% {
			transform: translate(15px, -20px) rotate(5deg);
		}
		50% {
			transform: translate(-10px, -35px) rotate(-3deg);
		}
		75% {
			transform: translate(-25px, -15px) rotate(2deg);
		}
	}

	@keyframes shapeSpin {
		from {
			transform: rotate(45deg);
		}
		to {
			transform: rotate(405deg);
		}
	}

	/* ---- Scroll reveal ---- */
	.reveal {
		opacity: 0;
		transform: translateY(40px);
		transition:
			opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.reveal.revealed {
		opacity: 1;
		transform: none;
	}

	/* ---- Stagger children ---- */
	.stagger > * {
		opacity: 0;
		transform: translateY(20px);
		transition:
			opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.stagger.revealed > * {
		opacity: 1;
		transform: none;
	}

	.stagger.revealed > *:nth-child(1) {
		transition-delay: 0ms;
	}
	.stagger.revealed > *:nth-child(2) {
		transition-delay: 60ms;
	}
	.stagger.revealed > *:nth-child(3) {
		transition-delay: 120ms;
	}
	.stagger.revealed > *:nth-child(4) {
		transition-delay: 180ms;
	}
	.stagger.revealed > *:nth-child(5) {
		transition-delay: 240ms;
	}
	.stagger.revealed > *:nth-child(6) {
		transition-delay: 300ms;
	}
	.stagger.revealed > *:nth-child(7) {
		transition-delay: 360ms;
	}
	.stagger.revealed > *:nth-child(8) {
		transition-delay: 420ms;
	}

	/* ---- Scroll indicator ---- */
	.scroll-dot {
		animation: scrollBounce 1.5s ease-in-out infinite;
	}

	@keyframes scrollBounce {
		0%,
		100% {
			opacity: 0.5;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(8px);
		}
	}
</style>
