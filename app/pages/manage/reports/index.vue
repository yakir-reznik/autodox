<script setup lang="ts">
	import type { OverviewReportResponse } from "~/types/reports";

	useHead({ title: "דוחות - Autodox" });

	definePageMeta({
		layout: "management-panel",
		heading: "דו״חות",
		breadcrumbs: [
			{ label: "ניהול טפסים", to: "/manage" },
			{ label: "דוח״ות" },
		],
	});

	const {
		selectedPreset,
		fromDate,
		toDate,
		appliedFrom,
		appliedTo,
		rangeError,
		canApply,
		applyPreset,
		applyFilters,
	} = useReportDateRange();

	const { data: overview, pending } = await useFetch<OverviewReportResponse>(
		"/api/admin/reports/overview",
		{
			query: computed(() => ({
				from: appliedFrom.value,
				to: appliedTo.value,
			})),
		},
	);

	const reportCards = [
		{
			to: "/manage/reports/submissions-summary-by-externalId",
			icon: "heroicons:chart-bar-square",
			title: "ביצועים לפי מזהה חיצוני",
			description: "סה״כ, סטטוסים, טפסים ייחודיים, אחוז השלמה וזמן מילוי לפי מזהה חיצוני",
		},
		{
			to: "/manage/reports/submissions-by-externalId",
			icon: "heroicons:table-cells",
			title: "פירוט לפי טופס ומזהה חיצוני",
			description: "פירוט ביצועים לכל שילוב של טופס ומזהה חיצוני",
		},
		{
			to: "/manage/reports/forms-performance",
			icon: "heroicons:document-chart-bar",
			title: "ביצועי טפסים",
			description: "השוואת טפסים לפי כמות הגשות, השלמות וזמן מילוי ממוצע",
		},
	];

	const statusCards = computed(() => [
		{ label: "סה״כ", value: overview.value?.total ?? 0 },
		{ label: "ממתין", value: overview.value?.pending ?? 0 },
		{ label: "בתהליך", value: overview.value?.in_progress ?? 0 },
		{ label: "הושלמו", value: overview.value?.submittedCount ?? 0 },
		{ label: "ציבוריות", value: overview.value?.publicCount ?? 0 },
		{ label: "עם קישור", value: overview.value?.tokenCount ?? 0 },
		{ label: "בארכיון", value: overview.value?.archivedCount ?? 0 },
	]);

	function formatPercent(value: number | undefined) {
		return `${(value ?? 0).toFixed(1).replace(".0", "")}%`;
	}

	function formatDuration(seconds: number | null | undefined) {
		if (seconds == null) return "-";
		if (seconds < 60) return `${seconds} שנ׳`;
		const minutes = Math.round(seconds / 60);
		if (minutes < 60) return `${minutes} דק׳`;
		const hours = Math.floor(minutes / 60);
		const rest = minutes % 60;
		return rest ? `${hours} שע׳ ${rest} דק׳` : `${hours} שע׳`;
	}
</script>

<template>
	<main class="space-y-8">
		<div class="bg-white rounded-lg shadow p-4">
			<div class="flex flex-wrap items-end gap-4">
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium text-gray-700">טווח מהיר</label>
					<select
						v-model="selectedPreset"
						class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						@change="applyPreset(selectedPreset)"
					>
						<option v-for="preset in reportDatePresets" :key="preset.value" :value="preset.value">
							{{ preset.label }}
						</option>
					</select>
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium text-gray-700">מתאריך</label>
					<input v-model="fromDate" type="date" class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium text-gray-700">עד תאריך</label>
					<input v-model="toDate" type="date" class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500" />
				</div>
				<BaseButton variant="primary" :disabled="!canApply" @click="applyFilters">החל</BaseButton>
			</div>
			<p v-if="rangeError" class="mt-2 text-sm text-red-600">{{ rangeError }}</p>
		</div>

		<div v-if="pending" class="flex items-center justify-center py-12">
			<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
		</div>
		<div v-else class="space-y-6">
			<div>
				<h2 class="text-lg font-semibold text-gray-900">תצוגה מקדימה</h2>
				<p class="mt-1 text-sm text-gray-500">מדדים מרכזיים עבור טווח התאריכים שנבחר</p>
			</div>

			<section class="grid gap-4 md:grid-cols-4">
				<div v-for="card in statusCards" :key="card.label" class="bg-gray-50 rounded-lg border border-gray-100 p-4">
					<p class="text-sm text-gray-500">{{ card.label }}</p>
					<p class="mt-2 text-2xl font-semibold text-gray-900">{{ card.value }}</p>
				</div>
				<div class="bg-gray-50 rounded-lg border border-gray-100 p-4">
					<p class="text-sm text-gray-500">אחוז השלמה</p>
					<p class="mt-2 text-2xl font-semibold text-gray-900">{{ formatPercent(overview?.completionRate) }}</p>
				</div>
				<div class="bg-gray-50 rounded-lg border border-gray-100 p-4">
					<p class="text-sm text-gray-500">זמן מילוי ממוצע</p>
					<p class="mt-2 text-2xl font-semibold text-gray-900">{{ formatDuration(overview?.avgFillTimeSeconds) }}</p>
				</div>
			</section>

			<section class="grid gap-6 lg:grid-cols-2">
				<div class="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
					<div class="border-b border-gray-100 px-4 py-3">
						<h2 class="text-base font-semibold text-gray-900">טפסים מובילים</h2>
					</div>
					<table class="min-w-full divide-y divide-gray-200 text-sm">
						<tbody class="divide-y divide-gray-100">
							<tr v-for="form in overview?.topForms ?? []" :key="form.formId">
								<td class="px-4 py-3 font-medium text-gray-900">{{ form.formName }}</td>
								<td class="px-4 py-3 text-center text-gray-700">{{ form.total }}</td>
								<td class="px-4 py-3 text-center text-gray-700">{{ formatPercent(form.completionRate) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
				<div class="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
					<div class="border-b border-gray-100 px-4 py-3">
						<h2 class="text-base font-semibold text-gray-900">מזהים חיצוניים מובילים</h2>
					</div>
					<table class="min-w-full divide-y divide-gray-200 text-sm">
						<tbody class="divide-y divide-gray-100">
							<tr v-for="item in overview?.topExternalIds ?? []" :key="item.externalId ?? '__empty__'">
								<td class="px-4 py-3 font-medium text-gray-900">{{ item.externalId || "ללא מזהה חיצוני" }}</td>
								<td class="px-4 py-3 text-center text-gray-700">{{ item.total }}</td>
								<td class="px-4 py-3 text-center text-gray-700">{{ formatPercent(item.completionRate) }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</section>
		</div>

		<section class="space-y-4">
			<div>
				<h2 class="text-lg font-semibold text-gray-900">רשימת דוחות</h2>
				<p class="mt-1 text-sm text-gray-500">בחר דוח כדי לראות פירוט מלא ומיון לפי עמודות</p>
			</div>
			<div class="grid gap-6 md:grid-cols-3">
				<NuxtLink v-for="card in reportCards" :key="card.to" :to="card.to">
					<UiCard class="h-full cursor-pointer border-gray-100 bg-gray-50 hover:shadow-md transition-shadow">
						<UiCardHeader>
							<UiCardTitle class="flex items-center gap-2">
								<Icon :name="card.icon" class="h-5 w-5 text-blue-500" />
								{{ card.title }}
							</UiCardTitle>
							<UiCardDescription>{{ card.description }}</UiCardDescription>
						</UiCardHeader>
					</UiCard>
				</NuxtLink>
			</div>
		</section>
	</main>
</template>
