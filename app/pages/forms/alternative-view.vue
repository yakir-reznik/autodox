<script setup lang="ts">
	import type { Folder } from "~/types/form-builder";
	import type { FormListItem } from "~/types/FormListItem";
	import { getFormStatusLabel, getFormStatusLabelClasses } from "~/types/FormListItem";

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

	const currentFolderTitle = computed(() => {
		if (selectedFolderId.value === "all") return "כל הטפסים";
		if (selectedFolderId.value === "unfiled") return "ללא תיקייה";
		const folder = folders.value?.find((f) => f.id === selectedFolderId.value);
		return folder?.name ?? "כל הטפסים";
	});

	// Filter forms based on search query
	const filteredForms = computed(() => {
		if (!forms.value) return [];
		if (!searchQuery.value.trim()) return forms.value;

		const query = searchQuery.value.toLowerCase().trim();
		return forms.value.filter((form) => {
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

	function formatRelativeDate(dateStr: string): string {
		const date = new Date(dateStr);
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);
		const diffHours = Math.floor(diffMs / 3600000);
		const diffDays = Math.floor(diffMs / 86400000);

		if (diffMins < 1) return "עכשיו";
		if (diffMins < 60) return `לפני ${diffMins} דק׳`;
		if (diffHours < 24) return `לפני ${diffHours} שע׳`;
		if (diffDays < 7) return `לפני ${diffDays} ימים`;
		return date.toLocaleDateString("he-IL");
	}

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
				body: { createdBy: user.value?.id },
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
			await $fetch(`/api/forms/${deletingForm.value.id}`, { method: "DELETE" });
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

	function handleMoveForm(form: FormListItem) {
		movingForm.value = form;
		showMoveFormModal.value = true;
	}

	async function moveForm(folderId: number | null) {
		if (!movingForm.value) return;
		try {
			await $fetch(`/api/forms/${movingForm.value.id}`, {
				method: "PATCH",
				body: { folderId, updatedBy: user.value?.id },
			});
			await refresh();
		} catch (error) {
			console.error("Failed to move form:", error);
		}
	}

	useHead({ title: "טפסים - Autodox" });
</script>

<template>
	<div class="flex h-screen overflow-hidden">
		<!-- Left Nav -->
		<nav dir="rtl" class="flex w-48 shrink-0 flex-col bg-slate-900 px-3 py-4">
			<div class="mb-6 flex items-center gap-2 px-2">
				<NuxtLink to="/" class="flex items-center gap-2">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white"
					>
						A
					</div>
					<span class="text-sm font-semibold text-white">Autodox</span>
				</NuxtLink>
			</div>

			<div class="flex flex-1 flex-col gap-1">
				<NuxtLink
					to="/forms/alternative-view"
					class="flex items-center gap-3 rounded-lg bg-slate-700/80 px-3 py-2 text-sm font-medium text-white"
				>
					<Icon name="heroicons:document-text" class="h-5 w-5 shrink-0" />
					<span>טפסים</span>
				</NuxtLink>
				<NuxtLink
					to="/forms/submissions"
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
				>
					<Icon name="heroicons:inbox-stack" class="h-5 w-5 shrink-0" />
					<span>הגשות</span>
				</NuxtLink>
			</div>

			<div class="flex flex-col gap-1 border-t border-slate-700/50 pt-3">
				<NuxtLink
					to="/user"
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
				>
					<div
						class="flex h-6 w-6 items-center justify-center rounded-full bg-slate-700 text-xs font-medium text-slate-300"
					>
						{{ user?.name?.charAt(0) ?? "?" }}
					</div>
					<span>{{ user?.name ?? "פרופיל" }}</span>
				</NuxtLink>
				<button
					class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-800 hover:text-red-400"
					@click="handleLogout"
				>
					<Icon name="heroicons:arrow-right-on-rectangle" class="h-5 w-5 shrink-0" />
					<span>יציאה</span>
				</button>
			</div>
		</nav>

		<!-- Folders Panel -->
		<FoldersSidebar
			dir="rtl"
			class="h-full"
			:folders="folders || []"
			:selected-folder-id="selectedFolderId"
			:forms="forms || []"
			:user-id="user?.id"
			@select-all="selectFolder('all')"
			@select-unfiled="selectFolder('unfiled')"
			@select-folder="selectFolder"
			@folders-changed="handleFoldersChanged"
		/>

		<!-- Main Content -->
		<div
			dir="rtl"
			class="flex flex-1 flex-col overflow-hidden border-l border-gray-200 bg-gray-50"
		>
			<!-- Toolbar -->
			<div
				class="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-6 py-3"
			>
				<div class="flex items-center gap-3">
					<h1 class="text-base font-semibold text-gray-900">{{ currentFolderTitle }}</h1>
					<span
						class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
					>
						{{ filteredForms.length }}
					</span>
				</div>
				<div class="flex items-center gap-3">
					<div class="relative">
						<Icon
							name="heroicons:magnifying-glass"
							class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
						/>
						<input
							v-model="searchQuery"
							type="text"
							placeholder="חיפוש..."
							class="w-52 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-9 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
						/>
						<button
							v-if="searchQuery"
							type="button"
							class="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
							@click="searchQuery = ''"
						>
							<Icon name="heroicons:x-mark" class="h-3.5 w-3.5" />
						</button>
					</div>
					<NuxtLink to="/forms/new">
						<BaseButton variant="primary" size="sm">
							<Icon name="heroicons:plus" class="h-4 w-4" />
							טופס חדש
						</BaseButton>
					</NuxtLink>
				</div>
			</div>

			<!-- Table Area -->
			<div class="flex-1 overflow-y-auto">
				<!-- Loading -->
				<div v-if="pending" class="flex items-center justify-center py-20">
					<Icon name="svg-spinners:ring-resize" class="h-6 w-6 text-blue-500" />
				</div>

				<!-- Error -->
				<div v-else-if="error" class="flex flex-col items-center justify-center py-20">
					<Icon name="heroicons:exclamation-circle" class="h-10 w-10 text-red-400" />
					<p class="mt-2 text-sm text-red-600">שגיאה בטעינת הטפסים</p>
					<BaseButton variant="secondary" size="sm" class="mt-3" @click="refresh">
						נסה שוב
					</BaseButton>
				</div>

				<!-- Empty -->
				<div
					v-else-if="!filteredForms.length"
					class="flex flex-col items-center justify-center py-20"
				>
					<div class="rounded-full bg-gray-100 p-4">
						<Icon name="heroicons:document-text" class="h-8 w-8 text-gray-400" />
					</div>
					<p class="mt-4 text-sm font-medium text-gray-900">אין טפסים</p>
					<p class="mt-1 text-sm text-gray-500">התחל ליצור את הטופס הראשון שלך</p>
					<NuxtLink to="/forms/new" class="mt-4">
						<BaseButton variant="primary" size="sm">
							<Icon name="heroicons:plus" class="h-4 w-4" />
							טופס חדש
						</BaseButton>
					</NuxtLink>
				</div>

				<!-- Table -->
				<template v-else>
					<!-- Header -->
					<div
						class="sticky top-0 z-10 grid grid-cols-[1fr_100px_80px_140px] border-b border-gray-200 bg-gray-50/95 px-6 py-2.5 text-xs font-medium tracking-wide text-gray-500 backdrop-blur-sm"
					>
						<div>שם הטופס</div>
						<div>סטטוס</div>
						<div>הגשות</div>
						<div>עדכון אחרון</div>
					</div>

					<!-- Rows -->
					<div
						v-for="form in filteredForms"
						:key="form.id"
						class="group grid cursor-pointer grid-cols-[1fr_100px_80px_140px] items-center border-b border-gray-100 bg-white px-6 py-3 transition-colors hover:bg-blue-50/40"
						@click="router.push(`/forms/${form.id}`)"
					>
						<div class="flex min-w-0 items-center gap-3 pl-2">
							<Icon
								name="heroicons:document-text"
								class="h-4 w-4 shrink-0 text-gray-400"
							/>
							<span class="truncate text-sm font-medium text-gray-900">
								{{ form.title }}
							</span>
						</div>

						<div>
							<span
								class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
								:class="getFormStatusLabelClasses(form.status)"
							>
								{{ getFormStatusLabel(form.status) }}
							</span>
						</div>

						<div class="text-sm text-gray-400">—</div>

						<div class="relative flex items-center">
							<span
								class="text-sm text-gray-500 transition-opacity group-hover:opacity-0"
							>
								{{ formatRelativeDate(form.updatedAt) }}
							</span>
							<div
								class="absolute inset-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100"
								@click.stop
							>
								<button
									class="rounded p-1.5 text-gray-400 transition-colors hover:bg-blue-100 hover:text-blue-600"
									title="הגשות"
									@click="router.push(`/forms/${form.id}/submissions`)"
								>
									<Icon name="heroicons:inbox-stack" class="h-4 w-4" />
								</button>
								<button
									class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
									title="העברה לתיקייה"
									@click="handleMoveForm(form)"
								>
									<Icon name="heroicons:folder-arrow-down" class="h-4 w-4" />
								</button>
								<button
									class="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
									title="שכפול"
									@click="handleDuplicateForm(form)"
								>
									<Icon name="heroicons:document-duplicate" class="h-4 w-4" />
								</button>
								<button
									class="rounded p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
									title="מחיקה"
									@click="handleDeleteForm(form)"
								>
									<Icon name="heroicons:trash" class="h-4 w-4" />
								</button>
							</div>
						</div>
					</div>
				</template>
			</div>
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
