<template>
	<div>
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">הגשות משתמש</h1>
				<p class="text-xs text-gray-500">User ID: {{ userId }}</p>
			</div>
			<div class="flex items-center gap-3">
				<UiSelect v-model="selectedFormId">
					<UiSelectTrigger class="w-48 bg-white">
						<UiSelectValue placeholder="כל הטפסים" />
					</UiSelectTrigger>
					<UiSelectContent>
						<UiSelectItem :value="ALL_FORMS_VALUE">כל הטפסים</UiSelectItem>
						<UiSelectItem
							v-for="form in formsData"
							:key="form.id"
							:value="String(form.id)"
						>
							{{ form.title }}
						</UiSelectItem>
					</UiSelectContent>
				</UiSelect>
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

	const ALL_FORMS_VALUE = "all";

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
	const selectedFormId = ref(ALL_FORMS_VALUE);

	watch(currentPage, (newPage) => {
		router.replace({
			query: { ...route.query, page: newPage > 1 ? String(newPage) : undefined },
		});
	});

	watch(selectedFormId, () => {
		currentPage.value = 1;
		refresh();
	});

	const { data: formsData } = await useFetch<FormOption[]>("/api/forms");

	const {
		data: response,
		pending,
		error,
		refresh,
	} = await useFetch<PaginatedResponse>(() => {
		let url = `/api/submissions?userId=${userId}&page=${currentPage.value}`;
		if (selectedFormId.value !== ALL_FORMS_VALUE) {
			url += `&formId=${Number(selectedFormId.value)}`;
		}
		return url;
	});

	const submissions = computed(() => response.value?.data ?? []);
	const pagination = computed(() => response.value?.pagination);

	useHead({ title: "הגשות - Autodox" });
</script>
