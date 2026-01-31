<script setup lang="ts">
	import type { Folder } from "~/types/form-builder";
	import type { FormListItem } from "~/types/FormListItem";

	interface Props {
		folders: Folder[];
		selectedFolderId: number | null | "all" | "unfiled";
		forms: FormListItem[];
		userId: number | undefined;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"select-all": [];
		"select-unfiled": [];
		"select-folder": [folderId: number | "all"];
		"folders-changed": [];
	}>();

	// Local state for optimistic updates
	const localFolders = ref<Folder[]>([...props.folders]);

	// Sync local folders when prop changes (from parent refresh)
	watch(
		() => props.folders,
		(newFolders) => {
			localFolders.value = [...newFolders];
		},
		{ deep: true },
	);

	const hoveredFolderId = ref<number | null>(null);
	const toastStore = useToasts();

	// Modal state
	const showFolderModal = ref(false);
	const showDeleteFolderModal = ref(false);
	const folderModalMode = ref<"create" | "rename">("create");
	const editingFolder = ref<Folder | null>(null);
	const deletingFolder = ref<Folder | null>(null);

	const isSelected = (type: "all" | "unfiled" | number) => {
		return props.selectedFolderId === type;
	};

	// Folder handlers
	function handleCreateFolder() {
		folderModalMode.value = "create";
		editingFolder.value = null;
		showFolderModal.value = true;
	}

	function handleRenameFolder(folder: Folder) {
		folderModalMode.value = "rename";
		editingFolder.value = folder;
		showFolderModal.value = true;
	}

	function handleDeleteFolder(folder: Folder) {
		deletingFolder.value = folder;
		showDeleteFolderModal.value = true;
	}

	async function submitFolder(name: string) {
		if (folderModalMode.value === "create") {
			// Optimistic create: add temporary folder immediately
			const tempId = Date.now(); // Temporary ID
			const optimisticFolder: Folder = {
				id: tempId,
				name,
				createdBy: props.userId!,
				createdAt: new Date().toISOString(),
				updatedAt: new Date().toISOString(),
			} as Folder;

			localFolders.value.push(optimisticFolder);

			try {
				const result = await $fetch<Folder>("/api/folders", {
					method: "POST",
					body: {
						name,
						createdBy: props.userId,
					},
				});

				// Replace temp folder with real one from server
				const index = localFolders.value.findIndex((f) => f.id === tempId);
				if (index !== -1) {
					localFolders.value[index] = result;
				}

				emit("folders-changed");
			} catch (error) {
				console.error("Failed to create folder:", error);
				// Rollback: remove the optimistic folder
				localFolders.value = localFolders.value.filter((f) => f.id !== tempId);
				toastStore.add({
					theme: "error",
					title: "שגיאה ביצירת תיקייה",
					subtitle: "לא הצלחנו ליצור את התיקייה. אנא נסה שוב.",
				});
			}
		} else if (editingFolder.value) {
			// Optimistic rename: update name immediately
			const oldName = editingFolder.value.name;
			const folderId = editingFolder.value.id;
			const folderIndex = localFolders.value.findIndex((f) => f.id === folderId);

			if (folderIndex !== -1) {
				localFolders.value[folderIndex] = {
					...localFolders.value[folderIndex],
					name,
					updatedAt: new Date().toISOString(),
				} as Folder;
			}

			try {
				await $fetch(`/api/folders/${folderId}`, {
					method: "PATCH",
					body: { name },
				});

				emit("folders-changed");
			} catch (error) {
				console.error("Failed to rename folder:", error);
				// Rollback: restore old name
				if (folderIndex !== -1) {
					localFolders.value[folderIndex] = {
						...localFolders.value[folderIndex],
						name: oldName,
					} as Folder;
				}
				toastStore.add({
					theme: "error",
					title: "שגיאה בשינוי שם תיקייה",
					subtitle: "לא הצלחנו לשנות את שם התיקייה. אנא נסה שוב.",
				});
			}
		}
	}

	async function confirmDeleteFolder() {
		if (!deletingFolder.value) return;

		const folderId = deletingFolder.value.id;
		const folderIndex = localFolders.value.findIndex((f) => f.id === folderId);
		const deletedFolder = folderIndex !== -1 ? localFolders.value[folderIndex] : null;

		// Optimistic delete: remove folder immediately
		if (folderIndex !== -1) {
			localFolders.value.splice(folderIndex, 1);
		}

		// If currently viewing the deleted folder, switch to "all"
		if (props.selectedFolderId === folderId) {
			emit("select-folder", "all");
		}

		try {
			await $fetch(`/api/folders/${folderId}`, {
				method: "DELETE",
			});

			emit("folders-changed");
		} catch (error) {
			console.error("Failed to delete folder:", error);
			// Rollback: restore the deleted folder
			if (deletedFolder) {
				localFolders.value.splice(folderIndex, 0, deletedFolder);
			}
			toastStore.add({
				theme: "error",
				title: "שגיאה במחיקת תיקייה",
				subtitle: "לא הצלחנו למחוק את התיקייה. אנא נסה שוב.",
			});
		}
	}

	// Calculate form count for a folder (for delete modal)
	const deletingFolderFormCount = computed(() => {
		if (!deletingFolder.value || !props.forms) return 0;
		return props.forms.filter((f) => f.folderId === deletingFolder.value?.id).length;
	});

	// Helper to get form count for any folder
	const getFolderFormCount = (folderId: number) => {
		return props.forms.filter((f) => f.folderId === folderId).length;
	};
