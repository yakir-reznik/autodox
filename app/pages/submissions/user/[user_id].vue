<script setup lang="ts">
	interface Submission {
		id: number;
		token: string;
		formId: number;
		prefillData: Record<string, unknown> | null;
		additionalData: Record<string, unknown> | null;
		createdByUserId: number | null;
		expiresAt: string;
		status: "pending" | "in_progress" | "submitted" | "locked";
		isPublic: boolean;
		submissionData: Record<string, unknown> | null;
		createdAt: string;
		startedAt: string | null;
		submittedAt: string | null;
		lockedAt: string | null;
		formTitle?: string;
	}

	interface PaginatedResponse {
		data: Submission[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		};
	}

	interface FormOption {
		id: number;
		title: string;
	}

	const route = useRoute();
	const router = useRouter();
	const userId = Number(route.params.user_id);
	const currentPage = ref(Number(route.query.page) || 1);
	const selectedFormId = ref<number | null>(null);

	watch(currentPage, (newPage) => {
		router.replace({ query: { ...route.query, page: newPage > 1 ? String(newPage) : undefined } });
	});

	const fetchUrl = computed(() => {
		let url = `/api/submissions?userId=${userId}&page=${currentPage.value}`;
		if (selectedFormId.value) {
			url += `&formId=${selectedFormId.value}`;
		}
		return url;
	});

	const {
		data: response,
		pending,
		error,
		refresh,
	} = await useFetch<PaginatedResponse>(fetchUrl);

	const { data: formsData } = await useFetch<FormOption[]>("/api/forms");

	const submissions = computed(() => response.value?.data ?? []);
	const pagination = computed(() => response.value?.pagination);


	function onFormFilterChange() {
		currentPage.value = 1;
		refresh();
	}

	useHead({
		title: "הגשות - Autodox",
	});
</script>

<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<SubmissionsHeader>
			<h1 class="text-2xl font-bold text-gray-900">הגשות</h1>
			<p class="text-xs text-gray-500">User ID: {{ userId }}</p>
		</SubmissionsHeader>

		<!-- Content -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<!-- Filter and Refresh -->
			<div class="mb-6 flex items-center justify-between">
				<div class="flex items-center gap-3">
					<label for="form-filter" class="text-sm font-medium text-gray-700">
						סינון לפי טופס:
					</label>
					<select
						id="form-filter"
						v-model="selectedFormId"
						@change="onFormFilterChange"
						class="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
					>
						<option :value="null">כל הטפסים</option>
						<option v-for="form in formsData" :key="form.id" :value="form.id">
							{{ form.title }}
						</option>
					</select>
				</div>
				<BaseButton
					variant="secondary"
					@click="refresh"
					:disabled="pending"
					:title="'Refresh submissions data'"
				>
					<Icon v-if="pending" name="svg-spinners:ring-resize" class="h-4 w-4" />
					<Icon v-else name="heroicons:arrow-path" class="h-4 w-4" />
					{{ pending ? "טוען..." : "רענן" }}
				</BaseButton>
			</div>

			<SubmissionsTable
				v-model:page="currentPage"
				:submissions="submissions"
				:pagination="pagination"
				:pending="pending"
				:error="error"
				show-form-column
				@refresh="refresh"
			>
				<template #empty-message>לא נמצאו הגשות.</template>
			</SubmissionsTable>
		</main>
	</div>
</template>
