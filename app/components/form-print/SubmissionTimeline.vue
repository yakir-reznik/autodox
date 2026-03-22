<template>
	<div class="mt-12 pt-8 border-t-1 border-[rgb(var(--fill-border))]">
		<!-- Timeline Section -->
		<h2 class="text-2xl font-bold text-[rgb(var(--fill-text-primary))] mb-6">
			ציר זמן של ההגשה
		</h2>

		<div class="space-y-6 border-r-2 border-dashed border-gray-300">
			<div
				v-for="(event, index) in timelineEvents"
				:key="index"
				class="relative w-full print:break-inside-avoid"
			>
				<!-- Icon in circle -->
				<div
					class="absolute -top-0.5 z-10 -mr-4.5 h-9 w-9 rounded-full flex items-center justify-center"
					:class="eventSetup[getEventKey(event)]?.themeClasses"
				>
					<Icon :name="eventSetup[getEventKey(event)]?.icon ?? ''" class="size-5" />
				</div>

				<!-- Content -->
				<div class="mr-8">
					<span class="text-sm font-mono text-[rgb(var(--fill-text-secondary))]">{{
						formatTimestamp(event.timestamp)
					}}</span>
					<h4 class="mt-1 font-bold text-[rgb(var(--fill-text-primary))]">
						{{ eventSetup[getEventKey(event)]?.label }}
					</h4>

					<!-- Webhook details -->
					<div
						v-if="event.type === 'webhook'"
						class="mt-2 p-3 bg-[rgb(var(--fill-bg-input))] border border-[rgb(var(--fill-border))] rounded-md flex flex-col gap-1"
					>
						<div class="flex gap-2 text-sm">
							<span
								class="font-semibold text-[rgb(var(--fill-text-secondary))] min-w-30"
								>URL:</span
							>
							<span class="font-mono break-all">{{ event.webhookUrl }}</span>
						</div>
						<div class="flex gap-2 text-sm">
							<span
								class="font-semibold text-[rgb(var(--fill-text-secondary))] min-w-30"
								>סטטוס:</span
							>
							<span
								:class="{
									'text-green-600': event.status === 'delivered',
									'text-red-600': event.status === 'failed',
									'text-yellow-600': event.status === 'pending',
								}"
							>
								{{ event.status }}
							</span>
						</div>
						<div v-if="event.httpStatusCode" class="flex gap-2 text-sm">
							<span
								class="font-semibold text-[rgb(var(--fill-text-secondary))] min-w-30"
								>HTTP Status Code:</span
							>
							<span>{{ event.httpStatusCode }}</span>
						</div>
						<div v-if="event.errorMessage" class="flex gap-2 text-sm">
							<span
								class="font-semibold text-[rgb(var(--fill-text-secondary))] min-w-30"
								>שגיאה:</span
							>
							<span class="text-red-600">{{ event.errorMessage }}</span>
						</div>
						<div class="flex gap-2 text-sm">
							<span
								class="font-semibold text-[rgb(var(--fill-text-secondary))] min-w-30"
								>ניסיונות:</span
							>
							<span>{{ event.retryCount + 1 }}</span>
						</div>
						<div v-if="event.deliveredAt" class="flex gap-2 text-sm">
							<span
								class="font-semibold text-[rgb(var(--fill-text-secondary))] min-w-30"
								>נשלח בהצלחה ב:</span
							>
							<span>{{ formatTimestamp(event.deliveredAt) }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { SubmissionTimelineEvent } from "~/types/submission-timeline";

	type Props = {
		submissionTimeline: SubmissionTimelineEvent[];
	};

	const props = defineProps<Props>();

	const eventSetup: Record<string, { label: string; icon: string; themeClasses: string }> = {
		created: {
			label: "נוצר",
			icon: "heroicons:document-plus-solid",
			themeClasses: "bg-purple-100 text-purple-600",
		},
		started: {
			label: "המשתמש התחיל למלא",
			icon: "heroicons:pencil-solid",
			themeClasses: "bg-green-100 text-green-600",
		},
		submitted: {
			label: "הוגש",
			icon: "heroicons:check-circle-solid",
			themeClasses: "bg-sky-100 text-sky-600",
		},
		locked: {
			label: "ננעל",
			icon: "heroicons:lock-closed-solid",
			themeClasses: "bg-amber-100 text-amber-600",
		},
		expires: {
			label: "יפוג",
			icon: "heroicons:clock-solid",
			themeClasses: "bg-orange-100 text-orange-600",
		},
		"webhook-delivered": {
			label: "משלוח Webhook",
			icon: "heroicons:check-circle-solid",
			themeClasses: "bg-emerald-100 text-emerald-600",
		},
		"webhook-failed": {
			label: "משלוח Webhook",
			icon: "heroicons:x-circle-solid",
			themeClasses: "bg-red-100 text-red-600",
		},
		"webhook-pending": {
			label: "משלוח Webhook",
			icon: "heroicons:clock-solid",
			themeClasses: "bg-yellow-100 text-yellow-600",
		},
	};

	function getEventKey(event: SubmissionTimelineEvent): string {
		if (event.type === "lifecycle") return event.event;
		if (event.type === "webhook") return `webhook-${event.status}`;
		return "";
	}

	function formatTimestamp(date: Date): string {
		return new Date(date).toLocaleString("he-IL", {
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	}

	const timelineEvents = computed(() => {
		return [...props.submissionTimeline]
			.filter((e) => e.type !== "entrance")
			.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
	});
</script>
