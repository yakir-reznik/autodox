<template>
	<div>
		<div class="mb-6 flex flex-wrap items-end justify-between gap-4">
			<div>
				<h1 class="text-xl font-semibold">כל ההגשות</h1>
				<p class="text-xs text-gray-500">הצגת כל ההגשות במערכת לפי מסננים</p>
			</div>
			<UiButton variant="outline" size="sm" @click="refresh" :disabled="pending">
				<Icon v-if="pending" name="svg-spinners:ring-resize" class="h-4 w-4" />
				<Icon v-else name="heroicons:arrow-path" class="h-4 w-4" />
				{{ pending ? "טוען..." : "רענן" }}
			</UiButton>
		</div>

		<div class="mb-6 rounded-lg bg-white p-4 shadow">
			<div class="flex flex-nowrap items-end gap-4 overflow-x-auto pb-1">
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium text-gray-700">טווח מהיר</label>
					<UiSelect v-model="selectedPreset" @update:model-value="applyPreset(selectedPreset)">
						<UiSelectTrigger class="w-40 bg-white">
							<UiSelectValue placeholder="בחר טווח" />
						</UiSelectTrigger>
						<UiSelectContent>
							<UiSelectItem v-for="preset in reportDatePresets" :key="preset.value" :value="preset.value">
								{{ preset.label }}
							</UiSelectItem>
						</UiSelectContent>
					</UiSelect>
				</div>
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
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium text-gray-700">מזהה חיצוני</label>
					<UiInput v-model="externalId" placeholder="externalId" class="w-40 bg-white" />
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium text-gray-700">טופס</label>
					<UiSelect v-model="selectedFormId">
						<UiSelectTrigger class="w-56 bg-white">
							<UiSelectValue placeholder="כל הטפסים" />
						</UiSelectTrigger>
						<UiSelectContent class="max-w-80">
							<UiSelectItem :value="ALL_FORMS_VALUE">כל הטפסים</UiSelectItem>
							<UiSelectItem
								v-for="form in formsData"
								:key="form.id"
								:value="String(form.id)"
								:title="form.title"
								class="max-w-80"
							>
								<span class="block max-w-72 truncate">
									{{ truncateText(form.title, 120) }}
								</span>
							</UiSelectItem>
						</UiSelectContent>
					</UiSelect>
				</div>
				<div class="flex flex-col gap-1">
					<label class="text-sm font-medium text-gray-700">סטטוס</label>
					<UiSelect v-model="selectedStatus">
						<UiSelectTrigger class="w-36 bg-white">
							<UiSelectValue placeholder="כל הסטטוסים" />
						</UiSelectTrigger>
						<UiSelectContent>
							<UiSelectItem :value="ALL_STATUSES_VALUE">כל הסטטוסים</UiSelectItem>
							<UiSelectItem v-for="status in statuses" :key="status" :value="status">
								{{ statusLabels[status] }}
							</UiSelectItem>
						</UiSelectContent>
					</UiSelect>
				</div>
				<div class="flex shrink-0 items-center gap-2">
					<BaseButton variant="primary" :disabled="!canApply" @click="applyAllFilters">
						החל
					</BaseButton>
					<BaseButton variant="secondary" @click="clearAllFilters">
						נקה מסננים
					</BaseButton>
				</div>
			</div>
			<p v-if="rangeError" class="mt-2 text-sm text-red-600">{{ rangeError }}</p>
		</div>

		<SubmissionsTable
			v-model:page="currentPage"
			:submissions="submissions"
			:pagination="pagination"
			:pending="pending"
			:error="error"
			show-form-column
			show-external-id-column
			@refresh="refresh"
		/>
	</div>
</template>

<script setup lang="ts">
	import type { Submission } from "~/types/Submission";

	const ALL_FORMS_VALUE = "all";
	const ALL_STATUSES_VALUE = "all";
	const statuses = ["pending", "in_progress", "submitted", "locked"] as const;
	const statusLabels = {
		pending: "ממתין",
		in_progress: "בתהליך",
		submitted: "הוגש",
		locked: "נעול",
	};

	definePageMeta({
		layout: "management-panel",
		heading: "כל ההגשות",
		breadcrumbs: [{ label: "ניהול טפסים", to: "/manage" }, { label: "כל ההגשות" }],
		middleware: () => {
			const { user } = useUserSession();
			if (!user.value?.roles?.includes("admin")) return navigateTo("/manage/unauthorized");
		},
	});

	type FormOption = {
		id: number;
		title: string;
	};

	type PaginatedResponse = {
		data: (Submission & { formTitle?: string })[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		};
	};

	const route = useRoute();
	const router = useRouter();
	const currentPage = ref(Number(route.query.page) || 1);
	const externalId = ref(String(route.query.externalId ?? ""));
	const appliedExternalId = ref(externalId.value);
	const selectedFormId = ref(String(route.query.formId ?? ALL_FORMS_VALUE));
	const appliedFormId = ref(selectedFormId.value);
	const selectedStatus = ref(String(route.query.status ?? ALL_STATUSES_VALUE));
	const appliedStatus = ref(selectedStatus.value);

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

	if (typeof route.query.from === "string" && typeof route.query.to === "string") {
		fromDate.value = route.query.from;
		toDate.value = route.query.to;
		appliedFrom.value = route.query.from;
		appliedTo.value = route.query.to;
	}

	const { data: formsData } = await useFetch<FormOption[]>("/api/forms");

	const {
		data: response,
		pending,
		error,
		refresh,
	} = await useFetch<PaginatedResponse>(() => {
		const params = new URLSearchParams({
			all: "true",
			page: String(currentPage.value),
			from: appliedFrom.value,
			to: appliedTo.value,
		});

		if (appliedExternalId.value.trim()) params.set("externalId", appliedExternalId.value.trim());
		if (appliedFormId.value !== ALL_FORMS_VALUE) params.set("formId", appliedFormId.value);
		if (appliedStatus.value !== ALL_STATUSES_VALUE) params.set("status", appliedStatus.value);

		return `/api/submissions?${params.toString()}`;
	});

	const submissions = computed(() => response.value?.data ?? []);
	const pagination = computed(() => response.value?.pagination);

	watch(currentPage, (newPage) => {
		router.replace({
			query: { ...route.query, page: newPage > 1 ? String(newPage) : undefined },
		});
	});

	function applyAllFilters() {
		if (!applyFilters()) return;
		currentPage.value = 1;
		appliedExternalId.value = externalId.value;
		appliedFormId.value = selectedFormId.value;
		appliedStatus.value = selectedStatus.value;
		router.replace({
			query: {
				page: undefined,
				from: appliedFrom.value,
				to: appliedTo.value,
				externalId: appliedExternalId.value.trim() || undefined,
				formId: appliedFormId.value !== ALL_FORMS_VALUE ? appliedFormId.value : undefined,
				status: appliedStatus.value !== ALL_STATUSES_VALUE ? appliedStatus.value : undefined,
			},
		});
	}

	function clearAllFilters() {
		applyPreset("past_30_days");
		applyFilters();
		currentPage.value = 1;
		externalId.value = "";
		appliedExternalId.value = "";
		selectedFormId.value = ALL_FORMS_VALUE;
		appliedFormId.value = ALL_FORMS_VALUE;
		selectedStatus.value = ALL_STATUSES_VALUE;
		appliedStatus.value = ALL_STATUSES_VALUE;
		router.replace({ query: {} });
	}

	function truncateText(value: string, maxLength: number) {
		return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
	}

	useHead({ title: "כל ההגשות - Autodox" });
</script>
