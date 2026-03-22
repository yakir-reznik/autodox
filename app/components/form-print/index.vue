<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";
	import type {
		SubmissionTimelineEvent,
		SubmissionEntranceEvent,
	} from "~/types/submission-timeline";
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

	const entranceEvents = computed<SubmissionEntranceEvent[]>(() => {
		return props.submissionTimeline.filter(
			(e): e is SubmissionEntranceEvent => e.type === "entrance",
		);
	});

	provide("formElements", computed(() => props.elements));

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
		<FormPrintSubmissionTimeline :submission-timeline="submissionTimeline" />

		<!-- Entrance Log -->
		<FormPrintSubmissionEntranceLog :entrances="entranceEvents" />
	</div>
</template>

<style scoped>
	/* Container matches form-fill-card layout */
	.form-print-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		background: rgb(var(--fill-bg-card));
		border-radius: 0.5rem;
		box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
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
