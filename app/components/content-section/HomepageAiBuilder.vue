<script setup lang="ts">
	defineProps<{
		scrollTo: (id: string) => void;
	}>();

	const supportedFiles = ["PDF", "Word", "JPG", "PNG", "WebP"];

	const steps = [
		{
			title: "מעלים קובץ",
			desc: "מסמך קיים, צילום או PDF עם מבנה הטופס הרצוי.",
			icon: "heroicons:arrow-up-tray",
		},
		{
			title: "ה-AI מזהה שדות",
			desc: "כותרות, אפשרויות בחירה, שדות חובה ולוגיקה בסיסית הופכים למבנה עריך.",
			icon: "heroicons:sparkles",
		},
		{
			title: "ממשיכים לערוך",
			desc: "הטופס נשמר ב-Autodox ואפשר לפתוח אותו בבונה, לשתף ולנהל הגשות.",
			icon: "heroicons:pencil-square",
		},
	];

	const generatedFields = [
		{ label: "שם מלא", type: "טקסט", icon: "heroicons:pencil" },
		{ label: "אימייל", type: "אימייל", icon: "heroicons:envelope" },
		{ label: "סוג בקשה", type: "בחירה", icon: "heroicons:list-bullet" },
		{ label: "חתימת לקוח", type: "חתימה", icon: "heroicons:pencil-square" },
	];
</script>

<template>
	<section id="ai-builder" class="relative overflow-hidden bg-slate-950 py-24 sm:py-32">
		<div class="dot-grid absolute inset-0 opacity-60"></div>
		<div class="absolute inset-x-0 top-0 h-px bg-linear-to-l from-transparent via-cyan-400/40 to-transparent"></div>

		<div class="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
			<div class="reveal grid items-center gap-12 lg:grid-cols-[0.92fr_1.08fr]">
				<div>
					<div class="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-sm font-semibold text-cyan-200">
						<Icon name="heroicons:sparkles" class="h-4 w-4" />
						יצירת טופס עם AI
					</div>

					<h2 class="mt-6 text-3xl font-extrabold leading-tight text-white sm:text-4xl md:text-5xl">
						הופכים מסמך קיים לטופס דינמי תוך דקות.
					</h2>

					<p class="mt-5 max-w-xl text-lg leading-relaxed text-slate-400">
						מעלים PDF, Word או תמונה, ו-Autodox מחלץ מהם מבנה טופס עם שדות,
						אפשרויות, טקסטים ותנאים. אחרי היצירה ממשיכים לערוך בבונה הרגיל.
					</p>

					<div class="mt-7 flex flex-wrap gap-2">
						<span
							v-for="file in supportedFiles"
							:key="file"
							class="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-bold text-slate-300"
						>
							{{ file }}
						</span>
					</div>

					<div class="mt-9 flex flex-wrap items-center gap-4">
						<NuxtLink to="/manage/form/ai">
							<BaseButton variant="primary" size="lg" class="rounded-xl! px-7!">
								<Icon name="heroicons:sparkles" class="h-5 w-5" />
								צור טופס עם AI
							</BaseButton>
						</NuxtLink>
						<button
							type="button"
							@click="scrollTo('features')"
							class="cursor-pointer rounded-xl border border-white/10 px-7 py-3.5 text-sm font-semibold text-white/80 transition-colors hover:border-white/20 hover:bg-white/5 hover:text-white"
						>
							ראה יכולות נוספות
						</button>
					</div>
				</div>

				<div class="relative">
					<div class="absolute -inset-4 rounded-3xl border border-cyan-400/10"></div>
					<div class="relative overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl shadow-cyan-500/10">
						<div class="border-b border-gray-100 bg-gray-50 px-5 py-4">
							<div class="flex items-center justify-between gap-4">
								<div>
									<p class="text-xs font-semibold text-gray-400">קובץ מקור</p>
									<p class="mt-1 text-sm font-bold text-gray-900">טופס קליטת לקוח.pdf</p>
								</div>
								<span class="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
									מוכן ליצירה
								</span>
							</div>
						</div>

						<div class="grid gap-0 lg:grid-cols-[0.82fr_1fr]">
							<div class="border-b border-gray-100 bg-gray-50 p-5 lg:border-b-0 lg:border-l">
								<div class="rounded-xl border border-dashed border-gray-300 bg-white p-4">
									<div class="flex items-center gap-3">
										<div class="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
											<Icon name="heroicons:document-text" class="h-6 w-6" />
										</div>
										<div>
											<p class="text-sm font-bold text-gray-900">מסמך מקורי</p>
											<p class="text-xs text-gray-400">12 שדות מזוהים</p>
										</div>
									</div>

									<div class="mt-5 space-y-2">
										<div class="h-2 rounded-full bg-gray-200"></div>
										<div class="h-2 w-5/6 rounded-full bg-gray-200"></div>
										<div class="h-2 w-3/5 rounded-full bg-gray-200"></div>
									</div>
								</div>

								<div class="mt-4 space-y-3">
									<div
										v-for="(step, index) in steps"
										:key="step.title"
										class="flex gap-3"
									>
										<div class="flex flex-col items-center">
											<div
												class="flex h-8 w-8 items-center justify-center rounded-full"
												:class="index === 1 ? 'bg-cyan-100 text-cyan-700' : 'bg-emerald-100 text-emerald-700'"
											>
												<Icon :name="step.icon" class="h-4 w-4" />
											</div>
											<div v-if="index < steps.length - 1" class="mt-2 h-8 w-px bg-gray-200"></div>
										</div>
										<div>
											<p class="text-sm font-bold text-gray-900">{{ step.title }}</p>
											<p class="mt-0.5 text-xs leading-relaxed text-gray-500">{{ step.desc }}</p>
										</div>
									</div>
								</div>
							</div>

							<div class="p-5">
								<div class="flex items-center justify-between gap-4">
									<div>
										<p class="text-xs font-semibold text-gray-400">טופס שנוצר</p>
										<h3 class="mt-1 text-lg font-bold text-gray-900">קליטת לקוח חדש</h3>
									</div>
									<Icon name="heroicons:check-circle" class="h-7 w-7 text-emerald-500" />
								</div>

								<div class="mt-5 space-y-3">
									<div
										v-for="field in generatedFields"
										:key="field.label"
										class="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3"
									>
										<div class="flex items-center gap-3">
											<span class="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-blue-500 ring-1 ring-gray-200">
												<Icon :name="field.icon" class="h-5 w-5" />
											</span>
											<span class="text-sm font-semibold text-gray-800">{{ field.label }}</span>
										</div>
										<span class="rounded-full bg-white px-2.5 py-1 text-xs font-bold text-gray-500 ring-1 ring-gray-200">
											{{ field.type }}
										</span>
									</div>
								</div>

								<div class="mt-5 rounded-xl bg-blue-50 p-4">
									<div class="flex items-center gap-2 text-sm font-bold text-blue-700">
										<Icon name="heroicons:adjustments-horizontal" class="h-5 w-5" />
										מבנה תקין ומוכן לעריכה
									</div>
									<p class="mt-1 text-xs leading-relaxed text-blue-600">
										אפשר להוסיף תנאים, לשנות פריסה, להגדיר הרשאות ולפרסם.
									</p>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>
</template>
