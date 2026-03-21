<script setup lang="ts">
	import type { SubmissionEntranceEvent } from "~/types/submission-timeline";

	type Props = {
		entrances: SubmissionEntranceEvent[];
	};

	const props = defineProps<Props>();

	const sortedEntrances = computed(() => {
		return [...props.entrances].sort(
			(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
		);
	});

	function formatDate(date: Date): string {
		return new Date(date).toLocaleDateString("he-IL", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
		});
	}

	function formatTime(date: Date): string {
		return new Date(date).toLocaleTimeString("he-IL", {
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	}
</script>

<template>
	<div v-if="sortedEntrances.length" class="mt-8 pt-8 border-t border-[rgb(var(--fill-border))]">
		<h2 class="text-2xl font-bold text-[rgb(var(--fill-text-primary))] mb-6">כניסות לטופס</h2>

		<div class="flex flex-col gap-3">
			<div
				v-for="(event, index) in sortedEntrances"
				:key="index"
				class="p-4 bg-gray-100 rounded-md print:break-inside-avoid"
			>
				<!-- Date & Time — highest visual hierarchy -->
				<div class="flex items-center gap-3 mb-1.5">
					<span class="text-xs font-bold text-[rgb(var(--fill-text-primary))]">
						<span class="font-semibold text-gray-500">תאריך:</span>
						{{ formatDate(event.timestamp) }}
					</span>
					<span
						class="text-xs font-semibold font-mono text-[rgb(var(--fill-text-primary))]"
					>
						<span class="font-semibold text-gray-500">שעה:</span>
						{{ formatTime(event.timestamp) }}
					</span>
					<span
						v-if="event.isFormLocked"
						class="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full"
					>
						נעול
					</span>
				</div>

				<!-- Meta details — subdued -->
				<div class="flex flex-col gap-1 text-xs text-gray-400">
					<div v-if="event.ipAddress" class="flex gap-1">
						<span class="font-semibold text-gray-500 shrink-0">IP:</span>
						<span>{{ event.ipAddress }}</span>
					</div>
					<div v-if="event.userAgent" class="flex gap-1">
						<span class="font-semibold text-gray-500 shrink-0">User Agent:</span>
						<span class="font-mono break-all">{{ event.userAgent }}</span>
					</div>
					<div v-if="event.referrer" class="flex gap-1">
						<span class="font-semibold text-gray-500 shrink-0">Referrer:</span>
						<span class="font-mono break-all">{{ event.referrer }}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
