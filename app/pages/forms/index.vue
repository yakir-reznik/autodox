<script setup lang="ts">
	import type { Folder } from "~/types/form-builder";
	import type { FormListItem } from "~/types/FormListItem";

	const { user, clear } = useUserSession();
	const router = useRouter();

	// State management
	const selectedFolderId = ref<number | null | "all" | "unfiled">("all");
	const showMoveFormModal = ref(false);
	const movingForm = ref<FormListItem | null>(null);
	const showDeleteFormModal = ref(false);
	const deletingForm = ref<FormListItem | null>(null);
	const showCreateSubmissionModal = ref(false);
	const createSubmissionForm = ref<FormListItem | null>(null);
	const showChangeStatusModal = ref(false);
	const changeStatusForm = ref<FormListItem | null>(null);
	const searchQuery = ref("");

	// Fetch folders
	const { data: folders, refresh: refreshFolders } = await useFetch<Folder[]>("/api/folders");

	// Fetch forms based on selected folder
	const formsQuery = computed(() => {
		const id = selectedFolderId.value;
		if (id === "unfiled") return "/api/forms?folderId=null";
		if (typeof id === "number") return `/api/forms?folderId=${id}`;
		return "/api/forms";
	});

	const { data: forms, pending, error, refresh } = await useFetch<FormListItem[]>(formsQuery);

	// Filter forms based on search query
	const filteredForms = computed(() => {
		if (!forms.value) return [];
		if (!searchQuery.value.trim()) return forms.value;

		const query = searchQuery.value.toLowerCase().trim();
		return forms.value.filter((form) => {
			const title = form.title.toLowerCase();
			// Simple fuzzy matching: check if all characters in query appear in title in order
			let titleIndex = 0;
			for (const char of query) {
				titleIndex = title.indexOf(char, titleIndex);
				if (titleIndex === -1) return false;
				titleIndex++;
			}
			return true;
		});
	});

	async function handleLogout() {
		await $fetch("/api/auth/logout", { method: "POST" });
		await clear();
		router.push("/login");
	}

	// Folder selection handler
	function selectFolder(id: number | "all" | "unfiled") {
		selectedFolderId.value = id;
	}

	// Handle folders changed event from sidebar
	async function handleFoldersChanged() {
		await refreshFolders();
		await refresh();
	}

	// Form duplicate handler
	async function handleDuplicateForm(form: FormListItem) {
		try {
			await $fetch(`/api/forms/${form.id}/duplicate`, {
				method: "POST",
				body: { createdBy: user.value?.id },
			});
			await refresh();
		} catch (error) {
			console.error("Failed to duplicate form:", error);
		}
	}

	// Form delete handlers
	function handleDeleteForm(form: FormListItem) {
		deletingForm.value = form;
		showDeleteFormModal.value = true;
	}

	async function deleteForm() {
		if (!deletingForm.value) return;

		try {
			await $fetch(`/api/forms/${deletingForm.value.id}`, {
				method: "DELETE",
			});
			await refresh();
		} catch (error) {
			console.error("Failed to delete form:", error);
		}
	}

	// Create submission handler
	function handleCreateSubmission(form: FormListItem) {
		createSubmissionForm.value = form;
		nextTick(() => {
			showCreateSubmissionModal.value = true;
		});
	}

	// Change status handlers
	function handleChangeStatus(form: FormListItem) {
		changeStatusForm.value = form;
		showChangeStatusModal.value = true;
	}

	async function changeStatus(status: FormListItem["status"]) {
		if (!changeStatusForm.value) return;

		try {
			await $fetch(`/api/forms/${changeStatusForm.value.id}`, {
				method: "PATCH",
				body: { status },
			});
			forms.value = forms.value?.map((f) =>
				f.id === changeStatusForm.value!.id ? { ...f, status } : f,
			) ?? null;
		} catch (error) {
			console.error("Failed to change form status:", error);
		}
	}

	// Form move handlers
	function handleMoveForm(form: FormListItem) {
		movingForm.value = form;
		showMoveFormModal.value = true;
	}

	async function moveForm(folderId: number | null) {
		if (!movingForm.value) return;

		try {
			await $fetch(`/api/forms/${movingForm.value.id}`, {
				method: "PATCH",
				body: {
					folderId,
					updatedBy: user.value?.id,
				},
			});
			await refresh();
		} catch (error) {
			console.error("Failed to move form:", error);
		}
	}

	useHead({
		title: "Forms - Autodox",
	});
</script>

