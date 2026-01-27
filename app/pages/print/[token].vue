<script setup lang="ts">
	import FormPrint from "~/components/form-print/FormPrint.vue";
	import type { BuilderElement } from "~/types/form-builder";
	import type { SubmissionTimelineEvent } from "~/types/submission-timeline";
	import { getThemeDefinition } from "~/composables/useThemes";

	const route = useRoute();
	const token = computed(() => String(route.params.token));

	definePageMeta({
		layout: "print",
	});

	// Validate token
	if (!token.value) {
		throw createError({
			statusCode: 400,
			message: "Submission token is required",
		});
	}

	// Fetch submission data with form, elements, and timeline
	// Note: During SSR, useFetch automatically forwards request headers including X-Puppeteer-Secret
	const { data: response, error } = await useFetch<{
		data: {
			submission: any;
			form: any;
			elements: any[];
			submissionTimeline: SubmissionTimelineEvent[];
		};
	}>(`/api/submissions/${token.value}/details`, {
		query: {
			include: "form,elements,submissionTimeline",
		},
	});

	if (error.value || !response.value) {
		throw createError({
			statusCode: error.value?.statusCode || 500,
			message: error.value?.message || "Failed to load submission data",
		});
	}

	const apiData = response.value.data;
	const submission = apiData.submission;
	const form = apiData.form;
	const elements = apiData.elements;
	const submissionTimeline = apiData.submissionTimeline;

	// Validate required data
	if (!submission || !form || !elements || !submissionTimeline) {
		throw createError({
			statusCode: 500,
			message: "Incomplete submission data",
		});
	}

	// Transform elements to BuilderElement format
	const transformedElements = computed<BuilderElement[]>(() => {
		return elements
			.map((element: any) => ({
				id: element.id,
				clientId: `el_${element.id}`,
				type: element.type,
				position: parseFloat(element.position),
				parentId: element.parentId ? `el_${element.parentId}` : null,
				name: element.name,
				config: element.config,
				isRequired: element.isRequired,
			}))
			.sort((a: BuilderElement, b: BuilderElement) => a.position - b.position);
	});

	// Create a map of field names to clientIds for transformation
	const nameToClientIdMap = computed(() => {
		const map: Record<string, string> = {};
		transformedElements.value.forEach((element) => {
			if (element.name) {
				map[element.name] = element.clientId;
			}
		});
		return map;
	});

	// Transform values from field names to clientIds
	const transformedValues = computed<Record<string, any>>(() => {
		// Merge prefillData and submissionData (submissionData takes precedence)
		const mergedData = {
			...(submission.prefillData || {}),
			...(submission.submissionData || {}),
		};

		const result: Record<string, any> = {};

		// Transform each key-value pair
		for (const [key, value] of Object.entries(mergedData)) {
			const clientId = nameToClientIdMap.value[key];

			if (clientId) {
				// Find the element to check if it's a repeater
				const element = transformedElements.value.find((el) => el.clientId === clientId);

				if (element && element.type === "repeater" && Array.isArray(value)) {
					// Transform repeater items: convert nested field names to clientIds
					result[clientId] = value.map((item: any) => {
						if (typeof item === "object" && item !== null) {
							const transformedItem: Record<string, any> = {};

							for (const [itemKey, itemValue] of Object.entries(item)) {
								const childClientId = nameToClientIdMap.value[itemKey];
								if (childClientId) {
									transformedItem[childClientId] = itemValue;
								} else {
									// Keep the key as-is if no mapping found
									transformedItem[itemKey] = itemValue;
								}
							}

							return transformedItem;
						}
						return item;
					});
				} else {
					// Regular element, just map the value
					result[clientId] = value;
				}
			}
		}

		return result;
	});

	// Compute theme CSS file path
	const themeCssPath = computed(() => {
		const themeId = form.theme || "default";
		return getThemeDefinition(themeId).cssFile;
	});

	// Dynamically inject theme CSS
	useHead(() => ({
		title: `${form.title} - Print View`,
		link: [
			{
				rel: "stylesheet",
				href: themeCssPath.value,
			},
		],
	}));
</script>

<template>
	<div dir="rtl" class="print-page-wrapper">
		<FormPrint
			:form="form"
			:elements="transformedElements"
			:values="transformedValues"
			:submission-timeline="submissionTimeline"
		/>
	</div>
</template>

<style scoped>
	.print-page-wrapper {
		min-height: 100vh;
		background: rgb(var(--fill-bg-page, 249 250 251));
	}

	/* Print-specific styles */
	@media print {
		.print-page-wrapper {
			min-height: 0;
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

		/* Adjust page margins */
		@page {
			margin: 1.5cm;
		}
	}
</style>
