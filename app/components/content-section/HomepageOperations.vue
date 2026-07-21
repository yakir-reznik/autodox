<script setup lang="ts">
	const lanes = [
		{
			title: "ניהול טפסים",
			icon: "heroicons:folder-open",
			accent: "bg-sky-500",
			items: ["תיקיות", "חיפוש", "סטטוסים", "שכפול"],
		},
		{
			title: "שיתוף עבודה",
			icon: "heroicons:users",
			accent: "bg-emerald-500",
			items: ["צפייה בהגשות", "יצירת הגשות", "ניהול הגשות", "עריכת טופס"],
		},
		{
			title: "הגשות אישיות",
			icon: "heroicons:identification",
			accent: "bg-amber-500",
			items: ["שם פנימי", "מזהה חיצוני", "מילוי מוקדם", "נתונים נוספים"],
		},
		{
			title: "בקרה וסגירה",
			icon: "heroicons:presentation-chart-line",
			accent: "bg-rose-500",
			items: ["דוחות", "ציר זמן", "PDF", "Webhook"],
		},
	];

	const detailRows = [
		{ label: "CRM-4832", status: "בתהליך", tone: "bg-blue-50 text-blue-700" },
		{ label: "SUP-0198", status: "הושלם", tone: "bg-emerald-50 text-emerald-700" },
		{ label: "OPS-7721", status: "פג תוקף", tone: "bg-amber-50 text-amber-700" },
	];
</script>

<template>
	<section id="operations" class="relative overflow-hidden bg-white py-24 sm:py-32">
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="reveal grid items-end gap-8 lg:grid-cols-[0.9fr_1.1fr]">
				<div>
					<p class="text-sm font-semibold text-blue-600">מה נוסף במערכת</p>
					<h2 class="mt-3 text-3xl font-extrabold leading-tight text-gray-900 sm:text-4xl">
						לא רק בונים טופס. מנהלים תהליך שלם סביבו.
					</h2>
					<p class="mt-4 max-w-xl text-lg leading-relaxed text-gray-500">
						Autodox כבר מכסה את העבודה שאחרי הפרסום: הרשאות, תיקיות, קישורי
						הגשה ייעודיים, נתונים מקדימים, דוחות, PDF ומשלוחי Webhook.
					</p>
				</div>

				<div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
					<div
						v-for="lane in lanes"
						:key="lane.title"
						class="rounded-xl border border-gray-100 bg-gray-50 p-4"
					>
						<div class="flex items-center gap-2">
							<span
								:class="lane.accent"
								class="flex h-8 w-8 items-center justify-center rounded-lg text-white"
							>
								<Icon :name="lane.icon" class="h-4 w-4" />
							</span>
							<h3 class="text-sm font-bold text-gray-900">{{ lane.title }}</h3>
						</div>
						<div class="mt-4 flex flex-wrap gap-1.5">
							<span
								v-for="item in lane.items"
								:key="item"
								class="rounded-full bg-white px-2.5 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-200"
							>
								{{ item }}
							</span>
						</div>
					</div>
				</div>
			</div>

			<div class="reveal mt-14 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
				<div class="overflow-hidden rounded-2xl border border-gray-200 bg-slate-950 shadow-xl">
					<div class="flex items-center justify-between border-b border-white/10 px-5 py-4">
						<div>
							<p class="text-xs text-slate-400">לוח הגשות</p>
							<h3 class="mt-1 text-lg font-bold text-white">מעקב לפי מזהה חיצוני</h3>
						</div>
						<div class="flex gap-1.5">
							<span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
							<span class="h-2.5 w-2.5 rounded-full bg-amber-400"></span>
							<span class="h-2.5 w-2.5 rounded-full bg-rose-400"></span>
						</div>
					</div>

					<div class="grid gap-0 divide-y divide-white/10">
						<div
							v-for="row in detailRows"
							:key="row.label"
							class="grid grid-cols-[1fr_auto_auto] items-center gap-4 px-5 py-4"
						>
							<code dir="ltr" class="text-sm font-semibold text-white">{{ row.label }}</code>
							<span :class="row.tone" class="rounded-full px-3 py-1 text-xs font-bold">
								{{ row.status }}
							</span>
							<Icon name="heroicons:arrow-left" class="h-4 w-4 text-slate-500" />
						</div>
					</div>

					<div class="grid gap-3 border-t border-white/10 p-5 sm:grid-cols-3">
						<div class="rounded-xl bg-white/5 p-4">
							<p class="text-xs text-slate-400">השלמה</p>
							<p class="mt-2 text-2xl font-black text-white">78%</p>
						</div>
						<div class="rounded-xl bg-white/5 p-4">
							<p class="text-xs text-slate-400">זמן מילוי ממוצע</p>
							<p class="mt-2 text-2xl font-black text-white">06:14</p>
						</div>
						<div class="rounded-xl bg-white/5 p-4">
							<p class="text-xs text-slate-400">משלוחי Webhook</p>
							<p class="mt-2 text-2xl font-black text-white">12</p>
						</div>
					</div>
				</div>

				<div class="space-y-4">
					<div class="rounded-2xl border border-gray-200 bg-gray-50 p-5">
						<div class="flex items-center justify-between gap-4">
							<div>
								<p class="text-xs font-semibold text-gray-500">יצירת קישור הגשה</p>
								<h3 class="mt-1 text-lg font-bold text-gray-900">
									כל הגשה יכולה לקבל הקשר משלה
								</h3>
							</div>
							<Icon name="heroicons:link" class="h-8 w-8 text-blue-500" />
						</div>
						<div class="mt-5 grid gap-3 sm:grid-cols-2">
							<div class="rounded-xl bg-white p-3 ring-1 ring-gray-200">
								<p class="text-xs text-gray-400">מילוי מוקדם</p>
								<p class="mt-1 text-sm font-semibold text-gray-800">שם, אימייל, תאריך</p>
							</div>
							<div class="rounded-xl bg-white p-3 ring-1 ring-gray-200">
								<p class="text-xs text-gray-400">Override</p>
								<p class="mt-1 text-sm font-semibold text-gray-800">סיסמה, PDF, Webhook</p>
							</div>
						</div>
					</div>

					<div class="rounded-2xl border border-gray-200 bg-gray-50 p-5">
						<div class="flex items-center gap-3">
							<span class="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
								<Icon name="heroicons:check-circle" class="h-5 w-5" />
							</span>
							<div>
								<h3 class="text-lg font-bold text-gray-900">מסירה עם הוכחות</h3>
								<p class="text-sm text-gray-500">
									פרטי בקשה, תשובה, קוד HTTP וניסיונות חוזרים נשמרים לצד ההגשה.
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
