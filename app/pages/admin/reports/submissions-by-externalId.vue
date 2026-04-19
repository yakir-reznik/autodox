<script setup lang="ts">
import type { SubmissionsByExternalIdRow } from "~/types/form-builder";

useHead({ title: "הגשות לפי מזהה חיצוני - Autodox" });

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

const selectedExternalId = ref<string>("");
const fromDate = ref(defaultFrom());
const toDate = ref(defaultTo());
const appliedExternalId = ref<string>("");
const appliedFrom = ref(defaultFrom());
const appliedTo = ref(defaultTo());

const rangeError = computed(() => {
	if (!fromDate.value || !toDate.value) return null;
	const diff = (new Date(toDate.value).getTime() - new Date(fromDate.value).getTime()) / 86400000;
	if (diff < 0) return "תאריך סיום חייב להיות אחרי תאריך התחלה";
	if (diff > 365) return "טווח התאריכים לא יכול לעלות על 365 ימים";
	return null;
});

const canApply = computed(() => !rangeError.value && fromDate.value && toDate.value);

const { data: externalIds } = await useFetch<{ externalId: string }[]>(
	"/api/admin/reports/external-ids",
);

const { data: rows, pending } = await useFetch<SubmissionsByExternalIdRow[]>(
	"/api/admin/reports/submissions-by-external-id",
	{
		query: computed(() => ({
			externalId: appliedExternalId.value || undefined,
			from: appliedFrom.value,
			to: appliedTo.value,
		})),
	},
);

function applyFilters() {
	if (!canApply.value) return;
	appliedExternalId.value = selectedExternalId.value;
	appliedFrom.value = fromDate.value;
	appliedTo.value = toDate.value;
}
</script>

<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<header class="bg-white shadow relative z-10">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center gap-4">
					<NuxtLink to="/admin/reports">
						<BaseButton variant="secondary" size="sm">
							<Icon name="heroicons:arrow-left" class="h-5 w-5" />
						</BaseButton>
					</NuxtLink>
					<h1 class="text-2xl font-bold text-gray-900">הגשות לפי מזהה חיצוני</h1>
				</div>
			</div>
		</header>

		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<!-- Filters -->
			<div class="bg-white rounded-lg shadow p-4 mb-6">
				<div class="flex flex-wrap items-end gap-4">
					<!-- ExternalId filter -->
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium text-gray-700">מזהה חיצוני</label>
						<UiSelect v-model="selectedExternalId">
							<UiSelectTrigger class="w-48">
								<UiSelectValue placeholder="כל המזהים" />
							</UiSelectTrigger>
							<UiSelectContent>
								<UiSelectItem value="">כל המזהים</UiSelectItem>
								<UiSelectItem
									v-for="item in externalIds"
									:key="item.externalId"
									:value="item.externalId"
								>
									{{ item.externalId }}
								</UiSelectItem>
							</UiSelectContent>
						</UiSelect>
					</div>

					<!-- From date -->
					<div class="flex flex-col gap-1">
						<label class="text-sm font-medium text-gray-700">מתאריך</label>
						<input
							v-model="fromDate"
							type="date"
							class="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
					</div>

					<!-- To date -->
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

			<!-- Loading -->
			<div v-if="pending" class="flex items-center justify-center py-12">
				<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
			</div>

			<!-- Empty state -->
			<div
				v-else-if="!rows || rows.length === 0"
				class="bg-white rounded-lg shadow p-12 text-center text-gray-500"
			>
				<Icon name="heroicons:table-cells" class="mx-auto h-12 w-12 text-gray-300 mb-3" />
				<p>לא נמצאו תוצאות עבור הפילטרים שנבחרו</p>
			</div>

			<!-- Table -->
			<div v-else class="bg-white rounded-lg shadow overflow-x-auto">
				<table class="min-w-full divide-y divide-gray-200 text-sm">
					<thead class="bg-gray-50">
						<tr>
							<th class="px-4 py-3 text-right font-medium text-gray-500">שם טופס</th>
							<th class="px-4 py-3 text-right font-medium text-gray-500">מזהה טופס</th>
							<th class="px-4 py-3 text-right font-medium text-gray-500">מזהה חיצוני</th>
							<th
								v-for="status in ['pending', 'in_progress', 'submitted', 'locked'] as const"
								:key="status"
								class="px-4 py-3 text-center"
							>
								<span
									:class="['inline-flex rounded-full px-2 py-0.5 text-xs font-medium', statusColors[status]]"
								>
									{{ statusLabels[status] }}
								</span>
							</th>
							<th class="px-4 py-3 text-center font-medium text-gray-500">סה"כ</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-100">
						<tr v-for="(row, i) in rows" :key="i" class="hover:bg-gray-50">
							<td class="px-4 py-3 font-medium text-gray-900">{{ row.formName }}</td>
							<td class="px-4 py-3 text-gray-500">{{ row.formId }}</td>
							<td class="px-4 py-3 text-gray-500">{{ row.externalId ?? "—" }}</td>
							<td class="px-4 py-3 text-center text-gray-700">{{ row.pending }}</td>
							<td class="px-4 py-3 text-center text-gray-700">{{ row.in_progress }}</td>
							<td class="px-4 py-3 text-center text-gray-700">{{ row.submitted }}</td>
							<td class="px-4 py-3 text-center text-gray-700">{{ row.locked }}</td>
							<td class="px-4 py-3 text-center font-semibold text-gray-900">{{ row.total }}</td>
						</tr>
					</tbody>
				</table>
			</div>
		</main>
	</div>
</template>
