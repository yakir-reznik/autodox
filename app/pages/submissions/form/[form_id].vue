<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<SubmissionsHeader>
			<h1 class="text-2xl font-bold text-gray-900">Submissions</h1>
			<div class="flex items-center gap-2 mt-1">
				<p class="text-sm font-medium text-gray-900">
					{{ formData?.title }}
				</p>
				<span
					v-if="formData?.folder"
					class="text-xs text-indigo-800 bg-indigo-100 rounded px-2 py-1"
				>
					{{ formData.folder.name }}
				</span>
			</div>
			<p class="text-xs text-gray-500">Form ID: {{ formId }}</p>
		</SubmissionsHeader>

		<!-- Content -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<!-- Action Buttons -->
			<div class="mb-6 flex justify-end gap-3">
				<UiButton
					variant="secondary"
					@click="refresh"
					:disabled="pending"
					:title="'Refresh submissions data'"
				>
					<Icon v-if="pending" name="svg-spinners:ring-resize" class="h-4 w-4" />
					<Icon v-else name="heroicons:arrow-path" class="h-4 w-4" />
					{{ pending ? "טוען..." : "רענן" }}
				</UiButton>
				<NuxtLink :to="`/manage/form/${formId}/edit`">
					<UiButton variant="secondary">
						<Icon name="heroicons:pencil" class="h-4 w-4" />
						עריכת טופס
					</UiButton>
				</NuxtLink>
				<NuxtLink :to="`/forms/${formId}/submission-data-structure`">
					<UiButton variant="secondary">
						<Icon name="heroicons:code-bracket" class="h-4 w-4" />
						מבנה נתונים
					</UiButton>
				</NuxtLink>
				<UiButton
					variant="secondary"
					class="bg-foreground/10"
					@click="showArchived = !showArchived"
				>
					<Icon
						:name="showArchived ? 'heroicons:inbox' : 'heroicons:archive-box'"
						class="h-4 w-4"
					/>
					{{ showArchived ? "הצג פעיל" : "הצג ארכיון" }}
				</UiButton>
				<UiButton
					variant="default"
					@click="showCreateModal = true"
					:disabled="!loggedIn || !isFormPublished"
					:title="!isFormPublished ? 'צור הגשה רק עבור טפסים פורסומים' : ''"
				>
					<Icon name="heroicons:plus" class="h-4 w-4" />
					צור הגשה חדשה
				</UiButton>
			</div>

			<SubmissionsTable
				v-model:page="currentPage"
				:submissions="submissions"
				:pagination="pagination"
				:pending="pending"
				:error="error"
				@refresh="refresh"
			/>
		</main>

		<SubmissionsCreateSubmissionModal
			v-model="showCreateModal"
			:form-id="formId"
			:api-key="user?.apiKey ?? ''"
			@created="refresh"
		/>
	</div>
</template>

<script setup lang="ts">
	import { type Submission } from "~/types/Submission";

	interface Folder {
		id: number;
		name: string;
		createdBy: number;
		createdAt: string;
		updatedAt: string;
	}

	interface Form {
		id: number;
		title: string;
		description: string | null;
		folderId: number | null;
		folder: Folder | null;
		status: "draft" | "published" | "archived";
		createdAt: string;
		updatedAt: string;
		createdByUserId: number;
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

	const route = useRoute();
	const { user, loggedIn } = useUserSession();
	const router = useRouter();
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

	const {
		data: formData,
		pending: formPending,
		error: formError,
	} = await useFetch<Form>(`/api/forms/${formId}`);

	const {
		data: response,
		pending,
		error,
		refresh,
	} = await useFetch<PaginatedResponse>(
		() =>
			`/api/submissions?formId=${formId}&page=${currentPage.value}&archived=${showArchived.value}`,
	);

	const submissions = computed(() => response.value?.data ?? []);
	const pagination = computed(() => response.value?.pagination);
	const isFormPublished = computed(() => formData.value?.status === "published");

	useHead({
		title: "Submissions - Autodox",
	});
</script>
