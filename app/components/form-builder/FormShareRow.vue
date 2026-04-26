<template>
	<div class="border rounded-md p-4 flex flex-col gap-3">
		<div class="flex items-start justify-between gap-2">
			<div>
				<div class="flex items-center gap-2">
					<p class="font-medium text-sm">{{ share.granteeName ?? share.granteeEmail }}</p>
					<span
						v-if="share.shareId == null"
						class="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full"
					>
						חדש
					</span>
				</div>
				<p v-if="share.granteeName" class="text-xs text-gray-500">
					{{ share.granteeEmail }}
				</p>
			</div>
			<button
				type="button"
				class="text-gray-400 hover:text-red-500 transition-colors mt-0.5"
				@click="emit('remove')"
			>
				<Icon name="heroicons:x-mark" class="h-4 w-4" />
			</button>
		</div>

		<FormBuilderFormSharePermissionCheckboxes
			:permissions="share.permissions"
			@update:permissions="emit('update:permissions', $event)"
		/>
	</div>
</template>

<script setup lang="ts">
	import type { DraftShare, FormSharePermissions } from "~~/app/types/form-builder";

	defineProps<{ share: DraftShare }>();

	const emit = defineEmits<{
		remove: [];
		"update:permissions": [FormSharePermissions];
	}>();
</script>
