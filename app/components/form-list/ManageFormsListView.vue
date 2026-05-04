<template>
	<div class="flex gap-6">
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

		<main class="min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 lg:px-8">
			<div class="w-full">
				<div
					class="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"
				>
					<div class="relative w-full max-w-md">
						<label for="">&nbsp;</label>
						<Icon
							name="heroicons:magnifying-glass"
							class="absolute right-3 bottom-0.5 h-5 w-5 -translate-y-1/2 text-gray-400"
						/>
						<UiInput
							v-model="searchQuery"
							type="text"
							placeholder="חיפוש טפסים..."
							class="w-full rounded-md border border-gray-300 py-2 pl-4 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						/>
						<button
							v-if="searchQuery"
							type="button"
							class="absolute left-2.5 bottom-2 flex items-center justify-center rounded p-0.5 text-gray-400 transition-colors hover:text-gray-600"
							@click="searchQuery = ''"
						>
							<Icon name="heroicons:x-mark" class="h-4 w-4" />
						</button>
					</div>

					<div class="flex flex-col gap-6 sm:flex-row sm:items-center">
						<div class="flex flex-col gap-2">
							<label class="text-xs font-medium text-gray-600">סטטוס טופס</label>
							<UiSelect v-model="statusFilter" dir="rtl">
								<UiSelectTrigger class="w-full">
									{{ statusLabels[statusFilter] }}
								</UiSelectTrigger>
								<UiSelectContent>
									<UiSelectItem
										v-for="[val, label] in Object.entries(statusLabels)"
										:key="val"
										:value="val"
									>
										{{ label }}
									</UiSelectItem>
								</UiSelectContent>
							</UiSelect>
						</div>

						<div class="flex flex-row-reverse gap-2 pt-7">
							<label
								v-if="!props.sharedWithMeOnly"
								class="inline-flex cursor-pointer items-center gap-2 text-sm text-gray-700"
								for="shared-forms"
							>
								הצג רק טפסים ששותפו איתי
							</label>
							<UiCheckbox
								v-model="showSharedWithMeOnly"
								type="checkbox"
								class="h-4 w-4 rounded border-gray-300 translate-y-0.5 text-blue-600 focus:ring-blue-500"
								id="shared-forms"
							/>
						</div>

						<div v-if="!pending" class="text-sm text-gray-600 mr-8 pt-5">
							{{ filteredForms.length }} טפסים
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

				<FormListEmptyState
					v-else-if="!filteredForms.length"
					:shared-with-me-only="effectiveSharedWithMeOnly"
				/>

				<div
					v-else
					class="overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm"
				>
					<div class="overflow-x-auto">
						<table class="w-full min-w-215">
							<thead class="border-b border-gray-200 bg-gray-50">
								<tr>
									<th
										class="px-6 py-3 text-right text-sm font-medium text-gray-700"
									>
										<button
											type="button"
											class="inline-flex items-center gap-2"
											@click="toggleSort('title')"
										>
											<span>שם הטופס</span>
											<Icon
												:name="getSortIcon('title')"
												class="h-4 w-4 text-gray-500"
											/>
										</button>
									</th>
									<th
										class="px-6 py-3 text-right text-sm font-medium text-gray-700"
									>
										תיקייה
									</th>
									<th
										class="px-6 py-3 text-right text-sm font-medium text-gray-700"
									>
										סטטוס
									</th>
									<!-- <th
										class="px-6 py-3 text-right text-sm font-medium text-gray-700"
									>
										<button
											type="button"
											class="inline-flex items-center gap-2"
											@click="toggleSort('createdAt')"
										>
											<span>נוצר בתאריך</span>
											<Icon
												:name="getSortIcon('createdAt')"
												class="h-4 w-4 text-gray-500"
											/>
										</button>
									</th> -->
									<th
										class="px-6 py-3 text-right text-sm font-medium text-gray-700"
									>
										פעולות
									</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-gray-200">
								<tr
									v-for="form in filteredForms"
									:key="form.id"
									class="hover:bg-gray-50"
								>
									<td class="px-6 py-4 text-sm text-gray-900">
										<div class="flex min-w-0 flex-col gap-0">
											<div class="flex min-w-0 items-center gap-2">
												<NuxtLink
													:to="`/manage/form/${form.id}/edit`"
													class="block max-w-[30ch] truncate text-base font-medium text-blue-600 hover:text-blue-800 hover:underline"
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
												class="max-w-[30ch] truncate text-sm text-gray-500"
											>
												{{ form.description }}
											</p>
										</div>
									</td>
									<td class="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
										<span v-if="form.folderName">{{ form.folderName }}</span>
										<span v-else class="text-gray-400">ללא תיקייה</span>
									</td>
									<td class="px-6 py-4 text-sm">
										<span
											class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
											:class="getFormStatusLabelClasses(form.status)"
										>
											{{ getFormStatusLabel(form.status) }}
										</span>
									</td>
									<!-- <td class="px-6 py-4 text-sm whitespace-nowrap text-gray-600">
										{{ formatDate(form.createdAt) }}
									</td> -->
									<td class="px-6 py-4 text-sm">
										<div class="flex items-center gap-2">
											<NuxtLink :to="`/manage/form/${form.id}/edit`">
												<BaseButton size="sm">
													<Icon
														name="heroicons:pencil-square"
														class="h-4 w-4"
													/>
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
													<BaseButton
														variant="secondary"
														size="sm"
														class="whitespace-nowrap"
													>
														<Icon
															name="heroicons:ellipsis-vertical"
															class="h-4 w-4"
														/>
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
														<Icon
															:name="action.icon"
															class="ml-2 h-4 w-4"
														/>
														{{ action.label }}
													</UiDropdownMenuItem>
													<UiDropdownMenuItem as-child>
														<NuxtLink
															:to="`/manage/form/${form.id}/submission-data-structure`"
															class="flex w-full items-center"
														>
															<Icon
																name="heroicons:code-bracket"
																class="ml-2 h-4 w-4"
															/>
															הצג מבנה נתונים
														</NuxtLink>
													</UiDropdownMenuItem>
													<UiDropdownMenuSeparator />
													<UiDropdownMenuItem
														variant="destructive"
														:disabled="
															!hasRequiredFormPermissions(
																form.permissions,
																deleteActionPermissions,
															)
														"
														@select="handleDeleteForm(form)"
													>
														<Icon
															name="heroicons:trash"
															class="ml-2 h-4 w-4"
														/>
														{{ deleteActionLabel }}
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
		getFormStatusLabel,
		getFormStatusLabelClasses,
	} from "~/types/FormListItem";

	interface Props {
		sharedWithMeOnly?: boolean;
	}

	type SortField = "title" | "createdAt";
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
	const showSharedWithMeOnly = ref(props.sharedWithMeOnly);
	const statusFilter = ref<StatusFilter>("all");
	const sortField = ref<SortField>("createdAt");
	const sortDirection = ref<SortDirection>("desc");

	const { data: folders, refresh: refreshFolders } = await useFetch<Folder[]>("/api/folders");

	const {
		data: forms,
		pending,
		error,
		refresh,
	} = await useFetch<FormListItem[]>("/api/forms", {
		query: computed(() => (props.sharedWithMeOnly ? { "shared-with-me": "1" } : {})),
	});

	const effectiveSharedWithMeOnly = computed(
		() => props.sharedWithMeOnly || showSharedWithMeOnly.value,
	);

	const filteredForms = computed(() => {
		if (!forms.value) return [];

		let list = [...forms.value];
		const folderId = selectedFolderId.value;

		if (folderId === "unfiled") {
			list = list.filter((form) => form.folderId === null);
		} else if (typeof folderId === "number") {
			list = list.filter((form) => form.folderId === folderId);
		}

		if (effectiveSharedWithMeOnly.value) {
			list = list.filter((form) => !form.isOwner);
		}

		if (statusFilter.value !== "all") {
			list = list.filter((form) => form.status === statusFilter.value);
		}

		const query = searchQuery.value.trim().toLowerCase();
		if (query) {
			list = list.filter((form) =>
				[form.title, form.description, form.folderName, String(form.id)]
					.filter(Boolean)
					.some((value) => value!.toLowerCase().includes(query)),
			);
		}

		return list.sort((left, right) => {
			if (sortField.value === "title") {
				const result = left.title.localeCompare(right.title, "he", { sensitivity: "base" });
				return sortDirection.value === "asc" ? result : -result;
			}

			const leftTime = new Date(left.createdAt).getTime();
			const rightTime = new Date(right.createdAt).getTime();
			return sortDirection.value === "asc" ? leftTime - rightTime : rightTime - leftTime;
		});
	});

	const deleteActionLabel = "מחיקה";
	const deleteActionPermissions: FormPermissionName[] = ["delete"];

	function toggleSort(field: SortField) {
		if (sortField.value === field) {
			sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
			return;
		}

		sortField.value = field;
		sortDirection.value = field === "title" ? "asc" : "desc";
	}

	function getSortIcon(field: SortField) {
		if (sortField.value !== field) return "heroicons:arrows-up-down";
		return sortDirection.value === "asc"
			? "heroicons:bars-arrow-up"
			: "heroicons:bars-arrow-down";
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

	async function changeStatus(status: FormStatusKey) {
		if (!changeStatusForm.value) return;

		try {
			await $fetch(`/api/forms/${changeStatusForm.value.id}`, {
				method: "PATCH",
				body: { status },
			});
			forms.value = forms.value?.map((form) =>
				form.id === changeStatusForm.value!.id ? { ...form, status } : form,
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

	const statusLabels = {
		all: "כל הסטטוסים",
		draft: "טיוטא",
		published: "פורסם",
		archived: "בארכיון",
	};
</script>
