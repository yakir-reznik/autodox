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

const hoveredFolderId = ref<number | null>(null);

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
	try {
		if (folderModalMode.value === "create") {
			await $fetch("/api/folders", {
				method: "POST",
				body: {
					name,
					createdBy: props.userId,
				},
			});
		} else if (editingFolder.value) {
			await $fetch(`/api/folders/${editingFolder.value.id}`, {
				method: "PATCH",
				body: { name },
			});
		}
		emit("folders-changed");
	} catch (error) {
		console.error("Failed to save folder:", error);
	}
}

async function confirmDeleteFolder() {
	if (!deletingFolder.value) return;

	try {
		await $fetch(`/api/folders/${deletingFolder.value.id}`, {
			method: "DELETE",
		});

		// If currently viewing the deleted folder, switch to "all"
		if (props.selectedFolderId === deletingFolder.value.id) {
			emit("select-folder", "all");
		}

		emit("folders-changed");
	} catch (error) {
		console.error("Failed to delete folder:", error);
	}
}

// Calculate form count for a folder (for delete modal)
const deletingFolderFormCount = computed(() => {
	if (!deletingFolder.value || !props.forms) return 0;
	return props.forms.filter((f) => f.folderId === deletingFolder.value?.id).length;
});
</script>

<template>
	<div class="w-64 flex flex-col border-l border-gray-200 bg-gray-50">
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
					v-for="folder in folders"
					:key="folder.id"
					class="relative rounded-lg transition-colors"
					:class="
						isSelected(folder.id)
							? 'bg-blue-100'
							: 'hover:bg-gray-100'
					"
					@mouseenter="hoveredFolderId = folder.id"
					@mouseleave="hoveredFolderId = null"
				>
					<button
						type="button"
						class="w-full px-3 py-2 text-right text-sm font-medium"
						:class="
							isSelected(folder.id)
								? 'text-blue-700'
								: 'text-gray-700'
						"
						@click="emit('select-folder', folder.id)"
					>
						<div class="flex items-center gap-2">
							<Icon name="mdi:folder" class="h-5 w-5" />
							<span class="flex-1 truncate">{{ folder.name }}</span>

							<!-- Action Buttons (show on hover) -->
							<div
								v-if="hoveredFolderId === folder.id"
								class="flex items-center gap-1"
								@click.stop
							>
								<button
									type="button"
									class="rounded p-1 hover:bg-gray-200 transition-colors"
									@click="handleRenameFolder(folder)"
									title="שינוי שם"
								>
									<Icon name="mdi:pencil" class="h-4 w-4" />
								</button>
								<button
									type="button"
									class="rounded p-1 hover:bg-red-100 hover:text-red-600 transition-colors"
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
			<UiButton
				variant="secondary"
				size="sm"
				class="w-full"
				@click="handleCreateFolder"
			>
				<Icon name="mdi:folder-plus" class="h-4 w-4" />
				<span>תיקייה חדשה</span>
			</UiButton>
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
