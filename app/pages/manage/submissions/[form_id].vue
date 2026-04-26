<template>
	<div>
		<div class="mb-6 flex items-center justify-between">
			<div>
				<h1 class="text-xl font-semibold">{{ formData?.title }}</h1>
				<span
					v-if="formData?.folder"
					class="text-xs text-indigo-800 bg-indigo-100 rounded px-2 py-1 mt-1 inline-block"
				>
					{{ formData.folder.name }}
				</span>
			</div>
			<div class="flex items-center gap-2">
				<UiButton variant="outline" size="sm" @click="refresh" :disabled="pending">
					<Icon v-if="pending" name="svg-spinners:ring-resize" class="h-4 w-4" />
					<Icon v-else name="heroicons:arrow-path" class="h-4 w-4" />
					{{ pending ? "טוען..." : "רענן" }}
				</UiButton>
				<NuxtLink :to="`/edit/${formId}`">
					<UiButton variant="outline" size="sm">
						<Icon name="heroicons:pencil" class="h-4 w-4" />
						עריכת טופס
					</UiButton>
				</NuxtLink>
				<UiButton variant="outline" size="sm" @click="showArchived = !showArchived">
					<Icon
						:name="showArchived ? 'heroicons:inbox' : 'heroicons:archive-box'"
						class="h-4 w-4"
					/>
					{{ showArchived ? "הצג פעיל" : "הצג ארכיון" }}
				</UiButton>
				<UiButton
					variant="default"
					size="sm"
					@click="showCreateModal = true"
					:disabled="!loggedIn || !isFormPublished"
					:title="!isFormPublished ? 'צור הגשה רק עבור טפסים פורסמו' : ''"
				>
					<Icon name="heroicons:plus" class="h-4 w-4" />
					צור הגשה חדשה
				</UiButton>
			</div>
		</div>

		<SubmissionsTable
			v-model:page="currentPage"
			:submissions="submissions"
			:pagination="pagination"
			:pending="pending"
			:error="error"
			@refresh="refresh"
		/>

		<SubmissionsCreateSubmissionModal
			v-model="showCreateModal"
			:form-id="formId"
			:api-key="user?.apiKey ?? ''"
			@created="refresh"
		/>
	</div>
</template>

<script setup lang="ts">
	import type { Submission } from "~/types/Submission";

	definePageMeta({
		layout: "management-panel",
		heading: "הגשות",
		breadcrumbs: [
			{ label: "רשימת טפסים", to: "/forms" },
			{ label: "הגשות" },
		],
	});

	type Folder = {
		id: number;
		name: string;
		createdBy: number;
		createdAt: string;
		updatedAt: string;
	};

	type Form = {
		id: number;
		title: string;
		description: string | null;
		folderId: number | null;
		folder: Folder | null;
		status: "draft" | "published" | "archived";
		createdAt: string;
		updatedAt: string;
		createdByUserId: number;
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
	const { user, loggedIn } = useUserSession();

	const formId = Number(route.params.form_id);
	const currentPage = ref(Number(route.query.page) || 1);
	const showCreateModal = ref(false);
	const showArchived = ref(false);

	watch(currentPage, (newPage) => {
		router.replace({
			query: { ...route.query, page: newPage > 1 ? String(newPage) : undefined },
		});
	});

	watch(showArchived, () => {
		currentPage.value = 1;
	});

	const { data: formData } = await useFetch<Form>(`/api/forms/${formId}`);

	const {
		data: response,
		pending,
		error,
		refresh,
	} = await useFetch<PaginatedResponse>(
		() => `/api/submissions?formId=${formId}&page=${currentPage.value}&archived=${showArchived.value}`,
	);

	const submissions = computed(() => response.value?.data ?? []);
	const pagination = computed(() => response.value?.pagination);
	const isFormPublished = computed(() => formData.value?.status === "published");

	useHead({ title: "הגשות - Autodox" });
</script>
