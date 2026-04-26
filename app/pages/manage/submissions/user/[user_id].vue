<template>
	<div>
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">הגשות משתמש</h1>
				<p class="text-xs text-gray-500">User ID: {{ userId }}</p>
			</div>
			<div class="flex items-center gap-3">
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
				<UiButton variant="outline" size="sm" @click="refresh" :disabled="pending">
					<Icon v-if="pending" name="svg-spinners:ring-resize" class="h-4 w-4" />
					<Icon v-else name="heroicons:arrow-path" class="h-4 w-4" />
					{{ pending ? "טוען..." : "רענן" }}
				</UiButton>
			</div>
		</div>

		<SubmissionsTable
			v-model:page="currentPage"
			:submissions="submissions"
			:pagination="pagination"
			:pending="pending"
			:error="error"
			show-form-column
			:show-submitted-at-column="false"
			@refresh="refresh"
		/>
	</div>
</template>

<script setup lang="ts">
	import type { Submission } from "~/types/Submission";

	definePageMeta({
		layout: "management-panel",
		heading: "הגשות",
		breadcrumbs: [{ label: "משתמשים", to: "/manage/user" }, { label: "הגשות" }],
	});

	type FormOption = {
		id: number;
		title: string;
	};

	type PaginatedResponse = {
		data: Submission[];
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
	const userId = Number(route.params.user_id);
	const currentPage = ref(Number(route.query.page) || 1);
	const selectedFormId = ref<number | null>(null);

	watch(currentPage, (newPage) => {
		router.replace({
			query: { ...route.query, page: newPage > 1 ? String(newPage) : undefined },
		});
	});

	const { data: formsData } = await useFetch<FormOption[]>("/api/forms");

	const {
		data: response,
		pending,
		error,
		refresh,
	} = await useFetch<PaginatedResponse>(() => {
		let url = `/api/submissions?userId=${userId}&page=${currentPage.value}`;
		if (selectedFormId.value) url += `&formId=${selectedFormId.value}`;
		return url;
	});

	const submissions = computed(() => response.value?.data ?? []);
	const pagination = computed(() => response.value?.pagination);

	function onFormFilterChange() {
		currentPage.value = 1;
		refresh();
	}

	useHead({ title: "הגשות - Autodox" });
</script>
