<script setup lang="ts">
	definePageMeta({
		layout: false,
	});

	useHead({
		title: "Autodox - הטפסים שלך, ברמה אחרת",
		meta: [
			{
				name: "description",
				content:
					"בנה טפסים דיגיטליים מרשימים בדקות. גרור ושחרר, חתימה דיגיטלית, לוגיקה חכמה, ערכות עיצוב ועוד.",
			},
		],
		link: [
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com",
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossorigin: "",
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Rubik:wght@400;500;600;700;800;900&display=swap",
			},
		],
	});

	const scrolled = ref(false);
	const mobileMenuOpen = ref(false);
	const activeTheme = ref(0);

	const features = [
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 4h-4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z"/><path d="M12 14v4"/><path d="M8 18h8"/><path d="m9 8 2 2 4-4"/></svg>`,
			title: "גרור ושחרר",
			desc: "ממשק בנייה ויזואלי — פשוט גרור רכיבים, סדר אותם, והטופס מוכן.",
			accent: "from-blue-500 to-cyan-400",
			bg: "bg-blue-50",
			iconColor: "text-blue-600",
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>`,
			title: "חתימה דיגיטלית",
			desc: "שדה חתימה מובנה — הלקוח חותם ישירות על הטופס מהמסך.",
			accent: "from-violet-500 to-purple-400",
			bg: "bg-violet-50",
			iconColor: "text-violet-600",
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v6"/><path d="M12 17v6"/><path d="m4.22 4.22 4.24 4.24"/><path d="m15.54 15.54 4.24 4.24"/><path d="M1 12h6"/><path d="M17 12h6"/><path d="m4.22 19.78 4.24-4.24"/><path d="m15.54 8.46 4.24-4.24"/></svg>`,
			title: "לוגיקה מותנית",
			desc: "הצג או הסתר שדות לפי תשובות. הטפסים שלך חושבים בעצמם.",
			accent: "from-emerald-500 to-teal-400",
			bg: "bg-emerald-50",
			iconColor: "text-emerald-600",
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="9" x2="15" y1="15" y2="15"/></svg>`,
			title: "ייצוא PDF",
			desc: "כל הגשה הופכת למסמך PDF מקצועי בלחיצת כפתור.",
			accent: "from-rose-500 to-pink-400",
			bg: "bg-rose-50",
			iconColor: "text-rose-600",
		},
	];

	const elements = [
		{ label: "טקסט", icon: "T", color: "bg-slate-100 text-slate-600" },
		{ label: "אימייל", icon: "@", color: "bg-blue-100 text-blue-600" },
		{ label: "מספר", icon: "#", color: "bg-indigo-100 text-indigo-600" },
		{ label: "תאריך", icon: "📅", color: "bg-amber-100 text-amber-600" },
		{ label: "רשימה נפתחת", icon: "▾", color: "bg-violet-100 text-violet-600" },
		{ label: "בחירה בודדת", icon: "◉", color: "bg-emerald-100 text-emerald-600" },
		{ label: "תיבת סימון", icon: "☑", color: "bg-cyan-100 text-cyan-600" },
		{ label: "חתימה", icon: "✎", color: "bg-rose-100 text-rose-600" },
		{ label: "תמונה", icon: "🖼", color: "bg-pink-100 text-pink-600" },
		{ label: "כותרת", icon: "H", color: "bg-orange-100 text-orange-600" },
		{ label: "מפריד", icon: "—", color: "bg-gray-100 text-gray-500" },
		{ label: "שדה חזרה", icon: "↻", color: "bg-teal-100 text-teal-600" },
	];

	const steps = [
		{
			num: "01",
			title: "בנה",
			desc: "גרור רכיבים לקנבס, הגדר מאפיינים, הוסף לוגיקה ועיצוב.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/><path d="m16 15-3-3 3-3"/></svg>`,
		},
		{
			num: "02",
			title: "שלח",
			desc: "שתף קישור ייחודי — הלקוח ממלא ישירות בדפדפן, בכל מכשיר.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>`,
		},
		{
			num: "03",
			title: "נהל",
			desc: "צפה בהגשות, סנן, ייצא ל-PDF — הכל בדשבורד אחד.",
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>`,
		},
	];

	const themes = [
		{ name: "ברירת מחדל", bg: "bg-white", border: "border-gray-200", text: "text-gray-800", accent: "#155DFC", dot: "bg-[#155DFC]" },
		{ name: "כהה", bg: "bg-gray-900", border: "border-gray-700", text: "text-gray-100", accent: "#60a5fa", dot: "bg-gray-900" },
		{ name: "אוקיינוס", bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-900", accent: "#06b6d4", dot: "bg-cyan-500" },
		{ name: "יער", bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-900", accent: "#10b981", dot: "bg-emerald-500" },
		{ name: "חד-קרן", bg: "bg-gradient-to-br from-pink-50 to-violet-50", border: "border-pink-200", text: "text-pink-900", accent: "#ec4899", dot: "bg-gradient-to-r from-pink-400 to-violet-400" },
		{ name: "שקיעה", bg: "bg-gradient-to-br from-orange-50 to-rose-50", border: "border-orange-200", text: "text-orange-900", accent: "#f97316", dot: "bg-gradient-to-r from-orange-400 to-rose-400" },
	];

	const moreFeatures = [
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
			title: "הגנה בסיסמה",
			desc: "רק מי שיש לו את הסיסמה יכול למלא",
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
			title: "Webhook",
			desc: "נתוני הגשה נשלחים אוטומטית למערכת חיצונית",
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.5-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h3.9a2 2 0 0 1 1.69.9l.81 1.2a2 2 0 0 0 1.67.9H18a2 2 0 0 1 2 2v2"/></svg>`,
			title: "ארגון בתיקיות",
			desc: "נהל טפסים בתיקיות, העבר ומיין בקלות",
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L3 3"/><path d="m15 9 6-6"/></svg>`,
			title: "שדות חוזרים",
			desc: "\"הוסף עוד\" — קבוצת שדות שהמשתמש משכפל",
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8Z"/><path d="M15 3v4a2 2 0 0 0 2 2h4"/></svg>`,
			title: "ייבוא JSON",
			desc: "העלה מבנה טופס מ-ChatGPT או כל מקור אחר",
		},
		{
			icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
			title: "Undo / Redo",
			desc: "בטל או חזור על כל פעולה בבנאי",
		},
	];

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
						entry.target.classList.add("in-view");
						observer.unobserve(entry.target);
					}
				});
			},
			{ threshold: 0.12, rootMargin: "0px 0px -30px 0px" },
		);

		nextTick(() => {
			document.querySelectorAll(".sr").forEach((el) => observer.observe(el));
		});

		// Theme auto-cycle
		const themeInterval = setInterval(() => {
			activeTheme.value = (activeTheme.value + 1) % themes.length;
		}, 2500);

		onUnmounted(() => {
			window.removeEventListener("scroll", onScroll);
			observer.disconnect();
			clearInterval(themeInterval);
		});
	});
