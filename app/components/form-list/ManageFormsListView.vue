<template>
	<div class="flex gap-6">
		<FoldersSidebar
			:folders="folders || []"
			:selected-folder-id="selectedFolderId"
			:forms="forms"
			:folder-counts="folderCountsById"
			:user-id="user?.id"
			@select-all="selectFolder('all')"
			@select-unfiled="selectFolder('unfiled')"
			@select-folder="selectFolder"
			@folders-changed="handleFoldersChanged"
		/>

		<main class="min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
			<div class="w-full">
				<div class="mb-6 rounded-lg bg-white p-4 shadow">
					<div class="flex flex-nowrap items-end gap-4 overflow-x-auto pb-1">
						<div class="flex min-w-72 flex-col gap-1">
							<label class="text-sm font-medium text-gray-700">חיפוש</label>
							<div class="relative">
								<Icon
									name="heroicons:magnifying-glass"
									class="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
								/>
								<UiInput
									v-model="searchQuery"
									type="text"
									placeholder="חיפוש לפי שם טופס"
									class="bg-white pr-10 pl-10"
								/>
								<button
									v-if="searchQuery"
									type="button"
									class="absolute left-2.5 top-1/2 flex -translate-y-1/2 items-center justify-center rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
									@click="searchQuery = ''"
								>
									<Icon name="heroicons:x-mark" class="h-4 w-4" />
								</button>
							</div>
						</div>

						<div class="flex min-w-40 flex-col gap-1">
							<label class="text-sm font-medium text-gray-700">סטטוס טופס</label>
							<UiSelect v-model="statusFilter" dir="rtl">
								<UiSelectTrigger class="bg-white">
									{{ statusLabels[statusFilter] }}
								</UiSelectTrigger>
								<UiSelectContent>
									<UiSelectItem
										v-for="[value, label] in Object.entries(statusLabels)"
										:key="value"
										:value="value"
									>
										{{ label }}
									</UiSelectItem>
								</UiSelectContent>
							</UiSelect>
						</div>

						<BaseButton
							variant="secondary"
							:disabled="!hasActiveFilters"
							@click="clearFilters"
						>
							נקה מסננים
						</BaseButton>

						<div v-if="!pending" class="mr-auto whitespace-nowrap text-sm text-gray-600">
							{{ pagination?.total ?? 0 }} טפסים
						</div>
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

				<div
					v-else-if="forms.length === 0"
					class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center"
				>
					<Icon name="heroicons:document-magnifying-glass" class="mx-auto h-12 w-12 text-gray-400" />
					<h3 class="mt-4 text-lg font-medium text-gray-900">
						{{ hasActiveFilters ? "לא נמצאו טפסים" : "אין טפסים" }}
					</h3>
					<p class="mt-2 text-gray-500">
						{{ hasActiveFilters ? "נסה לשנות את החיפוש או הסינון." : "התחל ליצור את הטופס הראשון שלך." }}
					</p>
					<NuxtLink v-if="!hasActiveFilters" to="/manage/form/new" class="mt-6 inline-block">
						<BaseButton variant="primary">
							<Icon name="heroicons:plus" class="h-5 w-5" />
							יצירת טופס
						</BaseButton>
					</NuxtLink>
				</div>

				<div
					v-else
					class="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"
				>
					<div class="overflow-x-auto">
						<table class="w-full min-w-175">
							<thead class="border-b border-gray-200 bg-gray-50">
								<tr>
									<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
										<button
											type="button"
											class="inline-flex items-center gap-2"
											@click="toggleSort('title')"
										>
											<span>שם הטופס</span>
											<Icon :name="getSortIcon('title')" class="h-4 w-4 text-gray-500" />
										</button>
									</th>
									<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
										<button
											type="button"
											class="inline-flex items-center gap-2"
											@click="toggleSort('status')"
										>
											<span>סטטוס</span>
											<Icon :name="getSortIcon('status')" class="h-4 w-4 text-gray-500" />
										</button>
									</th>
									<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
										<button
											type="button"
											class="inline-flex items-center gap-2"
											@click="toggleSort('updatedAt')"
										>
											<span class="whitespace-nowrap">עודכן לאחרונה</span>
											<Icon :name="getSortIcon('updatedAt')" class="h-4 w-4 text-gray-500" />
										</button>
									</th>
									<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
										פעולות
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								<tr
									v-for="form in forms"
									:key="form.id"
									class="hover:bg-gray-50"
								>
									<td class="px-6 py-4 text-sm text-gray-900">
										<div class="flex min-w-0 flex-col gap-0">
											<div class="flex min-w-0 items-center gap-2">
												<NuxtLink
													:to="`/manage/form/${form.id}/edit`"
													class="block max-w-[34ch] truncate text-base font-medium text-blue-600 hover:text-blue-800 hover:underline"
												>
													{{ form.title }}
												</NuxtLink>
												<span
													v-if="!form.isOwner"
													class="flex size-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600"
												>
													<Icon name="heroicons:share" class="text-xs" />
												</span>
											</div>
											<p
												v-if="form.description"
												class="max-w-[34ch] truncate text-sm text-gray-500"
											>
												{{ form.description }}
											</p>
											<div class="mt-1 flex items-center gap-1 text-xs text-gray-500">
												<Icon name="heroicons:folder" class="h-3.5 w-3.5 text-gray-400" />
												<span v-if="form.folderName" class="max-w-[34ch] truncate">
													{{ form.folderName }}
												</span>
												<span v-else class="text-gray-400">ללא תיקייה</span>
											</div>
										</div>
									</td>
									<td class="px-6 py-4 text-sm">
										<span
											class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
											:class="getFormStatusLabelClasses(form.status)"
										>
											{{ getFormStatusLabel(form.status) }}
										</span>
									</td>
									<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
										{{ formatDate(form.updatedAt) }}
									</td>
									<td class="px-6 py-4 text-sm">
										<div class="flex items-center gap-2">
											<NuxtLink :to="`/manage/form/${form.id}/edit`">
												<BaseButton size="sm">
													<Icon name="heroicons:pencil-square" class="h-4 w-4" />
													עריכה
												</BaseButton>
											</NuxtLink>
											<NuxtLink :to="`/manage/submissions/form/${form.id}`">
												<BaseButton variant="secondary" size="sm">
													<Icon name="heroicons:inbox" class="h-4 w-4" />
													הגשות
												</BaseButton>
											</NuxtLink>
											<UiDropdownMenu dir="rtl">
												<UiDropdownMenuTrigger as-child>
													<BaseButton variant="secondary" size="sm" class="whitespace-nowrap">
														<Icon name="heroicons:ellipsis-vertical" class="h-4 w-4" />
														פעולות נוספות
													</BaseButton>
												</UiDropdownMenuTrigger>
												<UiDropdownMenuContent align="end" class="w-56">
													<UiDropdownMenuItem
														v-for="action in getRowActions(form)"
														:key="action.key"
														:disabled="isActionDisabled(form, action)"
														@select="action.handler"
													>
														<Icon :name="action.icon" class="ml-2 h-4 w-4" />
														{{ action.label }}
													</UiDropdownMenuItem>
													<UiDropdownMenuItem as-child>
														<NuxtLink
															:to="`/manage/form/${form.id}/submission-data-structure`"
															class="flex w-full items-center"
														>
															<Icon name="heroicons:code-bracket" class="ml-2 h-4 w-4" />
															הצג מבנה נתונים
														</NuxtLink>
													</UiDropdownMenuItem>
													<UiDropdownMenuSeparator />
													<UiDropdownMenuItem
														variant="destructive"
														:disabled="!hasRequiredFormPermissions(form.permissions, deleteActionPermissions)"
														@select="handleDeleteForm(form)"
													>
														<Icon name="heroicons:trash" class="ml-2 h-4 w-4" />
														מחיקה
													</UiDropdownMenuItem>
												</UiDropdownMenuContent>
											</UiDropdownMenu>
										</div>
									</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>

				<FormListPagination
					v-if="!pending && !error"
					v-model:page="currentPage"
					:pagination="pagination"
					entity-label="טפסים"
				/>
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
	import type { Folder, FormPermissionName } from "~/types/form-builder";
	import {
		type FormListItem,
		type FormStatusKey,
		type PaginatedFormsResponse,
		getFormStatusLabel,
		getFormStatusLabelClasses,
	} from "~/types/FormListItem";

	interface Props {
		sharedWithMeOnly?: boolean;
	}

	type SortField = "title" | "status" | "createdAt" | "updatedAt";
	type SortDirection = "asc" | "desc";
	type StatusFilter = "all" | FormStatusKey;
	type RowAction = {
		key: string;
		label: string;
		icon: string;
		handler: () => void;
		requiredPermissions?: FormPermissionName[];
		requiredPermissionMode?: "all" | "any";
	};

	const props = withDefaults(defineProps<Props>(), {
		sharedWithMeOnly: false,
	});

	const { user } = useUserSession();
	const toasts = useToasts();

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
	const debouncedSearchQuery = ref("");
	const statusFilter = ref<StatusFilter>("all");
	const sortField = ref<SortField>("createdAt");
	const sortDirection = ref<SortDirection>("desc");
	const currentPage = ref(1);
	const pageSize = 10;
	let searchDebounceTimer: ReturnType<typeof setTimeout> | undefined;

	const { data: folders, refresh: refreshFolders } = await useFetch<Folder[]>("/api/folders");

	const {
		data: response,
		pending,
		error,
		refresh,
	} = await useFetch<PaginatedFormsResponse>("/api/forms", {
		query: computed(() => {
			const query: Record<string, string | number> = {
				page: currentPage.value,
				limit: pageSize,
				sortBy: sortField.value,
				sortDir: sortDirection.value,
			};

			if (props.sharedWithMeOnly) query["shared-with-me"] = "1";
			if (debouncedSearchQuery.value) query.search = debouncedSearchQuery.value;
			if (statusFilter.value !== "all") query.status = statusFilter.value;

			if (selectedFolderId.value === "unfiled") {
				query.folderId = "null";
			} else if (typeof selectedFolderId.value === "number") {
				query.folderId = selectedFolderId.value;
			}

			return query;
		}),
	});

	const forms = computed(() => response.value?.data ?? []);
	const pagination = computed(() => response.value?.pagination);
	const folderCountsById = computed<Record<number, number> | undefined>(() => {
		if (!response.value) return undefined;

		return Object.fromEntries(
			(response.value.folderCounts ?? [])
				.filter((row) => row.folderId !== null)
				.map((row) => [row.folderId!, row.count]),
		) as Record<number, number>;
	});

	const hasActiveFilters = computed(
		() => Boolean(searchQuery.value.trim()) || statusFilter.value !== "all",
	);

	watch(searchQuery, (value) => {
		currentPage.value = 1;
		clearTimeout(searchDebounceTimer);
		searchDebounceTimer = setTimeout(() => {
			debouncedSearchQuery.value = value.trim();
		}, 300);
	});

	watch(statusFilter, () => {
		currentPage.value = 1;
	});

	watch(pagination, (value) => {
		if (value && value.totalPages > 0 && currentPage.value > value.totalPages) {
			currentPage.value = value.totalPages;
		}
	});

	onBeforeUnmount(() => clearTimeout(searchDebounceTimer));

	const deleteActionPermissions: FormPermissionName[] = ["delete"];

	const statusLabels = {
		all: "כל הסטטוסים",
		draft: "טיוטה",
		published: "פורסם",
		archived: "בארכיון",
	};

	function selectFolder(id: number | "all" | "unfiled") {
		selectedFolderId.value = id;
		currentPage.value = 1;
	}

	function toggleSort(field: SortField) {
		if (sortField.value === field) {
			sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
			currentPage.value = 1;
			return;
		}

		sortField.value = field;
		sortDirection.value = field === "title" ? "asc" : "desc";
		currentPage.value = 1;
	}

	function getSortIcon(field: SortField) {
		if (sortField.value !== field) return "heroicons:arrows-up-down";
		return sortDirection.value === "asc"
			? "heroicons:bars-arrow-up"
			: "heroicons:bars-arrow-down";
	}

	function clearFilters() {
		searchQuery.value = "";
		debouncedSearchQuery.value = "";
		statusFilter.value = "all";
		currentPage.value = 1;
	}

	function getRowActions(form: FormListItem): RowAction[] {
		return [
			{
				key: "copy-form-id",
				label: `העתק מזהה טופס (${form.id})`,
				icon: "heroicons:square-2-stack",
				handler: () => handleCopyFormId(form),
			},
			{
				key: "move",
				label: "העבר לתיקייה",
				icon: "heroicons:folder-arrow-down",
				handler: () => handleMoveForm(form),
			},
			{
				key: "duplicate",
				label: "שכפול טופס",
				icon: "heroicons:document-duplicate",
				handler: () => handleDuplicateForm(form),
			},
			{
				key: "create-submission",
				label: "יצירת הגשה",
				icon: "heroicons:document-text",
				handler: () => handleCreateSubmission(form),
				requiredPermissions: ["create_submissions"],
			},
			{
				key: "change-status",
				label: "שינוי סטטוס",
				icon: "heroicons:arrow-path",
				handler: () => handleChangeStatus(form),
				requiredPermissions: ["edit_form"],
			},
			{
				key: "settings",
				label: "הגדרות טופס ושיתוף",
				icon: "heroicons:cog-6-tooth",
				handler: () => handleOpenSettings(form),
				requiredPermissions: ["edit_form", "manage_shares"],
				requiredPermissionMode: "any",
			},
		];
	}

	function isActionDisabled(form: FormListItem, action: Partial<RowAction>) {
		return action.requiredPermissions
			? !hasRequiredFormPermissions(
					form.permissions,
					action.requiredPermissions,
					action.requiredPermissionMode,
				)
			: false;
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

	async function changeStatus(status: FormStatusKey) {
		if (!changeStatusForm.value) return;

		try {
			await $fetch(`/api/forms/${changeStatusForm.value.id}`, {
				method: "PATCH",
				body: { status },
			});
			await refresh();
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

	async function handleCopyFormId(form: FormListItem) {
		try {
			await navigator.clipboard.writeText(String(form.id));
			toasts.add({ title: "מזהה הטופס הועתק", theme: "success", duration: 2000 });
		} catch (error) {
			console.error("Failed to copy form id:", error);
			toasts.add({
				title: "שגיאה: לא ניתן להעתיק את מזהה הטופס",
				theme: "error",
				duration: 3000,
			});
		}
	}
</script>
