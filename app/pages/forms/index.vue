<script setup lang="ts">
	import type { Folder } from "~/types/form-builder";

	interface Form {
		id: number;
		title: string;
		description: string | null;
		folderId: number | null;
		status: "draft" | "published" | "archived";
		createdAt: string;
		updatedAt: string;
	}

	const { user, clear } = useUserSession();
	const router = useRouter();

	// State management
	const selectedFolderId = ref<number | null | "all" | "unfiled">("all");
	const showFolderModal = ref(false);
	const showDeleteFolderModal = ref(false);
	const showMoveFormModal = ref(false);
	const folderModalMode = ref<"create" | "rename">("create");
	const editingFolder = ref<Folder | null>(null);
	const deletingFolder = ref<Folder | null>(null);
	const movingForm = ref<Form | null>(null);

	// Fetch folders
	const { data: folders, refresh: refreshFolders } = await useFetch<Folder[]>("/api/folders");

	// Fetch forms based on selected folder
	const formsQuery = computed(() => {
		const id = selectedFolderId.value;
		if (id === "unfiled") return "/api/forms?folderId=null";
		if (typeof id === "number") return `/api/forms?folderId=${id}`;
		return "/api/forms";
	});

	const { data: forms, pending, error, refresh } = await useFetch<Form[]>(formsQuery);

	const statusColors = {
		draft: "bg-yellow-100 text-yellow-800",
		published: "bg-green-100 text-green-800",
		archived: "bg-gray-100 text-gray-800",
	};

	const statusLabels = {
		draft: "Draft",
		published: "Published",
		archived: "Archived",
	};

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("he-IL", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	async function handleLogout() {
		await $fetch("/api/auth/logout", { method: "POST" });
		await clear();
		router.push("/login");
	}

	// Folder selection handler
	function selectFolder(id: number | "all" | "unfiled") {
		selectedFolderId.value = id;
	}

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
						createdBy: user.value?.id,
					},
				});
			} else if (editingFolder.value) {
				await $fetch(`/api/folders/${editingFolder.value.id}`, {
					method: "PATCH",
					body: { name },
				});
			}
			await refreshFolders();
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
			if (selectedFolderId.value === deletingFolder.value.id) {
				selectFolder("all");
			}

			await refreshFolders();
			await refresh();
		} catch (error) {
			console.error("Failed to delete folder:", error);
		}
	}

	// Form move handlers
	function handleMoveForm(form: Form) {
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

	// Calculate form count for a folder (for delete modal)
	const deletingFolderFormCount = computed(() => {
		if (!deletingFolder.value || !forms.value) return 0;
		return forms.value.filter((f) => f.folderId === deletingFolder.value?.id).length;
	});

	// Get folder name by ID
	function getFolderName(folderId: number | null): string | null {
		if (!folderId) return null;
		return folders.value?.find((f) => f.id === folderId)?.name ?? "תיקייה שנמחקה";
	}

	useHead({
		title: "Forms - Autodox",
	});
</script>

<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<!-- Header -->
		<header class="bg-white shadow">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<NuxtLink to="/">
							<UiButton variant="secondary" size="sm">
								<Icon name="heroicons:arrow-left" class="h-5 w-5" />
							</UiButton>
						</NuxtLink>
						<h1 class="text-2xl font-bold text-gray-900">Forms</h1>
					</div>
					<div class="flex items-center gap-3">
						<div class="text-sm text-gray-600">
							{{ user?.name }}
						</div>
						<NuxtLink to="/forms/upload">
							<UiButton variant="secondary">
								<Icon name="heroicons:arrow-up-tray" class="h-5 w-5" />
								Upload JSON
							</UiButton>
						</NuxtLink>
						<NuxtLink to="/forms/new">
							<UiButton variant="primary">
								<Icon name="heroicons:plus" class="h-5 w-5" />
								New Form
							</UiButton>
						</NuxtLink>
						<UiButton variant="secondary" @click="handleLogout">
							<Icon name="heroicons:arrow-right-on-rectangle" class="h-5 w-5" />
							Logout
						</UiButton>
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
				@select-all="selectFolder('all')"
				@select-unfiled="selectFolder('unfiled')"
				@select-folder="selectFolder"
				@create-folder="handleCreateFolder"
				@rename-folder="handleRenameFolder"
				@delete-folder="handleDeleteFolder"
			/>

			<!-- Main Content Area -->
			<main class="flex-1 overflow-y-auto px-4 py-8 sm:px-6 lg:px-8">
				<div class="mx-auto max-w-6xl">
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
						<UiButton variant="secondary" class="mt-4" @click="refresh">
							Try Again
						</UiButton>
					</div>

					<!-- Empty state -->
					<div
						v-else-if="!forms || forms.length === 0"
						class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center"
					>
						<Icon
							name="heroicons:document-plus"
							class="mx-auto h-12 w-12 text-gray-400"
						/>
						<h3 class="mt-4 text-lg font-medium text-gray-900">אין טפסים</h3>
						<p class="mt-2 text-gray-500">התחל ליצור את הטופס הראשון שלך.</p>
						<NuxtLink to="/forms/new" class="mt-6 inline-block">
							<UiButton variant="primary">
								<Icon name="heroicons:plus" class="h-5 w-5" />
								יצירת טופס
							</UiButton>
						</NuxtLink>
					</div>

					<!-- Forms grid -->
					<div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
						<div
							v-for="form in forms"
							:key="form.id"
							class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
						>
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h3 class="font-medium text-gray-900">
										{{ form.title }}
									</h3>
									<p
										v-if="form.description"
										class="mt-1 text-sm text-gray-500 line-clamp-2"
									>
										{{ form.description }}
									</p>
								</div>
								<span
									class="shrink-0 rounded-full px-2 py-1 text-xs font-medium"
									:class="statusColors[form.status]"
								>
									{{ statusLabels[form.status] }}
								</span>
							</div>
							<div class="mt-4 flex items-center justify-between">
								<div class="text-sm text-gray-500">
									עודכן ב {{ formatDate(form.updatedAt) }}
								</div>
								<div
									v-if="getFolderName(form.folderId)"
									class="text-xs text-indigo-800 bg-indigo-100 rounded px-2 py-1"
								>
									{{ getFolderName(form.folderId) }}
								</div>
							</div>
							<div class="mt-6 flex flex-col gap-2">
								<NuxtLink :to="`/edit/${form.id}`">
									<UiButton variant="primary" class="w-full">
										<Icon name="heroicons:pencil-square" class="h-4 w-4" />
										עריכה
									</UiButton>
								</NuxtLink>
								<div class="flex gap-2">
									<NuxtLink :to="`/fill/${form.id}`" class="flex-1">
										<UiButton variant="secondary" class="w-full">
											<Icon name="heroicons:document-text" class="h-4 w-4" />
											מילוי
										</UiButton>
									</NuxtLink>
									<NuxtLink :to="`/submissions/${form.id}`" class="flex-1">
										<UiButton variant="secondary" class="w-full">
											<Icon name="heroicons:inbox" class="h-4 w-4" />
											הגשות
										</UiButton>
									</NuxtLink>
								</div>
								<UiButton
									variant="ghost"
									size="sm"
									class="w-full"
									@click="handleMoveForm(form)"
								>
									<Icon name="mdi:folder-move" class="h-4 w-4" />
									העברה לתיקייה
								</UiButton>
							</div>
						</div>
					</div>
				</div>
			</main>
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

		<FoldersMoveFormModal
			v-if="movingForm"
			v-model="showMoveFormModal"
			:folders="folders || []"
			:current-folder-id="movingForm.folderId"
			:form-title="movingForm.title"
			@move="moveForm"
		/>
	</div>
</template>
