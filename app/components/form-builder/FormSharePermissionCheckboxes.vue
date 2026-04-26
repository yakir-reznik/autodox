<script setup lang="ts">
import type { FormSharePermissions } from "~~/app/types/form-builder"

const props = defineProps<{
	permissions: FormSharePermissions
	disabled?: boolean
}>()

const emit = defineEmits<{
	"update:permissions": [FormSharePermissions]
}>()

function toggle(key: keyof FormSharePermissions) {
	emit("update:permissions", { ...props.permissions, [key]: !props.permissions[key] })
}
</script>

<template>
	<div class="flex flex-col gap-2">
		<label class="flex items-center gap-2 cursor-pointer select-none">
			<input
				type="checkbox"
				:checked="permissions.canViewSubmissions"
				:disabled="disabled"
				class="rounded"
				@change="toggle('canViewSubmissions')"
			/>
			<span class="text-sm">צפייה בהגשות</span>
		</label>
		<label class="flex items-center gap-2 cursor-pointer select-none">
			<input
				type="checkbox"
				:checked="permissions.canCreateSubmissions"
				:disabled="disabled"
				class="rounded"
				@change="toggle('canCreateSubmissions')"
			/>
			<span class="text-sm">יצירת קישורי הגשה</span>
		</label>
		<label class="flex items-center gap-2 cursor-pointer select-none">
			<input
				type="checkbox"
				:checked="permissions.canManageSubmissions"
				:disabled="disabled"
				class="rounded"
				@change="toggle('canManageSubmissions')"
			/>
			<span class="text-sm">ניהול הגשות</span>
		</label>
		<label class="flex items-center gap-2 cursor-pointer select-none">
			<input
				type="checkbox"
				:checked="permissions.canEditForm"
				:disabled="disabled"
				class="rounded"
				@change="toggle('canEditForm')"
			/>
			<span class="text-sm">עריכת הטופס</span>
		</label>
	</div>
</template>
