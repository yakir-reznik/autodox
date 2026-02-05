<script setup lang="ts">
	definePageMeta({
		layout: false,
	});

	useHead({
		title: "Autodox - הטפסים שלך, הכללים שלך",
		meta: [
			{
				name: "description",
				content:
					"בנה טפסים דינמיים ומרשימים בדקות. גרור, שחרר, התאם אישית — והתחל לאסוף תשובות.",
			},
		],
	});

	const activeFeature = ref(0);
	const mobileMenuOpen = ref(false);

	const features = [
		{
			icon: "ph:hand-grabbing-fill",
			title: "גרור ושחרר",
			desc: "ממשק בנייה אינטואיטיבי. פשוט גרור רכיבים למקום שלהם.",
			color: "bg-amber-400",
			accent: "text-amber-700",
			tag: "בנייה",
		},
		{
			icon: "ph:git-branch-fill",
			title: "לוגיקה מותנית",
			desc: "הצג או הסתר שדות בהתאם לתשובות. הטפסים שלך חושבים.",
			color: "bg-rose-400",
			accent: "text-rose-700",
			tag: "חכם",
		},
		{
			icon: "ph:palette-fill",
			title: "עיצוב מלא",
			desc: "ערכות נושא מוכנות, או התאם כל פיקסל בעצמך.",
			color: "bg-violet-400",
			accent: "text-violet-700",
			tag: "עיצוב",
		},
		{
			icon: "ph:share-network-fill",
			title: "שיתוף מיידי",
			desc: "קישור ישיר, QR קוד, או הטמעה באתר שלך.",
			color: "bg-emerald-400",
			accent: "text-emerald-700",
			tag: "הפצה",
		},
		{
			icon: "ph:chart-bar-fill",
			title: "ניתוח תשובות",
			desc: "דשבורד בזמן אמת. סנן, מיין וייצא נתונים.",
			color: "bg-sky-400",
			accent: "text-sky-700",
			tag: "דאטה",
		},
		{
			icon: "ph:devices-fill",
			title: "רספונסיבי",
			desc: "נראה מושלם בכל מכשיר — נייד, טאבלט, דסקטופ.",
			color: "bg-orange-400",
			accent: "text-orange-700",
			tag: "תצוגה",
		},
		{
			icon: "ph:shield-check-fill",
			title: "הגנה בסיסמה",
			desc: "שליטה מלאה בגישה. סיסמה, טוקן, או הגבלת IP.",
			color: "bg-slate-500",
			accent: "text-slate-700",
			tag: "אבטחה",
		},
		{
			icon: "ph:file-pdf-fill",
			title: "ייצוא PDF",
			desc: "הפוך תשובות למסמך מקצועי בלחיצה.",
			color: "bg-red-400",
			accent: "text-red-700",
			tag: "ייצוא",
		},
	];

	const steps = [
		{
			num: "01",
			title: "בנה",
			desc: "גרור רכיבים, הגדר לוגיקה, עצב — הכל ממשק אחד.",
			icon: "ph:cube-fill",
		},
		{
			num: "02",
			title: "שתף",
			desc: "קישור, QR, הטמעה — הטופס שלך בכל מקום.",
			icon: "ph:paper-plane-tilt-fill",
		},
		{
			num: "03",
			title: "נתח",
			desc: "תשובות בזמן אמת, תרשימים, ייצוא ל-PDF או Excel.",
			icon: "ph:chart-pie-slice-fill",
		},
	];

	function cycleFeature() {
		activeFeature.value = (activeFeature.value + 1) % features.length;
	}

	let featureInterval: ReturnType<typeof setInterval>;

	onMounted(() => {
		featureInterval = setInterval(cycleFeature, 3000);

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						entry.target.classList.add("in-view");
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.15 },
		);

		nextTick(() => {
			document.querySelectorAll(".scroll-reveal").forEach((el) => observer.observe(el));
		});

		onUnmounted(() => {
			clearInterval(featureInterval);
			observer.disconnect();
		});
	});

	function selectFeature(i: number) {
		activeFeature.value = i;
		clearInterval(featureInterval);
		featureInterval = setInterval(cycleFeature, 3000);
	}
</script>

