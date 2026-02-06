<script setup lang="ts">
	const colorMap = {
		blue: {
			badge: "bg-blue-50 text-blue-600",
			icon: "bg-blue-50 text-blue-500 group-hover:bg-blue-100",
			border: "hover:border-blue-200",
		},
		violet: {
			badge: "bg-violet-50 text-violet-600",
			icon: "bg-violet-50 text-violet-500 group-hover:bg-violet-100",
			border: "hover:border-violet-200",
		},
		amber: {
			badge: "bg-amber-50 text-amber-600",
			icon: "bg-amber-50 text-amber-500 group-hover:bg-amber-100",
			border: "hover:border-amber-200",
		},
		emerald: {
			badge: "bg-emerald-50 text-emerald-600",
			icon: "bg-emerald-50 text-emerald-500 group-hover:bg-emerald-100",
			border: "hover:border-emerald-200",
		},
	};

	type CategoryColor = keyof typeof colorMap;

	const categories: {
		key: string;
		title: string;
		desc: string;
		color: CategoryColor;
		elements: { icon: string; label: string }[];
	}[] = [
		{
			key: "input",
			title: "שדות קלט",
			desc: "שדות בסיסיים לאיסוף מידע מהמשתמשים",
			color: "blue",
			elements: [
				{ icon: "heroicons:pencil", label: "טקסט" },
				{ icon: "heroicons:envelope", label: "אימייל" },
				{ icon: "heroicons:document-text", label: "אזור טקסט" },
				{ icon: "heroicons:hashtag", label: "מספר" },
				{ icon: "heroicons:calendar", label: "תאריך" },
				{ icon: "heroicons:clock", label: "שעה" },
				{ icon: "heroicons:calendar-days", label: "תאריך ושעה" },
			],
		},
		{
			key: "selection",
			title: "שדות בחירה",
			desc: "אפשרויות בחירה מתוך רשימה מוגדרת מראש",
			color: "violet",
			elements: [
				{ icon: "heroicons:chevron-down", label: "רשימה נפתחת" },
				{ icon: "heroicons:check-circle", label: "בחירה בודדת" },
				{ icon: "heroicons:check", label: "תיבת סימון" },
				{ icon: "heroicons:list-bullet", label: "תיבות סימון" },
			],
		},
		{
			key: "special",
			title: "שדות מיוחדים",
			desc: "רכיבים מתקדמים ליכולות מורחבות",
			color: "amber",
			elements: [
				{ icon: "heroicons:pencil-square", label: "חתימה" },
				{ icon: "heroicons:arrows-pointing-out", label: "שדה חזרה" },
			],
		},
		{
			key: "layout",
			title: "תוכן ועיצוב",
			desc: "רכיבי מבנה ותוכן לעיצוב הטופס",
			color: "emerald",
			elements: [
				{ icon: "heroicons:rectangle-group", label: "מקטע" },
				{ icon: "heroicons:h1", label: "כותרת 1" },
				{ icon: "heroicons:h2", label: "כותרת 2" },
				{ icon: "heroicons:h3", label: "כותרת 3" },
				{ icon: "heroicons:bars-3-bottom-left", label: "פסקה" },
				{ icon: "heroicons:photo", label: "תמונה" },
				{ icon: "heroicons:video-camera", label: "וידאו" },
				{ icon: "heroicons:minus", label: "מפריד" },
				{ icon: "heroicons:arrows-up-down", label: "מרווח" },
			],
		},
	];
</script>

<template>
	<section id="form-elements" class="relative bg-gray-100 py-24 sm:py-32">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="reveal mx-auto max-w-2xl text-center">
				<h2 class="text-3xl font-extrabold text-gray-900 sm:text-4xl">
					20+ רכיבים לבניית כל טופס
				</h2>
				<p class="mt-4 text-lg leading-relaxed text-gray-500">
					מגוון רחב של שדות קלט, בחירה, תוכן ועיצוב — הכל מוכן לשימוש
				</p>
			</div>

			<div class="mt-16 space-y-12">
				<div v-for="category in categories" :key="category.key" class="reveal">
					<div class="mb-6 flex items-center gap-3">
						<span
							:class="colorMap[category.color].badge"
							class="rounded-full px-3 py-1 text-sm font-semibold"
						>
							{{ category.title }}
						</span>
						<span class="text-sm text-gray-400">
							{{ category.desc }}
						</span>
					</div>

					<div
						class="reveal stagger grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
					>
						<div
							v-for="(element, i) in category.elements"
							:key="i"
							:class="colorMap[category.color].border"
							class="group flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
						>
							<div
								:class="colorMap[category.color].icon"
								class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-200"
							>
								<Icon :name="element.icon" class="h-5 w-5" />
							</div>
							<span class="text-sm font-semibold text-gray-700">
								{{ element.label }}
							</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
