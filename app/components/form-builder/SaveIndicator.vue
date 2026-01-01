<script setup lang="ts">
import type { SaveStatus } from "~/types/form-builder";

interface Props {
	status: SaveStatus;
	lastSavedAt: Date | null;
}

const props = defineProps<Props>();

const formattedTime = computed(() => {
	if (!props.lastSavedAt) return null;
	return props.lastSavedAt.toLocaleTimeString("he-IL", {
		hour: "2-digit",
		minute: "2-digit",
	});
});
</script>

<template>
	<div class="flex items-center gap-2 text-sm">
		<!-- Idle: Show last saved time if available -->
		<template v-if="status === 'idle' && formattedTime">
			<span class="text-gray-400">Saved at {{ formattedTime }}</span>
		</template>

		<!-- Pending: Show typing indicator -->
		<template v-else-if="status === 'pending'">
			<span class="text-gray-400">Unsaved changes...</span>
		</template>

		<!-- Saving: Show spinner -->
		<template v-else-if="status === 'saving'">
			<Icon name="svg-spinners:ring-resize" class="h-4 w-4 text-blue-500" />
			<span class="text-blue-500">Saving...</span>
		</template>

		<!-- Saved: Show checkmark -->
		<template v-else-if="status === 'saved'">
			<Icon name="heroicons:check-circle" class="h-4 w-4 text-green-500" />
			<span class="text-green-500">Saved</span>
		</template>

		<!-- Error: Show error with retry hint -->
		<template v-else-if="status === 'error'">
			<Icon name="heroicons:exclamation-circle" class="h-4 w-4 text-red-500" />
			<span class="text-red-500">Save failed</span>
		</template>
	</div>
</template>