<template>
	<div dir="rtl" lang="he" class="font-sans bg-stone-50 text-stone-900 overflow-x-hidden">
		<!-- ==================== NAV ==================== -->
		<nav class="fixed top-0 right-0 left-0 z-50 nav-blur">
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center gap-2.5">
						<div
							class="flex h-9 w-9 items-center justify-center rounded-xl bg-stone-900 rotate-3 ring-2 ring-amber-300"
						>
							<Icon name="ph:stack-fill" class="h-5 w-5 text-amber-300" />
						</div>
						<span class="text-lg font-black tracking-tight">Autodox</span>
					</div>

					<div class="hidden items-center gap-1 md:flex">
						<a
							href="#features"
							class="px-4 py-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 rounded-lg hover:bg-stone-100"
						>
							יתרונות
						</a>
						<a
							href="#how"
							class="px-4 py-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 rounded-lg hover:bg-stone-100"
						>
							איך זה עובד
						</a>
						<div class="w-px h-5 bg-stone-200 mx-2"></div>
						<NuxtLink
							to="/login"
							class="px-4 py-2 text-sm font-medium text-stone-500 transition-colors hover:text-stone-900 rounded-lg hover:bg-stone-100"
						>
							התחברות
						</NuxtLink>
						<NuxtLink to="/signup" class="mr-1">
							<BaseButton variant="primary" size="sm">
								התחל בחינם
								<Icon name="ph:arrow-left" class="h-3.5 w-3.5" />
							</BaseButton>
						</NuxtLink>
					</div>

					<div class="flex items-center gap-2 md:hidden">
						<NuxtLink to="/signup">
							<BaseButton variant="primary" size="sm">התחל בחינם</BaseButton>
						</NuxtLink>
						<button
							@click="mobileMenuOpen = !mobileMenuOpen"
							class="p-2 rounded-lg hover:bg-stone-100 transition-colors"
						>
							<Icon
								:name="mobileMenuOpen ? 'ph:x-bold' : 'ph:list-bold'"
								class="h-5 w-5"
							/>
						</button>
					</div>
				</div>

				<Transition name="dropdown">
					<div
						v-if="mobileMenuOpen"
						class="md:hidden pb-4 border-b border-stone-200 space-y-1"
					>
						<a
							href="#features"
							@click="mobileMenuOpen = false"
							class="block px-4 py-2.5 text-sm font-medium text-stone-600 rounded-lg hover:bg-stone-100"
						>
							יתרונות
						</a>
						<a
							href="#how"
							@click="mobileMenuOpen = false"
							class="block px-4 py-2.5 text-sm font-medium text-stone-600 rounded-lg hover:bg-stone-100"
						>
							איך זה עובד
						</a>
						<NuxtLink
							to="/login"
							class="block px-4 py-2.5 text-sm font-medium text-stone-600 rounded-lg hover:bg-stone-100"
						>
							התחברות
						</NuxtLink>
					</div>
				</Transition>
			</div>
		</nav>

		<!-- ==================== HERO ==================== -->
		<section class="relative min-h-screen pt-16 overflow-hidden">
			<div class="grain absolute inset-0 pointer-events-none opacity-30"></div>

			<div class="absolute inset-0">
				<div
					class="absolute top-0 left-0 w-[55%] h-[70%] bg-amber-200/40 rounded-br-[120px] shape-morph"
				></div>
				<div
					class="absolute bottom-0 right-0 w-[45%] h-[50%] bg-rose-200/30 rounded-tl-[100px] shape-morph-delay"
				></div>
				<div
					class="absolute top-[20%] right-[10%] w-72 h-72 bg-violet-200/25 rounded-full blur-3xl"
				></div>
			</div>

			<div class="absolute inset-0 pointer-events-none">
				<div class="absolute top-0 left-[25%] w-px h-full dashed-line"></div>
				<div class="absolute top-0 left-[50%] w-px h-full dashed-line"></div>
				<div class="absolute top-0 left-[75%] w-px h-full dashed-line"></div>
			</div>

			<div class="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
				<div
					class="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row items-center gap-12 lg:gap-16 py-12 lg:py-0"
				>
					<!-- Text side -->
					<div class="flex-1 text-center lg:text-right pt-8 lg:pt-0">
						<div
							class="inline-flex items-center gap-2 rounded-full bg-amber-100 border border-amber-200/80 px-4 py-1.5 text-xs font-bold text-amber-800 mb-6 hero-stagger"
						>
							<span class="relative flex h-2 w-2">
								<span
									class="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75"
								></span>
								<span
									class="relative inline-flex rounded-full h-2 w-2 bg-amber-500"
								></span>
							</span>
							גרסה חדשה זמינה
						</div>

						<h1
							class="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-black leading-[1.05] tracking-tight hero-stagger"
						>
							<span class="block">בנה טפסים</span>
							<span class="block mt-1">
								<span class="relative inline-block">
									<span
										class="relative z-10 bg-stone-900 text-stone-50 px-4 py-1 -rotate-1 inline-block rounded-lg"
									>
										שעובדים
									</span>
								</span>
							</span>
							<span class="block mt-1 text-stone-400">בשבילך.</span>
						</h1>

						<p
							class="mt-8 text-lg sm:text-xl text-stone-500 max-w-lg mx-auto lg:mx-0 lg:mr-0 leading-relaxed hero-stagger"
						>
							ממשק גרירה ושחרור, לוגיקה חכמה, עיצובים מותאמים — הכל בכלי אחד
							שפשוט
							<span
								class="font-semibold text-stone-700 underline decoration-amber-400 decoration-2 underline-offset-4"
								>עובד</span
							>.
						</p>

						<div
							class="mt-10 flex flex-wrap items-center gap-4 justify-center lg:justify-start hero-stagger"
						>
							<NuxtLink to="/signup">
								<BaseButton
									variant="primary"
									size="lg"
									class="!rounded-xl !px-8 !py-4 !text-base !font-bold"
								>
									<Icon name="ph:sparkle-fill" class="h-5 w-5" />
									צור טופס ראשון
								</BaseButton>
							</NuxtLink>

							<a
								href="#how"
								class="group flex items-center gap-2 px-4 py-3 text-sm font-bold text-stone-500 transition-colors hover:text-stone-900"
							>
								<span
									class="flex h-10 w-10 items-center justify-center rounded-full border-2 border-stone-300 transition-all group-hover:border-stone-900 group-hover:bg-stone-900 group-hover:text-white"
								>
									<Icon name="ph:play-fill" class="h-4 w-4 mr-[-1px]" />
								</span>
								ראה איך זה עובד
							</a>
						</div>

						<div
							class="mt-12 flex items-center gap-6 justify-center lg:justify-start hero-stagger"
						>
							<div class="flex -space-x-2 space-x-reverse">
								<div
									class="h-8 w-8 rounded-full bg-amber-300 border-2 border-stone-50 flex items-center justify-center text-[10px] font-bold text-amber-800"
								>
									יל
								</div>
								<div
									class="h-8 w-8 rounded-full bg-rose-300 border-2 border-stone-50 flex items-center justify-center text-[10px] font-bold text-rose-800"
								>
									דנ
								</div>
								<div
									class="h-8 w-8 rounded-full bg-violet-300 border-2 border-stone-50 flex items-center justify-center text-[10px] font-bold text-violet-800"
								>
									מא
								</div>
								<div
									class="h-8 w-8 rounded-full bg-emerald-300 border-2 border-stone-50 flex items-center justify-center text-[10px] font-bold text-emerald-800"
								>
									שר
								</div>
							</div>
							<div class="text-sm text-stone-400">
								<span class="font-bold text-stone-600">12,500+</span> משתמשים
								כבר בונים
							</div>
						</div>
					</div>

					<!-- Interactive card side -->
					<div class="flex-1 w-full max-w-xl lg:max-w-none hero-stagger">
						<div class="relative">
							<div
								class="absolute -top-6 -right-6 h-24 w-24 rounded-3xl border-2 border-dashed border-amber-300/50 rotate-6"
							></div>
							<div
								class="absolute -bottom-4 -left-4 h-16 w-16 rounded-2xl bg-rose-200/50 -rotate-12"
							></div>

							<div
								class="relative bg-white rounded-3xl shadow-xl shadow-stone-900/5 border border-stone-200/80 overflow-hidden"
							>
								<div
									class="flex items-center justify-between bg-stone-50 border-b border-stone-100 px-5 py-3.5"
								>
									<div class="flex items-center gap-3">
										<div
											class="h-7 w-7 rounded-lg bg-amber-400 flex items-center justify-center"
										>
											<Icon
												name="ph:notebook-fill"
												class="h-4 w-4 text-white"
											/>
										</div>
										<span class="text-sm font-bold text-stone-700"
											>סקר שביעות רצון</span
										>
									</div>
									<div class="flex items-center gap-1.5">
										<div
											class="h-2.5 w-2.5 rounded-full bg-emerald-400"
										></div>
										<span class="text-[11px] text-stone-400">פעיל</span>
									</div>
								</div>

								<div class="p-5 sm:p-6 space-y-5">
									<div class="card-field" style="animation-delay: 0.6s">
										<label
											class="block text-sm font-bold text-stone-700 mb-1.5"
										>
											מה שמך?
											<span class="text-rose-400 mr-0.5">*</span>
										</label>
										<div
											class="flex h-11 items-center rounded-xl border border-stone-200 bg-stone-50/50 px-4"
										>
											<span class="text-sm text-stone-800">שרה כהן</span>
											<span
												class="typing-blink mr-0.5 h-4 w-[2px] bg-amber-500 rounded-full"
											></span>
										</div>
									</div>

									<div class="card-field" style="animation-delay: 0.9s">
										<label
											class="block text-sm font-bold text-stone-700 mb-2"
										>
											דרג את החוויה שלך
										</label>
										<div class="flex gap-1.5">
											<div
												v-for="n in 5"
												:key="n"
												class="h-10 w-10 rounded-xl flex items-center justify-center transition-all"
												:class="
													n <= 4
														? 'bg-amber-400 text-white scale-100'
														: 'bg-stone-100 text-stone-300 scale-95'
												"
											>
												<Icon name="ph:star-fill" class="h-5 w-5" />
											</div>
										</div>
									</div>

									<div class="card-field" style="animation-delay: 1.2s">
										<label
											class="block text-sm font-bold text-stone-700 mb-1.5"
										>
											מאיפה שמעת עלינו?
										</label>
										<div
											class="flex h-11 items-center justify-between rounded-xl border border-stone-200 bg-white px-4"
										>
											<span class="text-sm text-stone-800"
												>רשתות חברתיות</span
											>
											<Icon
												name="ph:caret-down"
												class="h-4 w-4 text-stone-400"
											/>
										</div>
									</div>

									<div class="card-field" style="animation-delay: 1.5s">
										<div
											class="flex h-11 items-center justify-center rounded-xl bg-stone-900 cursor-pointer transition-transform hover:scale-[1.01]"
										>
											<span
												class="text-sm font-bold text-stone-50 flex items-center gap-2"
											>
												שלח תשובות
												<Icon
													name="ph:paper-plane-tilt-fill"
													class="h-4 w-4"
												/>
											</span>
										</div>
									</div>
								</div>

								<div
									class="absolute -top-3 left-4 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md badge-pop"
									style="animation-delay: 2s"
								>
									142 תשובות
								</div>
							</div>

							<div
								class="absolute -bottom-3 right-4 left-4 h-6 bg-white/60 rounded-b-3xl border border-stone-200/50 -z-10"
							></div>
							<div
								class="absolute -bottom-5 right-7 left-7 h-4 bg-white/30 rounded-b-2xl border border-stone-200/30 -z-20"
							></div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== MARQUEE STRIP ==================== -->
		<div class="relative bg-stone-900 py-4 overflow-hidden -rotate-1 scale-105 z-20">
			<div class="marquee-track flex items-center gap-8 whitespace-nowrap">
				<template v-for="n in 3" :key="n">
					<span class="text-sm font-bold text-stone-400 flex items-center gap-8">
						<span class="flex items-center gap-2">
							<Icon
								name="ph:check-circle-fill"
								class="h-4 w-4 text-amber-400"
							/>
							<span class="text-stone-200">גרור ושחרר</span>
						</span>
						<span class="text-stone-600">&#x2726;</span>
						<span class="flex items-center gap-2">
							<Icon
								name="ph:check-circle-fill"
								class="h-4 w-4 text-amber-400"
							/>
							<span class="text-stone-200">לוגיקה מותנית</span>
						</span>
						<span class="text-stone-600">&#x2726;</span>
						<span class="flex items-center gap-2">
							<Icon
								name="ph:check-circle-fill"
								class="h-4 w-4 text-amber-400"
							/>
							<span class="text-stone-200">עיצוב מותאם</span>
						</span>
						<span class="text-stone-600">&#x2726;</span>
						<span class="flex items-center gap-2">
							<Icon
								name="ph:check-circle-fill"
								class="h-4 w-4 text-amber-400"
							/>
							<span class="text-stone-200">ייצוא PDF</span>
						</span>
						<span class="text-stone-600">&#x2726;</span>
						<span class="flex items-center gap-2">
							<Icon
								name="ph:check-circle-fill"
								class="h-4 w-4 text-amber-400"
							/>
							<span class="text-stone-200">הגנה בסיסמה</span>
						</span>
						<span class="text-stone-600">&#x2726;</span>
						<span class="flex items-center gap-2">
							<Icon
								name="ph:check-circle-fill"
								class="h-4 w-4 text-amber-400"
							/>
							<span class="text-stone-200">רספונסיבי</span>
						</span>
						<span class="text-stone-600 ml-8">&#x2726;</span>
					</span>
				</template>
			</div>
		</div>

		<!-- ==================== FEATURES BENTO ==================== -->
		<section id="features" class="relative py-24 sm:py-32 bg-white">
			<div class="grain absolute inset-0 pointer-events-none opacity-20"></div>

			<div class="relative mx-auto max-w-7xl px-5 sm:px-8">
				<div class="scroll-reveal mb-16 max-w-2xl">
					<div
						class="inline-block text-xs font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200/60 rounded-full px-4 py-1.5 mb-4"
					>
						יתרונות
					</div>
					<h2 class="text-4xl sm:text-5xl font-black leading-tight">
						הכלים שהופכים
						<br />
						<span class="text-stone-400">טפסים לחוויה.</span>
					</h2>
				</div>

				<div
					class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-auto"
				>
					<!-- Large featured card -->
					<div
						class="scroll-reveal sm:col-span-2 lg:col-span-2 lg:row-span-2 group relative bg-stone-900 rounded-3xl p-8 sm:p-10 overflow-hidden cursor-pointer transition-transform hover:scale-[1.01]"
						@click="selectFeature(0)"
					>
						<div
							class="absolute top-0 left-0 w-48 h-48 bg-amber-400/20 rounded-full blur-3xl"
						></div>
						<div
							class="relative z-10 h-full flex flex-col justify-between min-h-[320px]"
						>
							<div>
								<div
									class="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 mb-6"
								>
									<Icon
										name="ph:hand-grabbing-fill"
										class="h-7 w-7 text-white"
									/>
								</div>
								<h3
									class="text-2xl sm:text-3xl font-black text-white leading-tight"
								>
									גרור, שחרר,
									<br />
									<span class="text-amber-400">סיימת.</span>
								</h3>
								<p
									class="mt-3 text-stone-400 text-sm leading-relaxed max-w-sm"
								>
									ממשק בנייה שמרגיש כמו משחק. פשוט גרור רכיבים, סדר אותם,
									והטופס מוכן בדקות.
								</p>
							</div>
							<div
								class="flex items-center gap-2 text-amber-400 text-sm font-bold mt-6"
							>
								<span>גלה עוד</span>
								<Icon
									name="ph:arrow-left"
									class="h-4 w-4 transition-transform group-hover:-translate-x-1"
								/>
							</div>
						</div>
					</div>

					<!-- Regular cards -->
					<div
						v-for="(feature, i) in features.slice(1, 5)"
						:key="i"
						class="scroll-reveal group relative rounded-3xl p-6 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border"
						:class="
							activeFeature === i + 1
								? 'bg-stone-50 border-stone-300 shadow-lg'
								: 'bg-white border-stone-100 hover:border-stone-200 hover:shadow-md'
						"
						@click="selectFeature(i + 1)"
					>
						<div
							class="inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4 transition-transform group-hover:scale-110 group-hover:-rotate-3"
							:class="feature.color"
						>
							<Icon :name="feature.icon" class="h-5 w-5 text-white" />
						</div>
						<div
							class="text-[10px] font-black uppercase tracking-widest mb-2"
							:class="feature.accent"
						>
							{{ feature.tag }}
						</div>
						<h3 class="text-lg font-black text-stone-900">{{ feature.title }}</h3>
						<p class="mt-1.5 text-sm text-stone-500 leading-relaxed">
							{{ feature.desc }}
						</p>
					</div>

					<!-- Wide bottom card -->
					<div
						class="scroll-reveal sm:col-span-2 lg:col-span-2 group relative rounded-3xl p-6 sm:p-8 overflow-hidden bg-gradient-to-bl from-violet-50 to-rose-50 border border-violet-100 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg"
						@click="selectFeature(5)"
					>
						<div class="flex flex-col sm:flex-row sm:items-center gap-6">
							<div
								class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-violet-500"
							>
								<Icon name="ph:devices-fill" class="h-8 w-8 text-white" />
							</div>
							<div>
								<div
									class="text-[10px] font-black uppercase tracking-widest text-violet-600 mb-1"
								>
									תצוגה
								</div>
								<h3 class="text-xl font-black text-stone-900">
									מותאם לכל מסך, בכל מקום
								</h3>
								<p class="mt-1 text-sm text-stone-500">
									הטפסים שלך נראים מושלם בנייד, טאבלט ודסקטופ — ללא מאמץ
									נוסף.
								</p>
							</div>
						</div>
					</div>

					<!-- Two small remaining cards -->
					<div
						v-for="(feature, i) in features.slice(6)"
						:key="'bottom-' + i"
						class="scroll-reveal group relative rounded-3xl p-6 overflow-hidden cursor-pointer transition-all hover:scale-[1.02] border"
						:class="
							activeFeature === i + 6
								? 'bg-stone-50 border-stone-300 shadow-lg'
								: 'bg-white border-stone-100 hover:border-stone-200 hover:shadow-md'
						"
						@click="selectFeature(i + 6)"
					>
						<div
							class="inline-flex h-11 w-11 items-center justify-center rounded-xl mb-4 transition-transform group-hover:scale-110 group-hover:rotate-3"
							:class="feature.color"
						>
							<Icon :name="feature.icon" class="h-5 w-5 text-white" />
						</div>
						<div
							class="text-[10px] font-black uppercase tracking-widest mb-2"
							:class="feature.accent"
						>
							{{ feature.tag }}
						</div>
						<h3 class="text-lg font-black text-stone-900">{{ feature.title }}</h3>
						<p class="mt-1.5 text-sm text-stone-500 leading-relaxed">
							{{ feature.desc }}
						</p>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== HOW IT WORKS ==================== -->
		<section id="how" class="relative py-24 sm:py-32 bg-stone-50 overflow-hidden">
			<div class="grain absolute inset-0 pointer-events-none opacity-20"></div>

			<div class="absolute inset-0 pointer-events-none overflow-hidden">
				<span
					class="absolute top-[10%] right-[5%] text-[20rem] font-black text-stone-100 leading-none select-none"
					>01</span
				>
				<span
					class="absolute top-[30%] left-[10%] text-[16rem] font-black text-stone-100/60 leading-none select-none"
					>02</span
				>
				<span
					class="absolute bottom-[5%] right-[15%] text-[18rem] font-black text-stone-100/40 leading-none select-none"
					>03</span
				>
			</div>

			<div class="relative mx-auto max-w-7xl px-5 sm:px-8">
				<div class="scroll-reveal mb-16 text-center">
					<div
						class="inline-block text-xs font-black uppercase tracking-widest text-stone-500 bg-white border border-stone-200 rounded-full px-4 py-1.5 mb-4"
					>
						תהליך
					</div>
					<h2 class="text-4xl sm:text-5xl font-black leading-tight">
						שלושה צעדים.
						<br />
						<span class="text-stone-400">זה הכל.</span>
					</h2>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
					<div
						v-for="(step, i) in steps"
						:key="i"
						class="scroll-reveal group relative"
					>
						<div
							class="relative bg-white rounded-3xl p-8 border border-stone-200 transition-all hover:shadow-xl hover:shadow-stone-900/5 hover:-translate-y-1"
						>
							<div
								class="absolute -top-5 right-6 bg-stone-900 text-amber-400 text-2xl font-black w-12 h-12 rounded-2xl flex items-center justify-center rotate-3 shadow-lg"
							>
								{{ step.num }}
							</div>

							<div class="pt-4">
								<div
									class="flex h-14 w-14 items-center justify-center rounded-2xl bg-stone-100 mb-5 transition-all group-hover:bg-amber-400 group-hover:text-white group-hover:-rotate-6"
								>
									<Icon
										:name="step.icon"
										class="h-7 w-7 text-stone-400 group-hover:text-white transition-colors"
									/>
								</div>
								<h3 class="text-2xl font-black text-stone-900">
									{{ step.title }}
								</h3>
								<p class="mt-2 text-stone-500 leading-relaxed">
									{{ step.desc }}
								</p>
							</div>

							<div
								v-if="i < 2"
								class="hidden lg:flex absolute top-1/2 -left-5 -translate-y-1/2 h-10 w-10 items-center justify-center rounded-full bg-white border border-stone-200 shadow-sm z-10"
							>
								<Icon name="ph:arrow-left" class="h-4 w-4 text-stone-400" />
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== STATS ==================== -->
		<section class="relative bg-white py-20 border-y border-stone-100">
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="scroll-reveal grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
					<div class="text-center">
						<div class="text-4xl sm:text-5xl font-black text-stone-900">
							12.5K<span class="text-amber-400">+</span>
						</div>
						<div class="mt-2 text-sm font-medium text-stone-400">משתמשים פעילים</div>
					</div>
					<div class="text-center">
						<div class="text-4xl sm:text-5xl font-black text-stone-900">
							48K<span class="text-rose-400">+</span>
						</div>
						<div class="mt-2 text-sm font-medium text-stone-400">טפסים נוצרו</div>
					</div>
					<div class="text-center">
						<div class="text-4xl sm:text-5xl font-black text-stone-900">
							250K<span class="text-violet-400">+</span>
						</div>
						<div class="mt-2 text-sm font-medium text-stone-400">תשובות נאספו</div>
					</div>
					<div class="text-center">
						<div class="text-4xl sm:text-5xl font-black text-stone-900">
							99.9<span class="text-emerald-400">%</span>
						</div>
						<div class="mt-2 text-sm font-medium text-stone-400">זמינות שרת</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== CTA ==================== -->
		<section class="relative py-24 sm:py-32 bg-stone-900 overflow-hidden">
			<div class="grain absolute inset-0 pointer-events-none opacity-10"></div>

			<div
				class="absolute top-10 right-10 h-32 w-32 rounded-full border-2 border-dashed border-stone-700/50 rotate-12"
			></div>
			<div
				class="absolute bottom-10 left-10 h-24 w-24 rounded-3xl border-2 border-dashed border-stone-700/50 -rotate-6"
			></div>
			<div
				class="absolute top-1/2 left-1/4 h-64 w-64 bg-amber-400/5 rounded-full blur-3xl"
			></div>

			<div class="relative z-10 mx-auto max-w-3xl px-5 sm:px-8 text-center">
				<div class="scroll-reveal">
					<div
						class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 rotate-6 mb-8"
					>
						<Icon
							name="ph:rocket-launch-fill"
							class="h-8 w-8 text-white -rotate-6"
						/>
					</div>

					<h2
						class="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-tight"
					>
						מוכנים
						<span class="text-amber-400">להתחיל?</span>
					</h2>
					<p class="mt-6 text-lg text-stone-400 max-w-xl mx-auto leading-relaxed">
						הצטרפו לאלפי משתמשים שכבר בונים טפסים חכמים עם Autodox. חינם, בלי
						כרטיס אשראי.
					</p>

					<div
						class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
					>
						<NuxtLink to="/signup">
							<BaseButton
								variant="primary"
								size="lg"
								class="!rounded-xl !px-10 !py-4 !text-base !font-bold"
							>
								<Icon name="ph:sparkle-fill" class="h-5 w-5" />
								צור חשבון בחינם
							</BaseButton>
						</NuxtLink>

						<div class="flex items-center gap-2 text-sm text-stone-500">
							<Icon name="ph:clock" class="h-4 w-4" />
							<span>הרשמה תוך 30 שניות</span>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== FOOTER ==================== -->
		<footer class="bg-stone-950 py-10 border-t border-stone-800">
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
					<div class="flex items-center gap-2.5">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-xl bg-stone-800 ring-2 ring-amber-400/50 rotate-3"
						>
							<Icon name="ph:stack-fill" class="h-4 w-4 text-amber-400" />
						</div>
						<span class="text-sm font-black text-stone-300">Autodox</span>
					</div>
					<div class="flex gap-6 text-sm text-stone-500">
						<a href="#" class="transition-colors hover:text-stone-300">תנאי שימוש</a>
						<a href="#" class="transition-colors hover:text-stone-300">פרטיות</a>
						<a href="#" class="transition-colors hover:text-stone-300">צור קשר</a>
					</div>
					<p class="text-sm text-stone-600">
						&copy; {{ new Date().getFullYear() }} Autodox. כל הזכויות שמורות.
					</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<style>
	/* ---- Nav blur ---- */
	.nav-blur {
		background: rgba(250, 250, 249, 0.85);
		backdrop-filter: blur(16px) saturate(1.8);
		border-bottom: 1px solid rgba(214, 211, 209, 0.4);
	}

	/* ---- Grain texture ---- */
	.grain {
		background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
		background-repeat: repeat;
		background-size: 200px 200px;
	}

	/* ---- Hero stagger ---- */
	.hero-stagger {
		animation: heroSlideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	.hero-stagger:nth-child(1) {
		animation-delay: 0.05s;
	}
	.hero-stagger:nth-child(2) {
		animation-delay: 0.15s;
	}
	.hero-stagger:nth-child(3) {
		animation-delay: 0.25s;
	}
	.hero-stagger:nth-child(4) {
		animation-delay: 0.35s;
	}
	.hero-stagger:nth-child(5) {
		animation-delay: 0.45s;
	}
	.hero-stagger:nth-child(6) {
		animation-delay: 0.55s;
	}
	.hero-stagger:nth-child(7) {
		animation-delay: 0.65s;
	}

	@keyframes heroSlideUp {
		from {
			opacity: 0;
			transform: translateY(32px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ---- Card fields ---- */
	.card-field {
		animation: cardFieldIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes cardFieldIn {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ---- Typing cursor blink ---- */
	.typing-blink {
		animation: typingBlink 0.9s step-end infinite;
	}

	@keyframes typingBlink {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0;
		}
	}

	/* ---- Badge pop ---- */
	.badge-pop {
		animation: badgePop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes badgePop {
		from {
			opacity: 0;
			transform: scale(0.7) translateY(8px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	/* ---- Shape morphing ---- */
	.shape-morph {
		animation: shapeMorph 20s ease-in-out infinite;
	}

	.shape-morph-delay {
		animation: shapeMorph 25s ease-in-out infinite 5s;
	}

	@keyframes shapeMorph {
		0%,
		100% {
			border-radius: 0 0 120px 0;
			transform: scale(1);
		}
		25% {
			border-radius: 0 0 80px 40px;
			transform: scale(1.02);
		}
		50% {
			border-radius: 0 0 140px 20px;
			transform: scale(0.98);
		}
		75% {
			border-radius: 0 0 100px 60px;
			transform: scale(1.01);
		}
	}

	/* ---- Dashed lines ---- */
	.dashed-line {
		background: repeating-linear-gradient(
			to bottom,
			rgba(214, 211, 209, 0.4) 0px,
			rgba(214, 211, 209, 0.4) 6px,
			transparent 6px,
			transparent 12px
		);
	}

	/* ---- Marquee ---- */
	.marquee-track {
		animation: marqueeScroll 30s linear infinite;
		width: max-content;
	}

	@keyframes marqueeScroll {
		0% {
			transform: translateX(0);
		}
		100% {
			transform: translateX(-33.333%);
		}
	}

	/* ---- Scroll reveal ---- */
	.scroll-reveal {
		opacity: 0;
		transform: translateY(40px);
		transition:
			opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.scroll-reveal.in-view {
		opacity: 1;
		transform: none;
	}

	/* ---- Dropdown transition ---- */
	.dropdown-enter-active {
		transition: all 0.2s ease-out;
	}
	.dropdown-leave-active {
		transition: all 0.15s ease-in;
	}
	.dropdown-enter-from,
	.dropdown-leave-to {
		opacity: 0;
		transform: translateY(-8px);
	}
</style>
