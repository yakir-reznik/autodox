<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";
import type { SubmissionTimelineEvent } from "~/types/submission-timeline";
import FormField from "~/components/form-fill/FormField.vue";

type FormMetadata = {
	title: string;
	description: string | null;
	theme: string;
};

type Props = {
	form: FormMetadata;
	elements: BuilderElement[];
	values: Record<string, any>;
	submissionTimeline: SubmissionTimelineEvent[];
};

const props = defineProps<Props>();

// Get root elements (no parent)
const rootElements = computed(() => {
	return props.elements.filter((el) => !el.parentId);
});

// Get children of a parent element
function getChildElements(parentClientId: string): BuilderElement[] {
	return props.elements
		.filter((el) => el.parentId === parentClientId)
		.sort((a, b) => a.position - b.position);
}

// Format timestamp for display
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

// Get event label in Hebrew
function getEventLabel(event: SubmissionTimelineEvent): string {
	if (event.type === "lifecycle") {
		switch (event.event) {
			case "created":
				return "נוצר";
			case "started":
				return "התחיל";
			case "submitted":
				return "נשלח";
			case "locked":
				return "ננעל";
			case "expires":
				return "יפוג";
			default:
				return event.event;
		}
	} else if (event.type === "entrance") {
		return "כניסה לטופס";
	} else if (event.type === "webhook") {
		return "משלוח Webhook";
	}
	return "";
}

// Sort timeline events chronologically
const sortedTimeline = computed(() => {
	return [...props.submissionTimeline].sort(
		(a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
	);
});
</script>

<template>
	<div class="form-print-container">
		<!-- Header -->
		<header class="form-fill-header">
			<h1 class="form-fill-title">{{ form.title }}</h1>
			<p v-if="form.description" class="form-fill-description">
				{{ form.description }}
			</p>
		</header>

		<!-- Form Elements (Read-only) -->
		<div class="form-fill-elements">
			<FormField
				v-for="element in rootElements"
				:key="element.clientId"
				:element="element"
				:get-children="getChildElements"
				:model-value="values[element.clientId]"
				:form-data="values"
				:errors="{}"
				:readonly="true"
			/>
		</div>

		<!-- Submission Timeline -->
		<div class="form-print-timeline">
			<h2 class="form-print-timeline-title">ציר זמן של ההגשה</h2>

			<div class="form-print-timeline-events">
				<div
					v-for="(event, index) in sortedTimeline"
					:key="index"
					class="form-print-timeline-event"
					:class="`event-${event.type}`"
				>
					<div class="event-header">
						<span class="event-label">{{ getEventLabel(event) }}</span>
						<span class="event-timestamp">{{ formatTimestamp(event.timestamp) }}</span>
					</div>

					<!-- Lifecycle event details -->
					<div v-if="event.type === 'lifecycle' && event.status" class="event-details">
						<span class="detail-label">סטטוס:</span>
						<span>{{ event.status }}</span>
					</div>

					<!-- Entrance event details -->
					<div v-if="event.type === 'entrance'" class="event-details">
						<div v-if="event.ipAddress" class="detail-row">
							<span class="detail-label">כתובת IP:</span>
							<span>{{ event.ipAddress }}</span>
						</div>
						<div v-if="event.userAgent" class="detail-row">
							<span class="detail-label">User Agent:</span>
							<span class="detail-value-mono">{{ event.userAgent }}</span>
						</div>
						<div v-if="event.referrer" class="detail-row">
							<span class="detail-label">Referrer:</span>
							<span class="detail-value-mono">{{ event.referrer }}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">טופס נעול:</span>
							<span>{{ event.isFormLocked ? "כן" : "לא" }}</span>
						</div>
					</div>

					<!-- Webhook event details -->
					<div v-if="event.type === 'webhook'" class="event-details">
						<div class="detail-row">
							<span class="detail-label">URL:</span>
							<span class="detail-value-mono">{{ event.webhookUrl }}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">סטטוס:</span>
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
						<div v-if="event.httpStatusCode" class="detail-row">
							<span class="detail-label">HTTP Status Code:</span>
							<span>{{ event.httpStatusCode }}</span>
						</div>
						<div v-if="event.errorMessage" class="detail-row">
							<span class="detail-label">שגיאה:</span>
							<span class="text-red-600">{{ event.errorMessage }}</span>
						</div>
						<div class="detail-row">
							<span class="detail-label">ניסיונות:</span>
							<span>{{ event.retryCount + 1 }}</span>
						</div>
						<div v-if="event.deliveredAt" class="detail-row">
							<span class="detail-label">נשלח בהצלחה ב:</span>
							<span>{{ formatTimestamp(event.deliveredAt) }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
/* Container matches form-fill-card layout */
.form-print-container {
	max-width: 800px;
	margin: 2rem auto;
	padding: 2rem;
	background: rgb(var(--fill-bg-card));
	border-radius: 0.5rem;
	box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

/* Timeline Section */
.form-print-timeline {
	margin-top: 3rem;
	padding-top: 2rem;
	border-top: 2px solid rgb(var(--fill-border));
}

.form-print-timeline-title {
	font-size: 1.5rem;
	font-weight: 700;
	color: rgb(var(--fill-text-primary));
	margin-bottom: 1.5rem;
}

.form-print-timeline-events {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.form-print-timeline-event {
	padding: 1rem;
	background: rgb(var(--fill-bg-input));
	border: 1px solid rgb(var(--fill-border));
	border-radius: 0.375rem;
}

.event-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 0.5rem;
	font-weight: 600;
}

.event-label {
	color: rgb(var(--fill-text-primary));
	font-size: 1rem;
}

.event-timestamp {
	color: rgb(var(--fill-text-secondary));
	font-size: 0.875rem;
	font-family: monospace;
}

.event-details {
	margin-top: 0.75rem;
	padding-top: 0.75rem;
	border-top: 1px solid rgb(var(--fill-border));
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
}

.detail-row {
	display: flex;
	gap: 0.5rem;
	font-size: 0.875rem;
}

.detail-label {
	font-weight: 600;
	color: rgb(var(--fill-text-secondary));
	min-width: 120px;
}

.detail-value-mono {
	font-family: monospace;
	word-break: break-all;
}

/* Event type color coding */
.event-lifecycle {
	border-right: 4px solid rgb(59 130 246);
}

.event-entrance {
	border-right: 4px solid rgb(16 185 129);
}

.event-webhook {
	border-right: 4px solid rgb(168 85 247);
}

/* Print-specific styles */
@media print {
	.form-print-container {
		max-width: 100%;
		margin: 0;
		padding: 1rem;
		box-shadow: none;
		background: white;
	}

	.form-print-timeline-event {
		page-break-inside: avoid;
	}

	/* Hide scrollbars */
	::-webkit-scrollbar {
		display: none;
	}

	body {
		-ms-overflow-style: none;
		scrollbar-width: none;
	}

	/* Adjust margins for print */
	@page {
		margin: 1.5cm;
	}
}
</style>
