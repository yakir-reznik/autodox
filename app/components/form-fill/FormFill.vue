<script setup lang="ts">
	import type { FormWithElements, BuilderElement, ElementType } from "~/types/form-builder";
	import { isFieldElement } from "~/composables/useElementDefaults";
	import FormField from "./FormField.vue";

	interface Props {
		formId: number;
		sessionId?: string | null;
		token?: string | null;
	}

	const props = defineProps<Props>();

	// Fetch form data (include token if present)
	const {
		data: form,
		pending,
		error,
	} = await useFetch<FormWithElements & { prefillData?: Record<string, any> | null }>(
		`/api/forms/${props.formId}`,
		{
			query: {
				...(props.token && { token: props.token }),
			},
		}
	);

	// Track form entrance when form loads successfully
	onMounted(async () => {
		if (form.value && !error.value) {
			try {
				await $fetch(`/api/forms/${props.formId}/entrances`, {
					method: "POST",
					body: {
						sessionToken: props.sessionId,
					},
				});
			} catch (err) {
				// Silently fail - entrance tracking shouldn't block form usage
				console.error("Failed to track form entrance:", err);
			}
		}

		// Apply prefill data if available
		if (form.value?.prefillData) {
			Object.entries(form.value.prefillData).forEach(([fieldName, value]) => {
				// Find element by name and map to clientId
				const element = allElements.value.find((el) => el.name === fieldName);
				if (element) {
					formData[element.clientId] = value;
				}
			});
		}
	});

	// Check if form is published
	const isPublished = computed(() => form.value?.status === "published");

	// Form data storage (keyed by element id)
	const formData = reactive<Record<string, any>>({});

	// Validation errors (keyed by element id)
	const errors = reactive<Record<string, string>>({});

	// Submission state
	const isSubmitting = ref(false);
	const isSubmitted = ref(false);

	// Convert server elements to client format with hierarchy
	const allElements = computed((): BuilderElement[] => {
		if (!form.value) return [];

		return form.value.elements
			.filter((el) => !el.isDeleted)
			.map((el) => ({
				id: el.id,
				clientId: `el_${el.id}`,
				type: el.type as ElementType,
				position: parseFloat(el.position),
				parentId: el.parentId ? `el_${el.parentId}` : null,
				name: el.name,
				config: el.config,
				isRequired: el.isRequired,
			}))
			.sort((a, b) => a.position - b.position);
	});

	// Get root elements (no parent)
	const rootElements = computed(() => {
		const roots = allElements.value.filter((el) => !el.parentId);
		console.log("Form data:", form.value);
		console.log("All elements:", allElements.value);
		console.log("Root elements:", roots);
		return roots;
	});

	// Get children of a parent element
	function getChildElements(parentClientId: string): BuilderElement[] {
		return allElements.value
			.filter((el) => el.parentId === parentClientId)
			.sort((a, b) => a.position - b.position);
	}

	// Update form data for an element
	function updateFormData(clientId: string, value: any) {
		formData[clientId] = value;
		// Clear error when value changes
		if (errors[clientId]) {
			delete errors[clientId];
		}
	}

	// Validate a single field
	function validateField(clientId: string): boolean {
		const element = allElements.value.find((el) => el.clientId === clientId);
		if (!element || !isFieldElement(element.type)) return true;

		const config = element.config as {
			label?: string;
			validation?: {
				required?: boolean;
				minLength?: number;
				maxLength?: number;
				min?: number;
				max?: number;
				pattern?: string;
				customMessage?: string;
			};
		};

		const value = formData[clientId];

		// Required validation
		if (element.isRequired || config.validation?.required) {
			if (
				value === undefined ||
				value === null ||
				value === "" ||
				(Array.isArray(value) && value.length === 0)
			) {
				errors[clientId] = config.validation?.customMessage || "This field is required";
				return false;
			}
		}

		// Skip further validation if empty and not required
		if (!value) {
			delete errors[clientId];
			return true;
		}

		// MinLength validation
		if (
			config.validation?.minLength &&
			typeof value === "string" &&
			value.length < config.validation.minLength
		) {
			errors[clientId] = `Minimum ${config.validation.minLength} characters required`;
			return false;
		}

		// MaxLength validation
		if (
			config.validation?.maxLength &&
			typeof value === "string" &&
			value.length > config.validation.maxLength
		) {
			errors[clientId] = `Maximum ${config.validation.maxLength} characters allowed`;
			return false;
		}

		// Min validation (for numbers)
		if (
			config.validation?.min !== undefined &&
			typeof value === "number" &&
			value < config.validation.min
		) {
			errors[clientId] = `Minimum value is ${config.validation.min}`;
			return false;
		}

		// Max validation (for numbers)
		if (
			config.validation?.max !== undefined &&
			typeof value === "number" &&
			value > config.validation.max
		) {
			errors[clientId] = `Maximum value is ${config.validation.max}`;
			return false;
		}

		// Pattern validation
		if (config.validation?.pattern && typeof value === "string") {
			const regex = new RegExp(config.validation.pattern);
			if (!regex.test(value)) {
				errors[clientId] = config.validation.customMessage || "Invalid format";
				return false;
			}
		}

		delete errors[clientId];
		return true;
	}

	// Validate all fields
	function validateAll(): boolean {
		let isValid = true;

		for (const element of allElements.value) {
			if (isFieldElement(element.type)) {
				if (!validateField(element.clientId)) {
					isValid = false;
				}
			}
		}

		return isValid;
	}

	// Submit handler (placeholder - not saving to database yet)
	async function handleSubmit() {
		if (!validateAll()) {
			return;
		}

		isSubmitting.value = true;

		// Simulate submission delay
		await new Promise((resolve) => setTimeout(resolve, 1000));

		// For now, just mark as submitted
		// In the future, this would POST to /api/forms/{id}/submissions
		console.log("Form data:", formData);

		isSubmitting.value = false;
		isSubmitted.value = true;
	}
