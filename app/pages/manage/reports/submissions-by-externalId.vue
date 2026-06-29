<script setup lang="ts">
	import type { FormExternalIdPerformanceRow, SubmissionStatusSummary } from "~/types/reports";

	useHead({ title: "פירוט לפי טופס ומזהה חיצוני - Autodox" });

	definePageMeta({
		layout: "management-panel",
		heading: "פירוט לפי טופס ומזהה חיצוני",
		breadcrumbs: [
			{ label: "ניהול טפסים", to: "/manage" },
			{ label: "דוח״ות", to: "/manage/reports" },
			{ label: "פירוט לפי טופס ומזהה חיצוני" },
		],
	});

	type Status = Extract<keyof SubmissionStatusSummary, "pending" | "in_progress" | "submitted" | "locked">;

	const statuses: Status[] = ["pending", "in_progress", "submitted", "locked"];
	const statusLabels = {
		pending: "ממתין",
		in_progress: "בתהליך",
		submitted: "הוגש",
		locked: "נעול",
	};
	const statusColors = {
		pending: "bg-gray-100 text-gray-800",
		in_progress: "bg-blue-100 text-blue-800",
		submitted: "bg-green-100 text-green-800",
		locked: "bg-red-100 text-red-800",
	};

	const allExternalIdsValue = "__all__";
	const selectedExternalId = ref<string>(allExternalIdsValue);
	const appliedExternalId = ref<string>(allExternalIdsValue);

	const {
		selectedPreset,
		fromDate,
		toDate,
		appliedFrom,
		appliedTo,
		rangeError,
		canApply,
		applyPreset,
		applyFilters: applyDateFilters,
	} = useReportDateRange();

	const { data: externalIds } = await useFetch<{ externalId: string }[]>(
		"/api/admin/reports/external-ids",
	);

	const { data: rows, pending } = await useFetch<FormExternalIdPerformanceRow[]>(
		"/api/admin/reports/submissions-by-external-id",
		{
			query: computed(() => ({
				externalId:
					appliedExternalId.value === allExternalIdsValue
						? undefined
						: appliedExternalId.value,
				from: appliedFrom.value,
				to: appliedTo.value,
			})),
		},
	);

	const reportRows = computed(() => rows.value ?? []);
	const { sortedRows, sortBy, sortIcon } = useReportSorting<FormExternalIdPerformanceRow>(
		reportRows,
		"formName",
		"asc",
	);

	const totals = computed(() =>
		reportRows.value.reduce(
			(acc, row) => {
				for (const status of statuses) acc[status] += row[status];
				acc.total += row.total;
				acc.startedCount += row.startedCount;
				acc.submittedCount += row.submittedCount;
				return acc;
			},
			{
				pending: 0,
				in_progress: 0,
				submitted: 0,
				locked: 0,
				total: 0,
				startedCount: 0,
				submittedCount: 0,
			},
		),
	);

	const totalCompletionRate = computed(() =>
		totals.value.total > 0 ? (totals.value.submittedCount / totals.value.total) * 100 : 0,
	);

	function applyFilters() {
		if (!applyDateFilters()) return;
		appliedExternalId.value = selectedExternalId.value;
	}

	function formatPercent(value: number) {
		return `${value.toFixed(1).replace(".0", "")}%`;
	}

	function formatDuration(seconds: number | null) {
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
	<main>
		<div class="bg-white rounded-lg shadow p-4 mb-6">
			<div class="flex flex-wrap items-end gap-4">
				<div class="flex flex-col gap-1 mb-4 ml-4">
					<label class="text-sm font-medium text-gray-700">מזהה חיצוני</label>
					<p v-if="!externalIds?.length" class="text-sm text-gray-400">אין מזהים חיצוניים זמינים</p>
					<UiSelect v-else v-model="selectedExternalId">
						<UiSelectTrigger class="w-48">
							<UiSelectValue placeholder="כל המזהים" />
						</UiSelectTrigger>
						<UiSelectContent>
							<UiSelectItem :value="allExternalIdsValue">כל המזהים</UiSelectItem>
							<UiSelectItem v-for="item in externalIds" :key="item.externalId" :value="item.externalId">
								{{ item.externalId }}
							</UiSelectItem>
						</UiSelectContent>
					</UiSelect>
				</div>
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
		<div v-else-if="!reportRows.length" class="bg-white rounded-lg shadow p-12 text-center text-gray-500">
			<Icon name="heroicons:table-cells" class="mx-auto h-12 w-12 text-gray-300 mb-3" />
			<p>לא נמצאו תוצאות עבור הפילטרים שנבחרו</p>
		</div>
		<div v-else class="bg-white rounded-lg shadow overflow-x-auto max-w-7xl">
			<table class="min-w-full divide-y divide-gray-200 text-sm">
				<thead class="bg-gray-50">
					<tr>
						<th class="px-4 py-3 text-right font-medium text-gray-500">
							<button class="inline-flex items-center gap-1" @click="sortBy('formName')">
								שם טופס
								<Icon :name="sortIcon('formName')" class="h-4 w-4" />
							</button>
						</th>
						<th class="px-4 py-3 text-right font-medium text-gray-500">
							<button class="inline-flex items-center gap-1" @click="sortBy('formId')">
								מזהה טופס
								<Icon :name="sortIcon('formId')" class="h-4 w-4" />
							</button>
						</th>
						<th class="px-4 py-3 text-right font-medium text-gray-500">
							<button class="inline-flex items-center gap-1" @click="sortBy('externalId')">
								מזהה חיצוני
								<Icon :name="sortIcon('externalId')" class="h-4 w-4" />
							</button>
						</th>
						<th v-for="status in statuses" :key="status" class="px-4 py-3 text-center">
							<button class="inline-flex items-center gap-1" @click="sortBy(status)">
								<span :class="['inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusColors[status]]">
									{{ statusLabels[status] }}
								</span>
								<Icon :name="sortIcon(status)" class="h-4 w-4 text-gray-400" />
							</button>
						</th>
						<th class="px-4 py-3 text-center font-medium text-gray-500">
							<button class="inline-flex items-center gap-1" @click="sortBy('completionRate')">
								השלמה
								<Icon :name="sortIcon('completionRate')" class="h-4 w-4" />
							</button>
						</th>
						<th class="px-4 py-3 text-center font-medium text-gray-500">
							<button class="inline-flex items-center gap-1" @click="sortBy('avgFillTimeSeconds')">
								זמן מילוי ממוצע
								<Icon :name="sortIcon('avgFillTimeSeconds')" class="h-4 w-4" />
							</button>
						</th>
						<th class="px-4 py-3 text-center font-medium text-gray-500">
							<button class="inline-flex items-center gap-1" @click="sortBy('total')">
								סה"כ
								<Icon :name="sortIcon('total')" class="h-4 w-4" />
							</button>
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					<tr v-for="row in sortedRows" :key="`${row.formId}-${row.externalId ?? '__empty__'}`" class="hover:bg-gray-50">
						<td class="px-4 py-3 font-medium text-gray-900">{{ row.formName }}</td>
						<td class="px-4 py-3 text-gray-500">{{ row.formId }}</td>
						<td class="px-4 py-3 text-gray-500">{{ row.externalId ?? "-" }}</td>
						<td class="px-4 py-3 text-center text-gray-700">{{ row.pending }}</td>
						<td class="px-4 py-3 text-center text-gray-700">{{ row.in_progress }}</td>
						<td class="px-4 py-3 text-center text-gray-700">{{ row.submitted }}</td>
						<td class="px-4 py-3 text-center text-gray-700">{{ row.locked }}</td>
						<td class="px-4 py-3 text-center text-gray-700">{{ formatPercent(row.completionRate) }}</td>
						<td class="px-4 py-3 text-center text-gray-700">{{ formatDuration(row.avgFillTimeSeconds) }}</td>
						<td class="px-4 py-3 text-center font-semibold text-gray-900">{{ row.total }}</td>
					</tr>
				</tbody>
				<tfoot class="bg-gray-50">
					<tr class="font-semibold text-gray-900">
						<td class="px-4 py-3" colspan="3">סה"כ</td>
						<td class="px-4 py-3 text-center">{{ totals.pending }}</td>
						<td class="px-4 py-3 text-center">{{ totals.in_progress }}</td>
						<td class="px-4 py-3 text-center">{{ totals.submitted }}</td>
						<td class="px-4 py-3 text-center">{{ totals.locked }}</td>
						<td class="px-4 py-3 text-center">{{ formatPercent(totalCompletionRate) }}</td>
						<td class="px-4 py-3 text-center">-</td>
						<td class="px-4 py-3 text-center">{{ totals.total }}</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</main>
</template>