<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<!-- Header -->
		<header class="bg-white shadow relative z-10">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<NuxtLink to="/">
							<BaseButton variant="secondary" size="sm">
								<Icon name="heroicons:arrow-left" class="h-5 w-5" />
							</BaseButton>
						</NuxtLink>
						<h1 class="text-2xl font-bold text-gray-900">Forms</h1>
					</div>
					<div class="flex items-center gap-3">
						<div class="text-sm text-gray-600">
							{{ user?.name }}
						</div>
						<NuxtLink to="/forms/upload">
							<BaseButton variant="secondary">
								<Icon name="heroicons:arrow-up-tray" class="h-5 w-5" />
								Upload JSON
							</BaseButton>
						</NuxtLink>
						<NuxtLink to="/forms/new">
							<BaseButton variant="primary">
								<Icon name="heroicons:plus" class="h-5 w-5" />
								New Form
							</BaseButton>
						</NuxtLink>
						<BaseButton variant="secondary" @click="handleLogout">
							<Icon name="heroicons:arrow-right-on-rectangle" class="h-5 w-5" />
							Logout
						</BaseButton>
					</div>
				</div>
			</div>
		</header>

		<!-- Content with Sidebar Layout -->
		<div class="flex h-[calc(100vh-5rem)]">
			<!-- Folder Sidebar -->
			<FoldersSidebar
				:folders="folders || []"
				:selected-folder-id="selectedFolderId"
				:forms="forms || []"
				:user-id="user?.id"
				@select-all="selectFolder('all')"
				@select-unfiled="selectFolder('unfiled')"
				@select-folder="selectFolder"
				@folders-changed="handleFoldersChanged"
			/>

			<!-- Main Content Area -->
			<main class="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-6xl">
					<!-- Search Bar -->
					<div class="mb-6 flex items-center justify-between gap-4">
						<div class="relative w-full max-w-xs">
							<Icon
								name="heroicons:magnifying-glass"
								class="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
							/>
							<input
								v-model="searchQuery"
								type="text"
								placeholder="חיפוש טפסים..."
								class="w-full rounded-md border border-gray-300 py-2 pl-4 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								:class="{ 'pl-10': searchQuery }"
							/>
							<button
								v-if="searchQuery"
								@click="searchQuery = ''"
								class="absolute left-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
								type="button"
							>
								<Icon name="heroicons:x-mark" class="h-4 w-4" />
							</button>
						</div>
						<div v-if="searchQuery && !pending" class="text-sm text-gray-600">
							{{ filteredForms.length }} תוצאות
						</div>
					</div>

					<!-- Loading state -->
					<div v-if="pending" class="flex items-center justify-center py-12">
						<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
					</div>

					<!-- Error state -->
					<div v-else-if="error" class="rounded-lg bg-red-50 p-6 text-center">
						<Icon
							name="heroicons:exclamation-circle"
							class="mx-auto h-12 w-12 text-red-500"
						/>
						<p class="mt-2 text-red-700">Failed to load forms</p>
						<BaseButton variant="secondary" class="mt-4" @click="refresh">
							Try Again
						</BaseButton>
					</div>

					<!-- Empty state -->
					<FormListEmptyState v-else-if="!filteredForms || filteredForms.length === 0" />

					<!-- Forms grid -->
					<div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						<FormListCard
							v-for="form in filteredForms"
							:key="form.id"
							:form="form"
							@move-form="handleMoveForm"
							@duplicate-form="handleDuplicateForm"
							@delete-form="handleDeleteForm"
							@create-submission="handleCreateSubmission"
							@change-status="handleChangeStatus"
						/>
					</div>
				</div>
			</main>
		</div>

		<!-- Modals -->
		<FoldersMoveFormModal
			v-if="movingForm"
			v-model="showMoveFormModal"
			:folders="folders || []"
			:current-folder-id="movingForm.folderId"
			:form-title="movingForm.title"
			@move="moveForm"
		/>

		<FormListDeleteFormModal
			v-model="showDeleteFormModal"
			:form="deletingForm"
			@confirm="deleteForm"
		/>

		<FormListChangeStatusModal
			v-model="showChangeStatusModal"
			:form="changeStatusForm"
			@confirm="changeStatus"
		/>

		<SubmissionsCreateSubmissionModal
			v-if="createSubmissionForm"
			v-model="showCreateSubmissionModal"
			:form-id="createSubmissionForm.id"
			:api-key="user?.apiKey ?? ''"
		/>
	</div>
</template>
