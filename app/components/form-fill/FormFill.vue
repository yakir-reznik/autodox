<script setup lang="ts">
	import type { FormWithElements, BuilderElement, ElementType } from "~/types/form-builder";
	import { isFieldElement } from "~/composables/useElementDefaults";
	import FormField from "./FormField.vue";

	interface Props {
		formId: number;
		token?: string | null;
	}

	const props = defineProps<Props>();

	// Type for password-protected response
	type FormResponse =
		| (FormWithElements & {
				prefillData?: Record<string, any> | null;
				submissionStatus?: string | null;
				isLocked?: boolean;
				hasPassword?: boolean;
				requiresPassword?: false;
		  })
		| {
				id: number;
				title: string;
				hasPassword: true;
				requiresPassword: true;
		  };

	// Fetch form data (include token if present)
	const {
		data: form,
		pending,
		error,
		refresh: refreshForm,
	} = await useFetch<FormResponse>(`/api/forms/${props.formId}`, {
		query: {
			...(props.token && { token: props.token }),
		},
	});

	// Check if password is required
	const requiresPassword = computed(() => {
		return form.value && "requiresPassword" in form.value && form.value.requiresPassword === true;
	});

	// Handle password verification
	async function handlePasswordVerified() {
		await refreshForm();
	}

	// Track form entrance when form loads successfully
	onMounted(async () => {
		if (form.value && !error.value) {
			// Skip if password is required
			if (requiresPassword.value) {
				return;
			}

			// Check if submission is already locked (only available on full form response)
			if ("isLocked" in form.value && form.value.isLocked) {
				isAlreadyLocked.value = true;
				return; // Don't proceed with tracking or prefill
			}

			try {
				await $fetch(`/api/forms/${props.formId}/entrances`, {
					method: "POST",
					body: {
						sessionToken: props.token,
					},
				});
			} catch (err) {
				// Silently fail - entrance tracking shouldn't block form usage
				console.error("Failed to track form entrance:", err);
			}

			// Mark submission as started if we have a token and it's not already locked
			if (props.token && !form.value.isLocked) {
				try {
					await $fetch(`/api/submissions/${props.token}/start`, {
						method: "POST",
					});
				} catch (err) {
					console.error("Failed to mark submission as started:", err);
				}
			}
		}

		// Apply prefill data if available (only on full form response)
		if (form.value && "prefillData" in form.value && form.value.prefillData) {
			Object.entries(form.value.prefillData).forEach(([fieldName, value]) => {
				// Find element by name and map to clientId
				const element = allElements.value.find((el) => el.name === fieldName);
				if (element) {
					formData[element.clientId] = value;
				}
			});
		}
	});

	// Check if form is published (only check if we have the full form response)
	const isPublished = computed(() => {
		if (!form.value || requiresPassword.value) return true; // Assume published until we know
		return "status" in form.value && form.value.status === "published";
	});

	// Form data storage (keyed by element id)
	const formData = reactive<Record<string, any>>({});

	// Validation errors (keyed by element id)
	const errors = reactive<Record<string, string>>({});

	// Submission state
	const isSubmitting = ref(false);
	const isSubmitted = ref(false);
	const isAlreadyLocked = ref(false);

	// Convert server elements to client format with hierarchy
	const allElements = computed((): BuilderElement[] => {
		if (!form.value || requiresPassword.value) return [];
		if (!("elements" in form.value)) return [];

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

	// Submit handler
	async function handleSubmit() {
		if (!validateAll()) {
			return;
		}

		// Check if we have a submission token
		if (!props.token) {
			console.error("No submission token provided");
			alert("לא ניתן לשלוח: חסר טוקן שליחה");
			return;
		}

		isSubmitting.value = true;

		try {
			// Convert formData to use element names instead of clientIds
			const submissionData: Record<string, any> = {};
			Object.entries(formData).forEach(([clientId, value]) => {
				const element = allElements.value.find((el) => el.clientId === clientId);
				if (element && isFieldElement(element.type)) {
					// Use element name if set, otherwise fall back to clientId
					const key = element.name || clientId;
					submissionData[key] = value;
				}
			});

			// Submit to API
			await $fetch(`/api/submissions/${props.token}/submit`, {
				method: "POST",
				body: {
					submissionData,
				},
			});

			isSubmitted.value = true;
		} catch (error: any) {
			console.error("Submission error:", error);
			alert(error?.data?.message || "שליחת הטופס נכשלה. אנא נסה שוב.");
		} finally {
			isSubmitting.value = false;
		}
	}
</script>

<template>
	<div class="form-fill-container">
		<!-- Loading state -->
		<div v-if="pending" class="grid place-items-center min-h-screen">
			<div class="form-fill-loading">
				<Icon name="svg-spinners:ring-resize" class="h-8 w-8 form-fill-text-primary" />
			</div>
		</div>

		<!-- Error state (not found) -->
		<div v-else-if="error" class="grid place-items-center min-h-screen">
			<div class="form-fill-error-state form-fill-card">
				<Icon name="heroicons:exclamation-circle" class="mx-auto h-12 w-12 text-red-500" />
				<h2 class="form-fill-error-title">הטופס לא נמצא</h2>
				<p class="form-fill-error-message">הטופס שאתה מחפש אינו קיים או הוסר.</p>
			</div>
		</div>

		<!-- Password gate -->
		<FormFillPasswordGate
			v-else-if="requiresPassword"
			:form-id="formId"
			:form-title="form?.title ?? ''"
			:token="token"
			@verified="handlePasswordVerified"
		/>

		<!-- Already locked error -->
		<div v-else-if="isAlreadyLocked" class="grid place-items-center min-h-screen">
			<div class="form-fill-error-state form-fill-card">
				<Icon name="heroicons:lock-closed" class="mx-auto h-12 w-12 text-red-500" />
				<h2 class="form-fill-error-title">הטופס כבר נשלח</h2>
				<p class="form-fill-error-message">
					טופס זה כבר נשלח וננעל. לא ניתן לבצע שינויים נוספים.
				</p>
			</div>
		</div>

		<!-- Not published error -->
		<div v-else-if="!isPublished" class="grid place-items-center min-h-screen">
			<div class="form-fill-error-state form-fill-card">
				<Icon name="heroicons:lock-closed" class="mx-auto h-12 w-12 text-gray-400" />
				<h2 class="form-fill-error-title" style="color: rgb(var(--fill-text-primary))">
					הטופס אינו זמין
				</h2>
				<p class="form-fill-error-message">טופס זה אינו מקבל הגשות כרגע.</p>
			</div>
		</div>

		<!-- Success state -->
		<div v-else-if="isSubmitted" class="place-items-center grid min-h-screen">
			<div class="form-fill-success form-fill-card">
				<Icon name="heroicons:check-circle" class="form-fill-success-icon" />
				<h2 class="form-fill-success-title">תודה רבה!</h2>
				<p class="form-fill-success-message">הטופס שלך התקבל בהצלחה.</p>
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
						שולח...
					</template>
					<template v-else> שלח </template>
				</button>
			</footer>
		</form>
	</div>
</template>
