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
		elements: 0,
		reports: 0,
		permissions: 0,
		themes: 0,
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
		animateCounter("elements", 24, 1600);
		animateCounter("reports", 3, 1400);
		animateCounter("permissions", 4, 1400);
		animateCounter("themes", 5, 1400);
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
			{ threshold: 0, rootMargin: "0px 0px 0px 0px" },
		);

		// iOS Safari needs extra time after layout before IntersectionObserver works reliably
		nextTick(() => {
			setTimeout(() => {
				document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
			}, 100);
		});

		onUnmounted(() => {
			window.removeEventListener("scroll", onScroll);
			observer.disconnect();
		});
	});

	const features = [
		{
			icon: "heroicons:hand-raised",
			title: "גרור ושחרר",
			desc: "בנה טפסים עם קנבס, סרגל רכיבים ושמירה אוטומטית תוך כדי עבודה.",
			color: "text-blue-500",
			bg: "bg-blue-500/10",
		},
		{
			icon: "heroicons:sparkles",
			title: "יצירה מ-AI ו-JSON",
			desc: "התחל מטופס שנוצר ב-AI, ייבא JSON קיים או ייצא מבנה לשימוש חוזר.",
			color: "text-fuchsia-500",
			bg: "bg-fuchsia-500/10",
		},
		{
			icon: "heroicons:adjustments-horizontal",
			title: "לוגיקה מותנית",
			desc: "הצג, הסתר או הפוך שדות לחובה לפי תשובות קודמות ותנאים ברורים.",
			color: "text-violet-500",
			bg: "bg-violet-500/10",
		},
		{
			icon: "heroicons:squares-2x2",
			title: "פריסות מורכבות",
			desc: "ארגן שדות במקטעים, רשתות ושדות חזרה שמתאימים גם למסכים קטנים.",
			color: "text-indigo-500",
			bg: "bg-indigo-500/10",
		},
		{
			icon: "heroicons:share",
			title: "שיתוף והרשאות",
			desc: "שתף טפסים עם משתמשים אחרים וקבע מי יכול לערוך, ליצור או לנהל הגשות.",
			color: "text-emerald-500",
			bg: "bg-emerald-500/10",
		},
		{
			icon: "heroicons:folder",
			title: "תיקיות וחיפוש",
			desc: "נהל הרבה טפסים עם תיקיות, סינון, חיפוש, שכפול וסטטוסים ברורים.",
			color: "text-sky-500",
			bg: "bg-sky-500/10",
		},
		{
			icon: "heroicons:chart-bar",
			title: "דוחות ביצועים",
			desc: "עקוב אחרי סטטוסים, זמני מילוי, מזהים חיצוניים וביצועים לפי טופס.",
			color: "text-amber-500",
			bg: "bg-amber-500/10",
		},
		{
			icon: "heroicons:link",
			title: "קישורי הגשה אישיים",
			desc: "צור קישור ייעודי עם שם פנימי, מזהה חיצוני, נתונים מקדימים ותוקף.",
			color: "text-cyan-500",
			bg: "bg-cyan-500/10",
		},
		{
			icon: "heroicons:shield-check",
			title: "הגנה והגדרות מילוי",
			desc: "שלוט בגישה ציבורית, בסיסמה, הורדת PDF לממלא והגדרות לפי הגשה.",
			color: "text-slate-500",
			bg: "bg-slate-500/10",
		},
		{
			icon: "heroicons:document-arrow-down",
			title: "PDF וציר זמן",
			desc: "הורד PDF להגשה, ראה מתי הקישור נוצר, התחיל, הוגש, ננעל או הועבר לארכיון.",
			color: "text-red-500",
			bg: "bg-red-500/10",
		},
		{
			icon: "heroicons:signal",
			title: "Webhooks עם בקרה",
			desc: "שלח נתונים לשירותים חיצוניים, צרף PDF, בדוק ניסיונות ושלח מחדש כשצריך.",
			color: "text-orange-500",
			bg: "bg-orange-500/10",
		},
		{
			icon: "heroicons:arrow-up-tray",
			title: "העלאת קבצים",
			desc: "אפשר למשתמשים להעלות קבצים, תמונות ומסמכים ישירות דרך הטופס.",
			color: "text-teal-500",
			bg: "bg-teal-500/10",
		},
		{
			icon: "heroicons:paint-brush",
			title: "ערכות נושא ו-RTL",
			desc: "בחר מראה לטופס, כולל תמיכה מלאה בעברית, RTL והתאמה לנייד.",
			color: "text-lime-500",
			bg: "bg-lime-500/10",
		},
	];
</script>

<template>
	<div dir="rtl" lang="he" class="overflow-x-hidden bg-white">
		<ContentSectionHomepageNav :scrolled="scrolled" :scroll-to="scrollTo" />
		<ContentSectionHomepageHero :scroll-to="scrollTo" />
		<ContentSectionUsageMetrics :counters="counters" />
		<ContentSectionHomepageAiBuilder :scroll-to="scrollTo" />
		<ContentSectionHomepageFeatures :features="features" />
		<ContentSectionHomepageOperations />
		<ContentSectionHowItWorks :scroll-to="scrollTo" />
		<ContentSectionHomepageCTA />
		<ContentSectionFormElements />
		<ContentSectionContactUs />
		<ContentSectionHomepageFooter />
	</div>
</template>

<style scoped>
	* {
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
	.hero-enter,
	.hero-enter-d2,
	.hero-enter-d3,
	.hero-enter-d4 {
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		will-change: opacity, transform;
	}
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
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		will-change: opacity, transform;
		transition:
			opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.reveal.revealed {
		opacity: 1;
		transform: translateY(0);
	}

	/* ---- Stagger children ---- */
	.stagger > * {
		opacity: 0;
		transform: translateY(20px);
		-webkit-backface-visibility: hidden;
		backface-visibility: hidden;
		will-change: opacity, transform;
		transition:
			opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1),
			transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
	}

	.stagger.revealed > * {
		opacity: 1;
		transform: translateY(0);
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
	.stagger.revealed > *:nth-child(9) {
		transition-delay: 480ms;
	}
	.stagger.revealed > *:nth-child(10) {
		transition-delay: 540ms;
	}
	.stagger.revealed > *:nth-child(11) {
		transition-delay: 600ms;
	}
	.stagger.revealed > *:nth-child(12) {
		transition-delay: 660ms;
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
