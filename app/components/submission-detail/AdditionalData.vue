<template>
	<div class="mb-8 overflow-hidden rounded-lg bg-white shadow">
		<div
			class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3"
		>
			<h2 class="text-lg font-medium text-gray-900">Additional Data</h2>
			<BaseCopyButton
				v-if="submission.additionalData"
				:text="JSON.stringify(submission.additionalData, null, 2)"
				variant="ghost"
			/>
		</div>
		<div v-if="submission.additionalData" dir="ltr" class="overflow-x-auto p-4 text-sm [&_.shiki]:bg-transparent!">
			<Shiki lang="json" :code="JSON.stringify(submission.additionalData, null, 2)" />
		</div>
		<div v-else class="p-4 text-center text-sm text-gray-500">
			No additional data
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { Submission } from "~/types/Submission";

	defineProps<{
		submission: Submission;
	}>();
</script>
