<template>
	<!-- Submission Data -->
	<div v-if="submission.submissionData" class="mb-8 overflow-hidden rounded-lg bg-white shadow">
		<div
			class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3"
		>
			<h2 class="text-lg font-medium text-gray-900">Submitted Data</h2>
			<BaseCopyButton
				:text="JSON.stringify(submission.submissionData, null, 2)"
				variant="ghost"
			/>
		</div>
		<div class="relative">
			<div dir="ltr" class="overflow-x-auto p-4 text-sm [&_.shiki]:bg-transparent!">
				<Shiki lang="json" :code="visibleSubmissionData" />
			</div>
			<div
				v-if="submissionDataLines.length > 10 && !isSubmissionDataExpanded"
				class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent"
			/>
		</div>
		<button
			v-if="submissionDataLines.length > 10"
			class="w-full cursor-pointer border-t border-gray-100 py-2.5 text-center text-sm text-blue-600 transition hover:bg-gray-50"
			@click="isSubmissionDataExpanded = !isSubmissionDataExpanded"
		>
			{{
				isSubmissionDataExpanded
					? "הצג פחות"
					: `הצג עוד (${submissionDataLines.length - 10} שורות נוספות)`
			}}
		</button>
	</div>
</template>

<script setup lang="ts">
	import type { Submission } from "~/types/Submission";
	const props = defineProps<{
		submission: Submission;
	}>();

	const isSubmissionDataExpanded = ref(false);

	const submissionDataLines = computed(() => {
		if (!props.submission?.submissionData) return [];
		return JSON.stringify(props.submission.submissionData, null, 2).split("\n");
	});

	const visibleSubmissionData = computed(() => {
		const lines = submissionDataLines.value;
		if (isSubmissionDataExpanded.value || lines.length <= 10) return lines.join("\n");
		return lines.slice(0, 10).join("\n");
	});
</script>