</script>

<template>
	<div dir="rtl" lang="he" class="hp3 overflow-x-hidden bg-white">
		<!-- ==================== NAVIGATION ==================== -->
		<nav
			class="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
			:class="
				scrolled
					? 'nav-glass shadow-sm'
					: 'bg-transparent'
			"
		>
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="flex h-16 items-center justify-between">
					<div class="flex items-center gap-2.5">
						<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-[#155DFC]">
							<Icon name="ph:stack-fill" class="h-5 w-5 text-white" />
						</div>
						<span class="text-lg font-extrabold tracking-tight text-gray-900">Autodox</span>
					</div>

					<div class="hidden items-center gap-1 md:flex">
						<button
							@click="scrollTo('features')"
							class="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
						>
							יתרונות
						</button>
						<button
							@click="scrollTo('how')"
							class="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
						>
							איך זה עובד
						</button>
						<button
							@click="scrollTo('elements')"
							class="cursor-pointer rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
						>
							אלמנטים
						</button>
						<div class="mx-2 h-5 w-px bg-gray-200"></div>
						<NuxtLink
							to="/login"
							class="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
						>
							התחברות
						</NuxtLink>
						<NuxtLink to="/signup" class="mr-1">
							<button
								class="rounded-xl bg-[#155DFC] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#1250d4] hover:shadow-lg hover:shadow-blue-500/25"
							>
								התחל בחינם
							</button>
						</NuxtLink>
					</div>

					<div class="flex items-center gap-2 md:hidden">
						<NuxtLink to="/signup">
							<button
								class="rounded-xl bg-[#155DFC] px-4 py-2 text-sm font-semibold text-white"
							>
								התחל בחינם
							</button>
						</NuxtLink>
						<button
							@click="mobileMenuOpen = !mobileMenuOpen"
							class="cursor-pointer rounded-lg p-2 transition-colors hover:bg-gray-100"
						>
							<svg v-if="!mobileMenuOpen" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
							<svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
						</button>
					</div>
				</div>

				<Transition name="dropdown">
					<div
						v-if="mobileMenuOpen"
						class="space-y-1 border-b border-gray-100 pb-4 md:hidden"
					>
						<button
							@click="scrollTo('features'); mobileMenuOpen = false"
							class="block w-full rounded-lg px-4 py-2.5 text-right text-sm font-medium text-gray-600 hover:bg-gray-50"
						>
							יתרונות
						</button>
						<button
							@click="scrollTo('how'); mobileMenuOpen = false"
							class="block w-full rounded-lg px-4 py-2.5 text-right text-sm font-medium text-gray-600 hover:bg-gray-50"
						>
							איך זה עובד
						</button>
						<button
							@click="scrollTo('elements'); mobileMenuOpen = false"
							class="block w-full rounded-lg px-4 py-2.5 text-right text-sm font-medium text-gray-600 hover:bg-gray-50"
						>
							אלמנטים
						</button>
						<NuxtLink
							to="/login"
							class="block rounded-lg px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
						>
							התחברות
						</NuxtLink>
					</div>
				</Transition>
			</div>
		</nav>

		<!-- ==================== HERO ==================== -->
		<section class="relative min-h-screen overflow-hidden pt-16">
			<!-- Background -->
			<div class="absolute inset-0">
				<div class="absolute inset-0 hero-mesh"></div>
				<div class="absolute top-[-10%] left-[-5%] h-[600px] w-[600px] rounded-full bg-blue-400/[0.07] blur-[100px] animate-drift-1"></div>
				<div class="absolute bottom-[-5%] right-[-10%] h-[500px] w-[500px] rounded-full bg-violet-400/[0.06] blur-[90px] animate-drift-2"></div>
				<div class="absolute top-[40%] right-[20%] h-[300px] w-[300px] rounded-full bg-cyan-300/[0.05] blur-[80px] animate-drift-3"></div>
			</div>

			<!-- Subtle grid -->
			<div class="absolute inset-0 grid-bg pointer-events-none"></div>

			<div class="relative z-10 mx-auto max-w-7xl px-5 sm:px-8">
				<div class="flex min-h-[calc(100vh-4rem)] flex-col lg:flex-row items-center gap-12 lg:gap-20 py-12 lg:py-0">
					<!-- Text -->
					<div class="flex-1 text-center lg:text-right pt-8 lg:pt-0">
						<div class="hero-in inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/80 px-4 py-1.5 text-xs font-semibold text-[#155DFC] mb-8 backdrop-blur-sm">
							<span class="relative flex h-1.5 w-1.5">
								<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#155DFC] opacity-75"></span>
								<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#155DFC]"></span>
							</span>
							פלטפורמת הטפסים המתקדמת בישראל
						</div>

						<h1 class="hero-in-d1 text-[2.75rem] sm:text-6xl lg:text-[4.25rem] xl:text-7xl font-extrabold leading-[1.08] tracking-tight text-gray-900">
							בנה טפסים
							<br />
							<span class="relative inline-block">
								<span class="relative z-10 text-[#155DFC]">שעושים רושם</span>
								<span class="absolute bottom-1 right-0 left-0 h-3 bg-blue-200/40 rounded-sm -z-0"></span>
							</span>
						</h1>

						<p class="hero-in-d2 mt-7 text-lg sm:text-xl leading-relaxed text-gray-500 max-w-xl mx-auto lg:mx-0 lg:mr-0">
							ממשק גרירה ושחרור, חתימה דיגיטלית, לוגיקה חכמה, ערכות עיצוב — בונים טופס מקצועי בלי לכתוב שורת קוד.
						</p>

						<div class="hero-in-d3 mt-10 flex flex-wrap items-center gap-4 justify-center lg:justify-start">
							<NuxtLink to="/signup">
								<button class="group relative rounded-2xl bg-[#155DFC] px-8 py-4 text-base font-bold text-white transition-all hover:bg-[#1250d4] hover:shadow-xl hover:shadow-blue-500/25 hover:-translate-y-0.5 flex items-center gap-2.5">
									<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
									התחל בחינם
								</button>
							</NuxtLink>

							<button
								@click="scrollTo('how')"
								class="group flex items-center gap-2.5 rounded-2xl border border-gray-200 bg-white/80 px-7 py-4 text-base font-semibold text-gray-700 backdrop-blur-sm transition-all hover:border-gray-300 hover:bg-white hover:shadow-md cursor-pointer"
							>
								<span class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 transition-colors group-hover:bg-[#155DFC] group-hover:text-white">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
								</span>
								איך זה עובד
							</button>
						</div>

						<div class="hero-in-d4 mt-10 flex items-center gap-5 justify-center lg:justify-start">
							<div class="flex -space-x-2.5 space-x-reverse">
								<div class="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 border-[2.5px] border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">יל</div>
								<div class="h-9 w-9 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 border-[2.5px] border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">דנ</div>
								<div class="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 border-[2.5px] border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">שר</div>
								<div class="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 border-[2.5px] border-white flex items-center justify-center text-[10px] font-bold text-white shadow-sm">מא</div>
							</div>
							<div class="text-sm text-gray-400">
								<span class="font-bold text-gray-600">12,500+</span> כבר משתמשים
							</div>
						</div>
					</div>

					<!-- Hero mockup -->
					<div class="flex-1 w-full max-w-xl lg:max-w-none hero-in-d3">
						<div class="relative" style="perspective: 1000px">
							<div class="hero-card-tilt">
								<!-- Glow behind card -->
								<div class="absolute -inset-6 rounded-[2rem] bg-gradient-to-br from-blue-500/10 via-transparent to-violet-500/10 blur-2xl"></div>

								<!-- Main card -->
								<div class="relative rounded-[1.25rem] border border-gray-200/80 bg-white shadow-2xl shadow-gray-900/[0.06] overflow-hidden">
									<!-- Browser chrome -->
									<div class="flex items-center gap-2 border-b border-gray-100 bg-gray-50/80 px-4 py-3">
										<div class="flex gap-1.5">
											<div class="h-2.5 w-2.5 rounded-full bg-[#FF605C]"></div>
											<div class="h-2.5 w-2.5 rounded-full bg-[#FFBD44]"></div>
											<div class="h-2.5 w-2.5 rounded-full bg-[#00CA4E]"></div>
										</div>
										<div dir="ltr" class="flex-1 rounded-lg bg-white px-3 py-1.5 text-center font-mono text-[11px] text-gray-400 border border-gray-100">
											autodox.app/builder
										</div>
									</div>

									<!-- Builder mockup -->
									<div class="flex">
										<!-- Sidebar -->
										<div class="hidden sm:block w-44 border-l border-gray-100 bg-gray-50/50 p-3 space-y-2">
											<div class="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">רכיבים</div>
											<div
												v-for="(el, i) in elements.slice(0, 6)"
												:key="i"
												class="sidebar-item flex items-center gap-2 rounded-lg px-2.5 py-2 text-xs transition-all cursor-default"
												:class="i === 0 ? 'bg-blue-50 text-[#155DFC] font-semibold border border-blue-200/60' : 'text-gray-500 hover:bg-white hover:shadow-sm'"
												:style="`animation-delay: ${0.8 + i * 0.1}s`"
											>
												<span class="text-[13px]">{{ el.icon }}</span>
												{{ el.label }}
											</div>
										</div>

										<!-- Canvas -->
										<div dir="rtl" class="flex-1 p-5 sm:p-6 space-y-4">
											<div class="mock-el" style="animation-delay: 1s">
												<h3 class="text-base font-bold text-gray-900">טופס הרשמה לאירוע</h3>
												<p class="text-xs text-gray-400 mt-0.5">מלאו את הפרטים שלכם</p>
											</div>

											<div class="mock-el" style="animation-delay: 1.15s">
												<label class="block text-xs font-semibold text-gray-600 mb-1.5">שם מלא</label>
												<div class="flex h-10 items-center rounded-xl border border-gray-200 bg-white px-3">
													<span class="text-sm text-gray-800">ישראל ישראלי</span>
													<span class="typing-cursor mr-0.5 h-4 w-[1.5px] bg-[#155DFC] rounded-full"></span>
												</div>
											</div>

											<div class="mock-el" style="animation-delay: 1.3s">
												<label class="block text-xs font-semibold text-gray-600 mb-1.5">מסלול</label>
												<div class="flex gap-3">
													<label class="flex items-center gap-1.5 cursor-default">
														<div class="flex h-4 w-4 items-center justify-center rounded-full border-2 border-[#155DFC]">
															<div class="h-2 w-2 rounded-full bg-[#155DFC]"></div>
														</div>
														<span class="text-xs text-gray-700">בסיסי</span>
													</label>
													<label class="flex items-center gap-1.5 cursor-default">
														<div class="h-4 w-4 rounded-full border-2 border-gray-300"></div>
														<span class="text-xs text-gray-400">מתקדם</span>
													</label>
													<label class="flex items-center gap-1.5 cursor-default">
														<div class="h-4 w-4 rounded-full border-2 border-gray-300"></div>
														<span class="text-xs text-gray-400">VIP</span>
													</label>
												</div>
											</div>

											<div class="mock-el" style="animation-delay: 1.45s">
												<label class="block text-xs font-semibold text-gray-600 mb-1.5">חתימה</label>
												<div class="h-16 rounded-xl border border-dashed border-gray-300 bg-gray-50/50 flex items-center justify-center">
													<!-- Simulated signature path -->
													<svg width="120" height="30" viewBox="0 0 120 30" class="text-gray-400">
														<path d="M5 22 Q15 5, 25 18 T45 12 T65 20 T85 8 T105 15 T115 10" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" class="sig-draw"/>
													</svg>
												</div>
											</div>

											<div class="mock-el" style="animation-delay: 1.6s">
												<div class="flex h-10 items-center justify-center rounded-xl bg-[#155DFC]">
													<span class="text-sm font-semibold text-white">שלח הגשה</span>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<!-- Floating badge: top-left -->
							<div class="badge-float absolute -top-3 -left-2 sm:-top-4 sm:-left-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg shadow-gray-900/[0.08] border border-gray-100" style="animation-delay: 2.2s">
								<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
								</div>
								<span class="whitespace-nowrap text-xs font-semibold text-gray-700">שמירה אוטומטית</span>
							</div>

							<!-- Floating badge: bottom-right -->
							<div class="badge-float absolute -bottom-3 -right-2 sm:-bottom-4 sm:-right-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-lg shadow-gray-900/[0.08] border border-gray-100" style="animation-delay: 2.5s">
								<div class="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-100">
									<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#155DFC" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
								</div>
								<span class="whitespace-nowrap text-xs font-semibold text-gray-700">38 הגשות היום</span>
							</div>
						</div>
					</div>
				</div>
			</div>

			<!-- Scroll hint -->
			<div class="absolute bottom-8 left-1/2 -translate-x-1/2 hero-in-d4">
				<button @click="scrollTo('features')" class="cursor-pointer flex h-10 w-6 items-start justify-center rounded-full border border-gray-300 pt-1.5 transition-colors hover:border-[#155DFC]">
					<div class="scroll-dot h-1.5 w-1.5 rounded-full bg-gray-400"></div>
				</button>
			</div>
		</section>

		<!-- ==================== FEATURES ==================== -->
		<section id="features" class="relative py-24 sm:py-32 bg-gray-50/70">
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="sr mx-auto max-w-2xl text-center mb-16">
					<div class="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-semibold text-[#155DFC] mb-5">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
						יתרונות
					</div>
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
						כל מה שצריך לטפסים
						<span class="text-[#155DFC]">מושלמים</span>
					</h2>
					<p class="mt-5 text-lg text-gray-500 leading-relaxed">
						כלים חכמים שהופכים בניית טפסים ממטלה משעממת לחוויה מהנה
					</p>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-5 lg:gap-6">
					<div
						v-for="(feature, i) in features"
						:key="i"
						class="sr group relative rounded-2xl border border-gray-200/80 bg-white p-7 sm:p-8 transition-all duration-300 hover:shadow-xl hover:shadow-gray-900/[0.04] hover:-translate-y-1 hover:border-gray-300/80"
					>
						<div class="flex items-start gap-5">
							<div
								:class="feature.bg"
								class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
							>
								<div :class="feature.iconColor" v-html="feature.icon"></div>
							</div>
							<div>
								<h3 class="text-lg font-extrabold text-gray-900">{{ feature.title }}</h3>
								<p class="mt-2 text-sm leading-relaxed text-gray-500">{{ feature.desc }}</p>
							</div>
						</div>
						<!-- Subtle gradient line at bottom -->
						<div class="absolute bottom-0 right-6 left-6 h-[2px] rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100" :class="`bg-gradient-to-l ${feature.accent}`"></div>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== ELEMENTS SHOWCASE ==================== -->
		<section id="elements" class="relative py-24 sm:py-32 bg-white overflow-hidden">
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="sr text-center mb-16">
					<div class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-4 py-1.5 text-xs font-semibold text-gray-500 mb-5">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
						ארגז כלים
					</div>
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
						אלמנטים לכל
						<span class="text-[#155DFC]">צורך</span>
					</h2>
					<p class="mt-5 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
						מגוון רחב של שדות, רכיבי עיצוב ואלמנטים מיוחדים — גרור אותם לטופס שלך
					</p>
				</div>

				<div class="sr grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4">
					<div
						v-for="(el, i) in elements"
						:key="i"
						class="element-card group flex flex-col items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/[0.04] hover:-translate-y-1 hover:border-gray-200 cursor-default"
						:style="`--delay: ${i * 60}ms`"
					>
						<div
							:class="el.color"
							class="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold transition-transform duration-300 group-hover:scale-110"
						>
							{{ el.icon }}
						</div>
						<span class="text-sm font-semibold text-gray-700">{{ el.label }}</span>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== HOW IT WORKS ==================== -->
		<section id="how" class="relative py-24 sm:py-32 bg-gray-50/70">
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="sr text-center mb-16">
					<div class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-500 mb-5">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
						תהליך
					</div>
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
						שלושה צעדים
						<span class="text-[#155DFC]">וזהו</span>
					</h2>
					<p class="mt-5 text-lg text-gray-500 leading-relaxed">
						מהרעיון לטופס מוכן — בדקות ספורות
					</p>
				</div>

				<!-- Steps -->
				<div class="relative">
					<!-- Connecting line -->
					<div class="absolute top-20 right-[16.67%] left-[16.67%] hidden h-px bg-gradient-to-l from-blue-200 via-blue-300 to-blue-200 lg:block"></div>

					<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
						<div
							v-for="(step, i) in steps"
							:key="i"
							class="sr group text-center"
						>
							<!-- Circle -->
							<div class="relative z-10 mx-auto mb-8">
								<div class="mx-auto flex h-[6.5rem] w-[6.5rem] items-center justify-center rounded-full bg-white border-2 border-gray-100 shadow-lg shadow-gray-900/[0.04] transition-all duration-300 group-hover:border-[#155DFC]/20 group-hover:shadow-xl group-hover:shadow-blue-500/10">
									<div class="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-[#155DFC] to-blue-700 text-white transition-transform duration-300 group-hover:scale-110" v-html="step.icon">
									</div>
								</div>
								<div class="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#155DFC] text-xs font-bold text-white shadow-md">
									{{ step.num }}
								</div>
							</div>

							<h3 class="text-2xl font-extrabold text-gray-900">{{ step.title }}</h3>
							<p class="mt-3 text-gray-500 leading-relaxed max-w-xs mx-auto">{{ step.desc }}</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== THEMES PREVIEW ==================== -->
		<section class="relative py-24 sm:py-32 bg-white">
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="sr text-center mb-16">
					<div class="inline-flex items-center gap-1.5 rounded-full border border-violet-200 bg-violet-50 px-4 py-1.5 text-xs font-semibold text-violet-600 mb-5">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r="2.5"/><circle cx="19" cy="16" r="2.5"/><circle cx="6" cy="18" r="2.5"/></svg>
						ערכות עיצוב
					</div>
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
						הטופס שלך,
						<span class="text-[#155DFC]">הסגנון שלך</span>
					</h2>
					<p class="mt-5 text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
						בחר מתוך ערכות עיצוב מוכנות או התאם צבעים וסגנונות לפי הצורך
					</p>
				</div>

				<!-- Theme cards -->
				<div class="sr grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
					<button
						v-for="(theme, i) in themes"
						:key="i"
						@click="activeTheme = i"
						class="group relative rounded-2xl border-2 p-4 transition-all duration-300 cursor-pointer"
						:class="activeTheme === i ? 'border-[#155DFC] shadow-lg shadow-blue-500/10 scale-[1.02]' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'"
					>
						<!-- Mini form preview -->
						<div :class="[theme.bg, theme.border]" class="rounded-xl border p-3 mb-3 transition-all">
							<div class="h-2 w-12 rounded-full mb-2" :class="theme.text" style="opacity: 0.3; background: currentColor"></div>
							<div class="h-6 rounded-lg border mb-2" :class="theme.border"></div>
							<div class="h-6 rounded-lg border mb-2" :class="theme.border"></div>
							<div class="h-6 rounded-lg" :style="`background: ${theme.accent}`"></div>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold text-gray-700">{{ theme.name }}</span>
							<div :class="theme.dot" class="h-3 w-3 rounded-full"></div>
						</div>
						<!-- Active indicator -->
						<div v-if="activeTheme === i" class="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#155DFC]">
							<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
						</div>
					</button>
				</div>
			</div>
		</section>

		<!-- ==================== MORE FEATURES ==================== -->
		<section class="relative py-24 sm:py-32 bg-gray-50/70">
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="sr text-center mb-16">
					<div class="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-xs font-semibold text-gray-500 mb-5">
						<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
						ועוד הרבה
					</div>
					<h2 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 leading-tight">
						פיצ'רים שעושים את
						<span class="text-[#155DFC]">ההבדל</span>
					</h2>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
					<div
						v-for="(f, i) in moreFeatures"
						:key="i"
						class="sr group flex items-start gap-4 rounded-2xl border border-gray-200/80 bg-white p-6 transition-all duration-300 hover:shadow-lg hover:shadow-gray-900/[0.04] hover:border-gray-300/80"
					>
						<div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-500 transition-all duration-300 group-hover:bg-[#155DFC] group-hover:text-white" v-html="f.icon">
						</div>
						<div>
							<h3 class="text-base font-bold text-gray-900">{{ f.title }}</h3>
							<p class="mt-1.5 text-sm text-gray-500 leading-relaxed">{{ f.desc }}</p>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- ==================== CTA ==================== -->
		<section class="relative overflow-hidden py-24 sm:py-32">
			<!-- Background gradient -->
			<div class="absolute inset-0 bg-gradient-to-br from-[#155DFC] via-blue-600 to-indigo-700"></div>
			<div class="absolute inset-0 grid-bg-dark pointer-events-none"></div>

			<!-- Decorative blurs -->
			<div class="absolute top-[-20%] right-[-10%] h-[400px] w-[400px] rounded-full bg-white/[0.06] blur-[80px]"></div>
			<div class="absolute bottom-[-20%] left-[-10%] h-[400px] w-[400px] rounded-full bg-blue-300/[0.08] blur-[80px]"></div>

			<div class="relative z-10 mx-auto max-w-3xl px-5 sm:px-8 text-center">
				<div class="sr">
					<div class="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm mb-8 border border-white/10">
						<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>
					</div>

					<h2 class="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
						מוכנים ליצור טפסים
						<br />
						<span class="text-blue-200">ברמה אחרת?</span>
					</h2>
					<p class="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-blue-100/80">
						הצטרפו לאלפי משתמשים שכבר בונים טפסים מקצועיים עם Autodox. חינם, בלי כרטיס אשראי.
					</p>

					<div class="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
						<NuxtLink to="/signup">
							<button class="rounded-2xl bg-white px-10 py-4 text-base font-bold text-[#155DFC] transition-all hover:bg-blue-50 hover:shadow-xl hover:shadow-black/10 hover:-translate-y-0.5 flex items-center gap-2.5">
								<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
								התחל בחינם עכשיו
							</button>
						</NuxtLink>
					</div>

					<p class="mt-5 text-sm text-blue-200/60">ללא כרטיס אשראי · ללא התחייבות · הרשמה תוך 30 שניות</p>
				</div>
			</div>
		</section>

		<!-- ==================== FOOTER ==================== -->
		<footer class="border-t border-gray-100 bg-white py-10">
			<div class="mx-auto max-w-7xl px-5 sm:px-8">
				<div class="flex flex-col items-center justify-between gap-6 sm:flex-row">
					<div class="flex items-center gap-2.5">
						<div class="flex h-8 w-8 items-center justify-center rounded-xl bg-[#155DFC]">
							<Icon name="ph:stack-fill" class="h-4 w-4 text-white" />
						</div>
						<span class="text-sm font-extrabold text-gray-900">Autodox</span>
					</div>
					<div class="flex gap-6 text-sm text-gray-400">
						<a href="#" class="transition-colors hover:text-gray-600">תנאי שימוש</a>
						<a href="#" class="transition-colors hover:text-gray-600">פרטיות</a>
						<a href="#" class="transition-colors hover:text-gray-600">צור קשר</a>
					</div>
					<p class="text-sm text-gray-400">
						&copy; {{ new Date().getFullYear() }} Autodox. כל הזכויות שמורות.
					</p>
				</div>
			</div>
		</footer>
	</div>
</template>

<style>
	.hp3 {
		font-family: 'Rubik', ui-sans-serif, system-ui, -apple-system, sans-serif;
	}

	/* ---- Nav glass ---- */
	.nav-glass {
		background: rgba(255, 255, 255, 0.82);
		backdrop-filter: blur(20px) saturate(1.8);
		border-bottom: 1px solid rgba(0, 0, 0, 0.05);
	}

	/* ---- Hero mesh background ---- */
	.hero-mesh {
		background:
			radial-gradient(ellipse 80% 60% at 70% 20%, rgba(21, 93, 252, 0.04) 0%, transparent 60%),
			radial-gradient(ellipse 60% 50% at 20% 80%, rgba(139, 92, 246, 0.03) 0%, transparent 60%),
			linear-gradient(180deg, rgba(249, 250, 251, 0.5) 0%, rgba(255, 255, 255, 1) 100%);
	}

	/* ---- Grid background ---- */
	.grid-bg {
		background-image:
			linear-gradient(rgba(0, 0, 0, 0.02) 1px, transparent 1px),
			linear-gradient(90deg, rgba(0, 0, 0, 0.02) 1px, transparent 1px);
		background-size: 60px 60px;
	}

	.grid-bg-dark {
		background-image:
			linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
			linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
		background-size: 60px 60px;
	}

	/* ---- Hero entrance animations ---- */
	.hero-in {
		animation: heroFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
	}
	.hero-in-d1 {
		animation: heroFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
	}
	.hero-in-d2 {
		animation: heroFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.35s both;
	}
	.hero-in-d3 {
		animation: heroFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both;
	}
	.hero-in-d4 {
		animation: heroFade 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.65s both;
	}

	@keyframes heroFade {
		from {
			opacity: 0;
			transform: translateY(24px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ---- Card tilt ---- */
	.hero-card-tilt {
		transform: rotateY(-2deg) rotateX(2deg);
		transition: transform 0.4s ease;
	}
	.hero-card-tilt:hover {
		transform: rotateY(0deg) rotateX(0deg);
	}

	/* ---- Mock elements ---- */
	.mock-el {
		animation: mockSlide 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes mockSlide {
		from {
			opacity: 0;
			transform: translateY(10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* ---- Sidebar items ---- */
	.sidebar-item {
		animation: sidebarSlide 0.35s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes sidebarSlide {
		from {
			opacity: 0;
			transform: translateX(8px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	/* ---- Typing cursor ---- */
	.typing-cursor {
		animation: cursorBlink 0.85s step-end infinite;
	}

	@keyframes cursorBlink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0; }
	}

	/* ---- Signature draw ---- */
	.sig-draw {
		stroke-dasharray: 200;
		stroke-dashoffset: 200;
		animation: drawSig 2s ease-out 1.8s forwards;
	}

	@keyframes drawSig {
		to {
			stroke-dashoffset: 0;
		}
	}

	/* ---- Badge float ---- */
	.badge-float {
		animation: badgeSlide 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both;
	}

	@keyframes badgeSlide {
		from {
			opacity: 0;
			transform: translateY(12px) scale(0.9);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* ---- Drift animations ---- */
	.animate-drift-1 {
		animation: drift1 22s ease-in-out infinite;
	}
	.animate-drift-2 {
		animation: drift2 26s ease-in-out infinite 3s;
	}
	.animate-drift-3 {
		animation: drift3 20s ease-in-out infinite 6s;
	}

	@keyframes drift1 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		33% { transform: translate(30px, -20px) scale(1.05); }
		66% { transform: translate(-20px, 30px) scale(0.95); }
	}

	@keyframes drift2 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		50% { transform: translate(-40px, 20px) scale(1.08); }
	}

	@keyframes drift3 {
		0%, 100% { transform: translate(0, 0) scale(1); }
		40% { transform: translate(25px, -15px) scale(1.04); }
		70% { transform: translate(-15px, 25px) scale(0.96); }
	}

	/* ---- Scroll reveal ---- */
	.sr {
		opacity: 0;
		transform: translateY(32px);
		transition:
			opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
			transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.sr.in-view {
		opacity: 1;
		transform: none;
	}

	/* ---- Element cards stagger ---- */
	.in-view .element-card {
		animation: elementPop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
		animation-delay: var(--delay);
	}

	@keyframes elementPop {
		from {
			opacity: 0;
			transform: translateY(16px) scale(0.95);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	/* ---- Scroll dot ---- */
	.scroll-dot {
		animation: scrollBounce 1.5s ease-in-out infinite;
	}

	@keyframes scrollBounce {
		0%, 100% {
			opacity: 0.4;
			transform: translateY(0);
		}
		50% {
			opacity: 1;
			transform: translateY(8px);
		}
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
