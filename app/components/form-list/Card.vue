<template>
	<div
		:key="form.id"
		class="group flex flex-col h-full rounded-md border border-gray-200 bg-white p-4 transition-all hover:border-gray-300 hover:shadow-sm"
	>
		<!-- Header: Title & Description -->
		<div class="mb-4">
			<h3 class="text-lg font-semibold text-gray-900 leading-tight">
				{{ form.title }}
			</h3>
			<p
				v-if="form.description"
				class="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed"
			>
				{{ form.description }}
			</p>
		</div>

		<!-- Metadata Row -->
		<div class="flex items-center gap-2 flex-wrap mb-5 pb-5 border-b border-gray-100">
			<span
				class="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium"
				:class="getFormStatusLabelClasses(form.status)"
			>
				{{ getFormStatusLabel(form.status) }}
			</span>
			<div
				v-if="form.folderName"
				class="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 rounded-md px-2.5 py-0.5 font-medium"
			>
				<Icon name="mdi:folder-outline" class="h-3.5 w-3.5" />
				{{ form.folderName }}
			</div>
			<div class="mr-auto text-xs text-gray-500">
				{{ formatDate(form.updatedAt) }}
			</div>
		</div>

		<!-- Actions -->
		<div class="flex items-center gap-2 mt-auto">
			<NuxtLink :to="`/manage/form/${form.id}/edit`" class="flex-1">
				<BaseButton variant="primary" class="w-full justify-center" size="sm">
					<Icon name="heroicons:pencil-square" class="h-4 w-4" />
					עריכה
				</BaseButton>
			</NuxtLink>
			<NuxtLink :to="`/manage/submissions/form/${form.id}`" class="flex-1">
				<BaseButton variant="secondary" class="w-full justify-center" size="sm">
					<Icon name="heroicons:inbox" class="h-4 w-4" />
					הגשות
				</BaseButton>
			</NuxtLink>
			<UiDropdownMenu>
				<UiDropdownMenuTrigger as-child>
					<BaseButton variant="ghost" size="sm" class="whitespace-nowrap">
						<Icon name="heroicons:ellipsis-vertical" class="h-4 w-4" />
						עוד פעולות
					</BaseButton>
				</UiDropdownMenuTrigger>
				<UiDropdownMenuContent align="end">
					<UiDropdownMenuItem
						v-for="action in primaryMenuActions"
						:key="action.key"
						class="px-4"
						:disabled="isActionDisabled(action)"
						@select="action.handler"
					>
						<Icon :name="action.icon" class="h-4 w-4" />
						{{ action.label }}
					</UiDropdownMenuItem>
					<NuxtLink :to="`/manage/form/${form.id}/submission-data-structure`">
						<UiDropdownMenuItem class="px-4">
							<Icon name="heroicons:code-bracket" class="h-4 w-4" />
							הצג מבנה נתונים
						</UiDropdownMenuItem>
					</NuxtLink>
					<UiDropdownMenuItem
						class="px-4"
						:disabled="isActionDisabled(settingsAction)"
						@select="settingsAction.handler"
					>
						<Icon :name="settingsAction.icon" class="h-4 w-4" />
						{{ settingsAction.label }}
					</UiDropdownMenuItem>
					<UiDropdownMenuSeparator />
					<UiDropdownMenuItem
						class="px-4"
						variant="destructive"
						:disabled="isActionDisabled(deleteAction)"
						@select="deleteAction.handler"
					>
						<Icon :name="deleteAction.icon" class="h-4 w-4" />
						{{ deleteAction.label }}
					</UiDropdownMenuItem>
				</UiDropdownMenuContent>
			</UiDropdownMenu>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { FormPermissionName } from "~/types/form-builder";
	import {
		type FormListItem,
		getFormStatusLabel,
		getFormStatusLabelClasses,
	} from "~/types/FormListItem";

	const { form } = defineProps<{
		form: FormListItem;
	}>();

	const emit = defineEmits<{
		moveForm: [form: FormListItem];
		duplicateForm: [form: FormListItem];
		createSubmission: [form: FormListItem];
		changeStatus: [form: FormListItem];
		deleteForm: [form: FormListItem];
		openSettings: [form: FormListItem];
	}>();

	const toasts = useToasts();

	type MenuAction = {
		key: string;
		label: string;
		icon: string;
		handler: () => void;
		requiredPermissions?: FormPermissionName[];
		requiredPermissionMode?: "all" | "any";
	};

	const primaryMenuActions = computed<MenuAction[]>(() => [
		{
			key: "copy-form-id",
			label: `התעקת מזהה טופס (${form.id})`,
			icon: "heroicons:square-2-stack",
			handler: () => handlCopyFormId(form),
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
			handler: () => emit("duplicateForm", form),
		},
		{
			key: "create-submission",
			label: "יצירת הגשה",
			icon: "heroicons:document-text",
			handler: () => emit("createSubmission", form),
			requiredPermissions: ["create_submissions"],
		},
		{
			key: "change-status",
			label: "שינוי סטטוס",
			icon: "heroicons:arrow-path",
			handler: () => emit("changeStatus", form),
			requiredPermissions: ["edit_form"],
		},
	]);

	const settingsAction: MenuAction = {
		key: "settings",
		label: "הגדרות טופס ושיתוף",
		icon: "heroicons:cog-6-tooth",
		handler: () => emit("openSettings", form),
		requiredPermissions: ["edit_form", "manage_shares"],
		requiredPermissionMode: "any",
	};

	const deleteAction: MenuAction = {
		key: "delete",
		label: "מחיקה",
		icon: "heroicons:trash",
		handler: () => emit("deleteForm", form),
		requiredPermissions: ["delete"],
	};

	function handleMoveForm(form: FormListItem) {
		emit("moveForm", form);
	}

	function isActionDisabled(action: MenuAction) {
		return action.requiredPermissions
			? !hasRequiredFormPermissions(
					form.permissions,
					action.requiredPermissions,
					action.requiredPermissionMode,
				)
			: false;
	}

	async function handlCopyFormId(form: FormListItem) {
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

<style lang="sass" scoped></style>
