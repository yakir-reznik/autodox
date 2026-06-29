<script setup lang="ts">
	import type {
		SubmissionStatusSummary,
		SubmissionsSummaryByExternalIdResponse,
	} from "~/types/form-builder";

	useHead({ title: "סיכום הגשות לפי מזהה חיצוני - Autodox" });

	definePageMeta({
		layout: "management-panel",
		heading: "סיכום הגשות לפי מזהה חיצוני",
		breadcrumbs: [
			{
				label: "ניהול טפסים",
				to: "/manage",
			},
			{
				label: "דוח״ות",
				to: "/manage/reports",
			},
			{
				label: "סיכום הגשות לפי מזהה חיצוני",
			},
		],
	});

	type Status = Exclude<keyof SubmissionStatusSummary, "total">;

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

	function defaultFrom() {
		const d = new Date();
		d.setDate(d.getDate() - 30);
		return d.toISOString().slice(0, 10);
	}

	function defaultTo() {
		return new Date().toISOString().slice(0, 10);
	}

	const fromDate = ref(defaultFrom());
	const toDate = ref(defaultTo());
	const appliedFrom = ref(defaultFrom());
	const appliedTo = ref(defaultTo());

	const rangeError = computed(() => {
		if (!fromDate.value || !toDate.value) return null;
		const diff =
			(new Date(toDate.value).getTime() - new Date(fromDate.value).getTime()) / 86400000;
		if (diff < 0) return "תאריך סיום חייב להיות אחרי תאריך התחלה";
		if (diff > 365) return "טווח התאריכים לא יכול לעלות על 365 ימים";
		return null;
	});

	const canApply = computed(() => !rangeError.value && fromDate.value && toDate.value);

	const { data: report, pending } = await useFetch<SubmissionsSummaryByExternalIdResponse>(
		"/api/admin/reports/submissions-summary-by-external-id",
		{
			query: computed(() => ({
				from: appliedFrom.value,
				to: appliedTo.value,
			})),
		},
	);

	const statusTotals = computed(() =>
		(report.value?.forms ?? []).reduce(
			(acc, row) => {
				for (const status of statuses) {
					acc[status] += row[status];
				}
				acc.total += row.total;
				return acc;
			},
			{
				pending: 0,
				in_progress: 0,
				submitted: 0,
				locked: 0,
				total: 0,
			},
		),
	);

	function externalIdLabel(externalId: string | null) {
		return externalId || "ללא מזהה חיצוני";
	}

	function applyFilters() {
		if (!canApply.value) return;
		appliedFrom.value = fromDate.value;
		appliedTo.value = toDate.value;
	}
</script>

<template>
	<main class="">
		<div class="bg-white rounded-lg shadow p-4 mb-6">
			<div class="flex flex-wrap items-end gap-4">
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium text-gray-700">מתאריך</label>
					<input
						v-model="fromDate"
						type="date"
						class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium text-gray-700">עד תאריך</label>
					<input
						v-model="toDate"
						type="date"
						class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					/>
				</div>

				<BaseButton variant="primary" :disabled="!canApply" @click="applyFilters">
					החל
				</BaseButton>
			</div>

			<p v-if="rangeError" class="mt-2 text-sm text-red-600">{{ rangeError }}</p>
		</div>

		<div v-if="pending" class="flex items-center justify-center py-12">
			<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
		</div>

		<div
			v-else-if="!report || report.total === 0"
			class="bg-white rounded-lg shadow p-12 text-center text-gray-500"
		>
			<Icon name="heroicons:table-cells" class="mx-auto h-12 w-12 text-gray-300 mb-3" />
			<p>לא נמצאו תוצאות עבור טווח התאריכים שנבחר</p>
		</div>

		<div v-else class="space-y-8">
			<section class="bg-white rounded-lg shadow overflow-x-auto max-w-3xl">
				<div class="border-b border-gray-100 px-4 py-3">
					<h2 class="text-base font-semibold text-gray-900">סה״כ הגשות לפי מזהה חיצוני</h2>
				</div>
				<table class="min-w-full divide-y divide-gray-200 text-sm">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-right font-medium text-gray-500">
								מזהה חיצוני
							</th>
							<th class="px-4 py-3 text-center font-medium text-gray-500">
								סה״כ הגשות
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						<tr
							v-for="row in report.externalIds"
							:key="row.externalId ?? '__empty__'"
							class="hover:bg-gray-50"
						>
							<td class="px-4 py-3 font-medium text-gray-900">
								{{ externalIdLabel(row.externalId) }}
							</td>
							<td class="px-4 py-3 text-center font-semibold text-gray-900">
								{{ row.total }}
							</td>
						</tr>
					</tbody>
					<tfoot class="bg-gray-50">
						<tr class="font-semibold text-gray-900">
							<td class="px-4 py-3">סה״כ</td>
							<td class="px-4 py-3 text-center">{{ report.total }}</td>
						</tr>
					</tfoot>
				</table>
			</section>

			<section class="bg-white rounded-lg shadow overflow-x-auto max-w-6xl">
				<div class="border-b border-gray-100 px-4 py-3">
					<h2 class="text-base font-semibold text-gray-900">
						הגשות לפי דומיין וסטטוס
					</h2>
				</div>
				<table class="min-w-full divide-y divide-gray-200 text-sm">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-right font-medium text-gray-500">דומיין</th>
							<th class="px-4 py-3 text-right font-medium text-gray-500">
								מזהה טופס
							</th>
							<th
								v-for="status in statuses"
								:key="status"
								class="px-4 py-3 text-center"
							>
								<span
									:class="[
										'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
										statusColors[status],
									]"
								>
									{{ statusLabels[status] }}
								</span>
							</th>
							<th class="px-4 py-3 text-center font-medium text-gray-500">סה״כ</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						<tr v-for="row in report.forms" :key="row.formId" class="hover:bg-gray-50">
							<td class="px-4 py-3 font-medium text-gray-900">{{ row.formName }}</td>
							<td class="px-4 py-3 text-gray-500">{{ row.formId }}</td>
							<td class="px-4 py-3 text-center text-gray-700">{{ row.pending }}</td>
							<td class="px-4 py-3 text-center text-gray-700">{{ row.in_progress }}</td>
							<td class="px-4 py-3 text-center text-gray-700">{{ row.submitted }}</td>
							<td class="px-4 py-3 text-center text-gray-700">{{ row.locked }}</td>
							<td class="px-4 py-3 text-center font-semibold text-gray-900">
								{{ row.total }}
							</td>
						</tr>
					</tbody>
					<tfoot class="bg-gray-50">
						<tr class="font-semibold text-gray-900">
							<td class="px-4 py-3" colspan="2">סה״כ</td>
							<td
								v-for="status in statuses"
								:key="status"
								class="px-4 py-3 text-center"
							>
								{{ statusTotals[status] }}
							</td>
							<td class="px-4 py-3 text-center">{{ statusTotals.total }}</td>
						</tr>
					</tfoot>
				</table>
			</section>
		</div>
	</main>
</template>
