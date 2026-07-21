<template>
	<div
		v-if="pagination && pagination.totalPages > 1"
		class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
	>
		<div class="text-sm text-gray-600">
			עמוד
			<span class="font-medium">{{ pagination.page }}</span>
			מתוך
			<span class="font-medium">{{ pagination.totalPages }}</span>
			(סה״כ:
			<span class="font-medium">{{ pagination.total }}</span>
			{{ entityLabel }})
		</div>

		<div class="flex flex-wrap gap-2">
			<BaseButton
				variant="secondary"
				size="sm"
				:disabled="!pagination.hasPreviousPage"
				@click="handlePreviousPage"
			>
				<Icon name="heroicons:arrow-right" class="h-4 w-4" />
				הקודם
			</BaseButton>

			<div class="flex gap-1">
				<UiButton
					v-for="(pg, index) in paginationPages"
					:key="`${pg}-${index}`"
					:disabled="pg === '...'"
					:variant="pg === pagination.page ? 'default' : 'outline'"
					size="sm"
					@click="pg !== '...' && goToPage(Number(pg))"
				>
					{{ pg }}
				</UiButton>
			</div>

			<BaseButton
				variant="secondary"
				size="sm"
				:disabled="!pagination.hasNextPage"
				@click="handleNextPage"
			>
				הבא
				<Icon name="heroicons:arrow-left" class="h-4 w-4" />
			</BaseButton>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { FormListPaginationInfo } from "~/types/FormListItem";

	const props = withDefaults(
		defineProps<{
			pagination?: FormListPaginationInfo;
			entityLabel?: string;
		}>(),
		{
			entityLabel: "טפסים",
		},
	);

	const page = defineModel<number>("page", { required: true });

	function handlePreviousPage() {
		if (props.pagination?.hasPreviousPage) {
			page.value--;
		}
	}

	function handleNextPage() {
		if (props.pagination?.hasNextPage) {
			page.value++;
		}
	}

	function goToPage(p: number) {
		page.value = p;
	}

	const paginationPages = computed(() => {
		if (!props.pagination) return [];

		const totalPages = props.pagination.totalPages;
		const currentPageNum = props.pagination.page;
		const pages: (number | string)[] = [1];
		const start = Math.max(2, currentPageNum - 1);
		const end = Math.min(totalPages - 1, currentPageNum + 1);

		if (start > 2) {
			pages.push("...");
		}

		for (let i = start; i <= end; i++) {
			if (i !== 1 && i !== totalPages) {
				pages.push(i);
			}
		}

		if (end < totalPages - 1) {
			pages.push("...");
		}

		if (totalPages > 1 && !pages.includes(totalPages)) {
			pages.push(totalPages);
		}

		return pages;
	});
</script>
