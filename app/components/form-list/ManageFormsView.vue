<template>
	<div class="flex">
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

		<main class="flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
			<div class="mx-auto max-w-6xl">
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

				<div v-if="pending" class="flex items-center justify-center py-12">
					<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
				</div>

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

				<FormListEmptyState
					v-else-if="!filteredForms || filteredForms.length === 0"
					:shared-with-me-only="props.sharedWithMeOnly"
				/>

				<div v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<FormListCard
						v-for="form in filteredForms"
						:key="form.id"
						:form="form"
						@move-form="handleMoveForm"
						@duplicate-form="handleDuplicateForm"
						@delete-form="handleDeleteForm"
						@create-submission="handleCreateSubmission"
						@change-status="handleChangeStatus"
						@open-settings="handleOpenSettings"
					/>
				</div>
			</div>
		</main>
	</div>

	<FoldersMoveFormModal
		v-if="movingForm"
		v-model="showMoveFormModal"
		:folders="folders || []"
		:current-folder-id="movingForm.folderId"
		:form-title="movingForm.title"
		@move="moveForm"
	/>

	<FormListDeleteFormModal
		v-if="deletingForm"
		v-model="showDeleteFormModal"
		:form="deletingForm"
		@confirm="deleteForm"
	/>

	<FormListChangeStatusModal
		v-if="changeStatusForm"
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

	<FormBuilderFormSettingsModal
		v-if="settingsForm"
		v-model="showSettingsModal"
		:form-id="settingsForm.id"
	/>
</template>

<script setup lang="ts">
	import type { Folder } from "~/types/form-builder";
	import type { FormListItem } from "~/types/FormListItem";

	interface Props {
		sharedWithMeOnly?: boolean;
	}

	const props = withDefaults(defineProps<Props>(), {
		sharedWithMeOnly: false,
	});

	const { user, clear } = useUserSession();
	const router = useRouter();

	const selectedFolderId = ref<number | null | "all" | "unfiled">("all");
	const showMoveFormModal = ref(false);
	const movingForm = ref<FormListItem | null>(null);
	const showDeleteFormModal = ref(false);
	const deletingForm = ref<FormListItem | null>(null);
	const showCreateSubmissionModal = ref(false);
	const createSubmissionForm = ref<FormListItem | null>(null);
	const showChangeStatusModal = ref(false);
	const changeStatusForm = ref<FormListItem | null>(null);
	const showSettingsModal = ref(false);
	const settingsForm = ref<FormListItem | null>(null);
	const searchQuery = ref("");

	const { data: folders, refresh: refreshFolders } = await useFetch<Folder[]>("/api/folders");

	const { data: forms, pending, error, refresh } = await useFetch<FormListItem[]>("/api/forms", {
		query: computed(() => (props.sharedWithMeOnly ? { "shared-with-me": "1" } : {})),
	});

	const filteredForms = computed(() => {
		if (!forms.value) return [];

		const id = selectedFolderId.value;
		let list = forms.value;
		if (id === "unfiled") list = list.filter((f) => f.folderId === null);
		else if (typeof id === "number") list = list.filter((f) => f.folderId === id);

		if (!searchQuery.value.trim()) return list;

		const query = searchQuery.value.toLowerCase().trim();
		return list.filter((form) => {
			const title = form.title.toLowerCase();
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

	function selectFolder(id: number | "all" | "unfiled") {
		selectedFolderId.value = id;
	}

	async function handleFoldersChanged() {
		await refreshFolders();
		await refresh();
	}

	async function handleDuplicateForm(form: FormListItem) {
		try {
			await $fetch(`/api/forms/${form.id}/duplicate`, {
				method: "POST",
			});
			await refresh();
		} catch (error) {
			console.error("Failed to duplicate form:", error);
		}
	}

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

	function handleCreateSubmission(form: FormListItem) {
		createSubmissionForm.value = form;
		nextTick(() => {
			showCreateSubmissionModal.value = true;
		});
	}

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
			);
		} catch (error) {
			console.error("Failed to change form status:", error);
		}
	}

	function handleOpenSettings(form: FormListItem) {
		settingsForm.value = form;
		showSettingsModal.value = true;
	}

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
</script>