</script>

<template>
	<div class="w-72 flex flex-col border-l border-gray-200 bg-gray-50">
		<!-- Header -->
		<div class="border-b border-gray-200 px-4 py-4">
			<h3 class="text-sm font-semibold text-gray-700">תיקיות</h3>
		</div>

		<!-- List -->
		<div class="flex-1 overflow-y-auto p-2">
			<!-- All Forms -->
			<button
				type="button"
				class="w-full rounded-lg px-3 py-2 text-right text-sm font-medium transition-colors"
				:class="
					isSelected('all')
						? 'bg-blue-100 text-blue-700'
						: 'text-gray-700 hover:bg-gray-100'
				"
				@click="emit('select-all')"
			>
				<div class="flex items-center gap-2">
					<Icon name="mdi:folder-multiple" class="h-5 w-5" />
					<span>כל הטפסים</span>
				</div>
			</button>

			<!-- Unfiled Forms -->
			<button
				type="button"
				class="w-full rounded-lg px-3 py-2 text-right text-sm font-medium transition-colors mt-1"
				:class="
					isSelected('unfiled')
						? 'bg-blue-100 text-blue-700'
						: 'text-gray-700 hover:bg-gray-100'
				"
				@click="emit('select-unfiled')"
			>
				<div class="flex items-center gap-2">
					<Icon name="mdi:folder-open-outline" class="h-5 w-5" />
					<span>ללא תיקייה</span>
				</div>
			</button>

			<!-- Divider -->
			<div class="my-2 border-t border-gray-200"></div>

			<!-- Folders List -->
			<div class="space-y-1">
				<div
					v-for="folder in localFolders"
					:key="folder.id"
					class="relative rounded-lg transition-colors"
					:class="isSelected(folder.id) ? 'bg-blue-100' : 'hover:bg-gray-100'"
					@mouseenter="hoveredFolderId = folder.id"
					@mouseleave="hoveredFolderId = null"
				>
					<button
						type="button"
						class="w-full px-3 py-2 text-right text-sm font-medium"
						:class="isSelected(folder.id) ? 'text-blue-700' : 'text-gray-700'"
						@click="emit('select-folder', folder.id)"
					>
						<div class="flex items-center gap-2">
							<Icon name="mdi:folder" class="h-5 w-5" />
							<span class="flex-1 truncate">{{ folder.name }}</span>
							<span
								class="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full"
							>
								{{ getFolderFormCount(folder.id) }}
							</span>

							<!-- Action Buttons (show on hover) -->
							<div
								class="flex items-center gap-1 transition-opacity"
								:class="hoveredFolderId === folder.id ? 'opacity-100' : 'opacity-0'"
								@click.stop
							>
								<button
									type="button"
									class="rounded p-1 hover:bg-gray-200 transition-colors"
									:tabindex="hoveredFolderId === folder.id ? 0 : -1"
									@click="handleRenameFolder(folder)"
									title="שינוי שם"
								>
									<Icon name="mdi:pencil" class="h-4 w-4" />
								</button>
								<button
									type="button"
									class="rounded p-1 hover:bg-red-100 hover:text-red-600 transition-colors"
									:tabindex="hoveredFolderId === folder.id ? 0 : -1"
									@click="handleDeleteFolder(folder)"
									title="מחיקה"
								>
									<Icon name="mdi:delete" class="h-4 w-4" />
								</button>
							</div>
						</div>
					</button>
				</div>
			</div>
		</div>

		<!-- Footer: New Folder Button -->
		<div class="border-t border-gray-200 p-3">
			<BaseButton variant="secondary" size="sm" class="w-full" @click="handleCreateFolder">
				<Icon name="mdi:folder-plus" class="h-4 w-4" />
				<span>תיקייה חדשה</span>
			</BaseButton>
		</div>

		<!-- Modals -->
		<FoldersModal
			v-model="showFolderModal"
			:mode="folderModalMode"
			:folder="editingFolder"
			@submit="submitFolder"
		/>

		<FoldersDeleteModal
			v-model="showDeleteFolderModal"
			:folder="deletingFolder"
			:form-count="deletingFolderFormCount"
			@confirm="confirmDeleteFolder"
		/>
	</div>
</template>
