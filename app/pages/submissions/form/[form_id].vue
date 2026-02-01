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
	}

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
	const toasts = useToasts();
	const { user, loggedIn } = useUserSession();
	const router = useRouter();
	const formId = Number(route.params.form_id);
	const currentPage = ref(Number(route.query.page) || 1);
	const isCreatingSubmission = ref(false);

	watch(currentPage, (newPage) => {
		router.replace({ query: { ...route.query, page: newPage > 1 ? String(newPage) : undefined } });
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
		() => `/api/submissions?formId=${formId}&page=${currentPage.value}`,
	);

	const submissions = computed(() => response.value?.data ?? []);
	const pagination = computed(() => response.value?.pagination);
	const isFormPublished = computed(() => formData.value?.status === "published");


	async function createNewSubmission() {
		if (!user.value?.apiKey) {
			toasts.add({
				title: "שגיאה: לא נמצא API Key",
				theme: "error",
				duration: 3000,
			});
			return;
		}

		isCreatingSubmission.value = true;

		try {
			const response = await $fetch<{
				success: boolean;
				link?: string;
				token?: string;
				formId?: number;
				expiresAt?: string;
				message?: string;
			}>(`/api/forms/${formId}/create-submission-link`, {
				method: "POST",
				headers: {
					"x-api-key": user.value.apiKey,
				},
			});

			if (response.success) {
				toasts.add({
					title: "הגשה חדשה נוצרה בהצלחה",
					theme: "success",
					duration: 3000,
				});
				await refresh();
			} else {
				toasts.add({
					title: `שגיאה: ${response.message || "לא ניתן ליצור הגשה"}`,
					theme: "error",
					duration: 3000,
				});
			}
		} catch (error: any) {
			toasts.add({
				title: `שגיאה: ${error.message || "לא ניתן ליצור הגשה"}`,
				theme: "error",
				duration: 3000,
			});
		} finally {
			isCreatingSubmission.value = false;
		}
	}

	useHead({
		title: "Submissions - Autodox",
	});
</script>

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
				<NuxtLink :to="`/edit/${formId}`">
					<BaseButton variant="secondary">
						<Icon name="heroicons:pencil" class="h-4 w-4" />
						עריכת טופס
					</BaseButton>
				</NuxtLink>
				<BaseButton
					variant="primary"
					@click="createNewSubmission"
					:disabled="isCreatingSubmission || !loggedIn || !isFormPublished"
					:title="!isFormPublished ? 'צור הגשה רק עבור טפסים פורסומים' : ''"
				>
					<Icon
						v-if="isCreatingSubmission"
						name="svg-spinners:ring-resize"
						class="h-4 w-4"
					/>
					<Icon v-else name="heroicons:plus" class="h-4 w-4" />
					{{ isCreatingSubmission ? "יוצר הגשה..." : "צור הגשה חדשה" }}
				</BaseButton>
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
	</div>
</template>
