<template>
	<div class="mb-8 overflow-hidden rounded-lg bg-white shadow">
		<div
			class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3"
		>
			<h2 class="text-lg font-medium text-gray-900">Prefill Data</h2>
			<BaseCopyButton
				v-if="submission.prefillData"
				:text="JSON.stringify(sortKeys(submission.prefillData!), null, 2)"
				variant="ghost"
			/>
		</div>
		<div v-if="submission.prefillData" class="relative">
			<div dir="ltr" class="overflow-x-auto p-4 text-sm [&_.shiki]:bg-transparent!">
				<Shiki lang="json" :code="visiblePrefillData" />
			</div>
			<div
				v-if="prefillDataLines.length > 10 && !isPrefillDataExpanded"
				class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent"
			/>
		</div>
		<div v-else class="p-4 text-center text-sm text-gray-500">
			No prefill data
		</div>
		<button
			v-if="submission.prefillData && prefillDataLines.length > 10"
			class="w-full cursor-pointer border-t border-gray-100 py-2.5 text-center text-sm text-blue-600 transition hover:bg-gray-50"
			@click="isPrefillDataExpanded = !isPrefillDataExpanded"
		>
			{{
				isPrefillDataExpanded
					? "הצג פחות"
					: `הצג עוד (${prefillDataLines.length - 10} שורות נוספות)`
			}}
		</button>
	</div>
</template>

<script setup lang="ts">
	import type { Submission } from "~/types/Submission";

	const props = defineProps<{
		submission: Submission;
	}>();

	const isPrefillDataExpanded = ref(false);

	const sortKeys = (obj: Record<string, unknown>): Record<string, unknown> =>
		Object.fromEntries(
			Object.keys(obj)
				.sort()
				.map((k) => [k, obj[k]]),
		);

	const prefillDataLines = computed(() => {
		if (!props.submission?.prefillData) return [];
		return JSON.stringify(sortKeys(props.submission.prefillData), null, 2).split("\n");
	});

	const visiblePrefillData = computed(() => {
		const lines = prefillDataLines.value;
		if (isPrefillDataExpanded.value || lines.length <= 10) return lines.join("\n");
		return lines.slice(0, 10).join("\n");
	});
</script>
