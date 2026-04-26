<script setup lang="ts">
	type Props = {
		link: string;
		formId: number;
	};

	defineProps<Props>();
	const emit = defineEmits<{ close: [] }>();
</script>

<template>
	<div class="px-8 py-6 space-y-6">
		<div class="flex flex-col items-center gap-3 text-center">
			<div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
				<Icon name="heroicons:check" class="h-6 w-6 text-green-600" />
			</div>
			<div>
				<p class="text-base font-semibold text-gray-900">ההגשה נוצרה בהצלחה</p>
				<p class="mt-1 text-sm text-gray-500">הקישור תקף ל-14 ימים</p>
			</div>
		</div>

		<div
			class="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 font-mono break-all dir-ltr text-left"
		>
			{{ link }}
		</div>

		<div class="flex gap-2">
			<a
				:href="link"
				target="_blank"
				rel="noopener noreferrer"
				class="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-xs hover:bg-gray-50 transition-colors"
			>
				<Icon name="heroicons:arrow-top-right-on-square" class="h-4 w-4" />
				צפה בהגשה
			</a>
			<BaseCopyButton :text="link" class="flex-1 justify-center">
				העתק קישור
				<Icon name="heroicons:link" class="h-4 w-4" />
			</BaseCopyButton>
		</div>

		<NuxtLink
			:to="`/manage/submissions/form/${formId}`"
			class="flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
			@click="emit('close')"
		>
			<Icon name="heroicons:list-bullet" class="h-4 w-4" />
			כל ההגשות של הטופס
		</NuxtLink>
	</div>
</template>