</script>

<template>
	<div class="form-fill-container">
		<!-- Loading state -->
		<div v-if="pending" class="form-fill-loading">
			<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
		</div>

		<!-- Error state (not found) -->
		<div v-else-if="error" class="form-fill-card">
			<div class="form-fill-error-state">
				<Icon name="heroicons:exclamation-circle" class="mx-auto h-12 w-12 text-red-500" />
				<h2 class="form-fill-error-title">Form Not Found</h2>
				<p class="form-fill-error-message">
					The form you are looking for does not exist or has been removed.
				</p>
			</div>
		</div>

		<!-- Not published error -->
		<div v-else-if="!isPublished" class="form-fill-card">
			<div class="form-fill-error-state">
				<Icon name="heroicons:lock-closed" class="mx-auto h-12 w-12 text-gray-400" />
				<h2 class="form-fill-error-title" style="color: rgb(var(--fill-text-primary))">
					Form Not Available
				</h2>
				<p class="form-fill-error-message">
					This form is not currently accepting submissions.
				</p>
			</div>
		</div>

		<!-- Success state -->
		<div v-else-if="isSubmitted" class="form-fill-card">
			<div class="form-fill-success">
				<Icon name="heroicons:check-circle" class="form-fill-success-icon" />
				<h2 class="form-fill-success-title">Thank You!</h2>
				<p class="form-fill-success-message">Your submission has been received.</p>
			</div>
		</div>

		<!-- Form -->
		<form v-else class="form-fill-card" @submit.prevent="handleSubmit">
			<!-- Navigation -->
			<div class="text-center mb-8 my-4">
				<NuxtLink to="/" class="form-fill-back-link form-fill-button rounded px-4 py-2">
					<Icon name="heroicons:arrow-left" class="inline h-4 w-4 mr-1" />
					לעמוד הבית
				</NuxtLink>
			</div>

			<!-- Header -->
			<header class="form-fill-header">
				<h1 class="form-fill-title">{{ form?.title }}</h1>
				<p v-if="form?.description" class="form-fill-description">
					{{ form.description }}
				</p>
			</header>

			<!-- Elements -->
			<div class="form-fill-elements">
				<FormField
					v-for="element in rootElements"
					:key="element.clientId"
					:element="element"
					:get-children="getChildElements"
					:model-value="formData[element.clientId]"
					:error="errors[element.clientId]"
					:form-data="formData"
					:errors="errors"
					@update:model-value="updateFormData(element.clientId, $event)"
					@blur="validateField(element.clientId)"
				/>
			</div>

			<!-- Footer -->
			<footer class="form-fill-footer">
				<button type="submit" class="form-fill-submit" :disabled="isSubmitting">
					<template v-if="isSubmitting">
						<Icon name="svg-spinners:ring-resize" class="inline h-4 w-4" />
						Submitting...
					</template>
					<template v-else> Submit </template>
				</button>
			</footer>
		</form>
	</div>
</template>
