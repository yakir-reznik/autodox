<script setup lang="ts">
	import type { FormWithElements, BuilderElement, ElementType } from "~/types/form-builder";
	import { isFieldElement, isSubmittableElement } from "~/composables/useElementDefaults";
	import FormField from "./FormField.vue";

	interface Props {
		formId: number;
		token?: string | null;
	}

	const props = defineProps<Props>();

	// Type for password-protected or token-required response
	type FormResponse =
		| (FormWithElements & {
				prefillData?: Record<string, any> | null;
				submissionStatus?: string | null;
				isLocked?: boolean;
				hasPassword?: boolean;
				requiresPassword?: false;
				requiresToken?: false;
		  })
		| {
				id: number;
				title: string;
				hasPassword: true;
				requiresPassword: true;
		  }
		| {
				id: number;
				title: string;
				description?: string | null;
				requiresToken: true;
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

	// Check if token is required (form doesn't allow public submissions)
	const requiresToken = computed(() => {
		return form.value && "requiresToken" in form.value && form.value.requiresToken === true;
	});

	// Handle password verification
	async function handlePasswordVerified() {
		await refreshForm();
	}

	// Track form entrance when form loads successfully
	onMounted(async () => {
		if (form.value && !error.value) {
			// Skip if password or token is required
			if (requiresPassword.value || requiresToken.value) {
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
			if (props.token && !("isLocked" in form.value && form.value.isLocked)) {
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
					// For repeaters, transform nested data from field names to clientIds
					if (element.type === "repeater" && Array.isArray(value)) {
						const children = getChildElements(element.clientId);
						const transformedItems = value.map((item: Record<string, any>) => {
							const transformedItem: Record<string, any> = {};
							Object.entries(item).forEach(([childFieldName, childValue]) => {
								// Find child element by name
								const childElement = children.find((c) => c.name === childFieldName);
								if (childElement) {
									transformedItem[childElement.clientId] = childValue;
								}
							});
							return transformedItem;
						});
						formData[element.clientId] = transformedItems;
					} else {
						formData[element.clientId] = value;
					}
				}
			});
		}
	});

	// Check if form is published (only check if we have the full form response)
	const isPublished = computed(() => {
		if (!form.value || requiresPassword.value || requiresToken.value) return true; // Assume published until we know
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
		if (!form.value || requiresPassword.value || requiresToken.value) return [];
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

	// Validate a single field with a given value
	function validateFieldValue(element: BuilderElement, value: any, errorKey: string): boolean {
		if (!isFieldElement(element.type)) return true;

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

		// Required validation
		if (element.isRequired || config.validation?.required) {
			if (
				value === undefined ||
				value === null ||
				value === "" ||
				(Array.isArray(value) && value.length === 0)
			) {
				errors[errorKey] = config.validation?.customMessage || "חסר ערך בשדה חובה";
				return false;
			}
		}

		// Skip further validation if empty and not required
		if (!value) {
			delete errors[errorKey];
			return true;
		}

		// MinLength validation
		if (
			config.validation?.minLength &&
			typeof value === "string" &&
			value.length < config.validation.minLength
		) {
			errors[errorKey] = `נדרשים לפחות ${config.validation.minLength} תווים`;
			return false;
		}

		// MaxLength validation
		if (
			config.validation?.maxLength &&
			typeof value === "string" &&
			value.length > config.validation.maxLength
		) {
			errors[errorKey] = `מותרים עד ${config.validation.maxLength} תווים`;
			return false;
		}

		// Min validation (for numbers)
		if (
			config.validation?.min !== undefined &&
			typeof value === "number" &&
			value < config.validation.min
		) {
			errors[errorKey] = `הערך המינימלי הוא ${config.validation.min}`;
			return false;
		}

		// Max validation (for numbers)
		if (
			config.validation?.max !== undefined &&
			typeof value === "number" &&
			value > config.validation.max
		) {
			errors[errorKey] = `הערך המקסימלי הוא ${config.validation.max}`;
			return false;
		}

		// Pattern validation
		if (config.validation?.pattern && typeof value === "string") {
			const regex = new RegExp(config.validation.pattern);
			if (!regex.test(value)) {
				errors[errorKey] = config.validation.customMessage || "ערך לא תקין";
				return false;
			}
		}

		delete errors[errorKey];
		return true;
	}

	// Validate a single field (wrapper for root-level fields)
	function validateField(clientId: string): boolean {
		const element = allElements.value.find((el) => el.clientId === clientId);
		if (!element) return true;
		return validateFieldValue(element, formData[clientId], clientId);
	}

	// Validate repeater children
	function validateRepeater(repeaterClientId: string): boolean {
		const repeaterItems = formData[repeaterClientId] as Record<string, any>[] | undefined;
		if (!repeaterItems || repeaterItems.length === 0) return true;

		const children = getChildElements(repeaterClientId);
		let isValid = true;

		for (let itemIndex = 0; itemIndex < repeaterItems.length; itemIndex++) {
			const item = repeaterItems[itemIndex];
			for (const child of children) {
				if (isFieldElement(child.type)) {
					const value = item[child.clientId];
					const errorKey = `${repeaterClientId}[${itemIndex}].${child.clientId}`;
					if (!validateFieldValue(child, value, errorKey)) {
						isValid = false;
					}
				}
			}
		}

		return isValid;
	}

	// Validate all fields
	function validateAll(): boolean {
		let isValid = true;

		for (const element of allElements.value) {
			// Skip elements with a parent - they're validated by their parent container
			if (element.parentId) continue;

			if (isFieldElement(element.type)) {
				if (!validateField(element.clientId)) {
					isValid = false;
				}
			} else if (element.type === "repeater") {
				if (!validateRepeater(element.clientId)) {
					isValid = false;
				}
			}
		}

		return isValid;
	}

	// Computed property for error summaries
	const errorSummaries = computed(() => {
		const summaries: Array<{ errorKey: string; label: string; message: string }> = [];

		for (const [errorKey, message] of Object.entries(errors)) {
			// Parse error key to find the element
			// Format can be: "el_123" (root field) or "el_5[0].el_6" (repeater item)
			let element: BuilderElement | undefined;
			let label = "";

			if (errorKey.includes("[")) {
				// Repeater item error: el_5[0].el_6
				const match = errorKey.match(/^(el_\d+)\[(\d+)\]\.(el_\d+)$/);
				if (match) {
					const [, repeaterClientId, itemIndex, fieldClientId] = match;
					const repeater = allElements.value.find((el) => el.clientId === repeaterClientId);
					const field = allElements.value.find((el) => el.clientId === fieldClientId);
					const fieldLabel =
						(field?.config as { label?: string })?.label || field?.name || fieldClientId;
					const repeaterLabel =
						(repeater?.config as { label?: string })?.label || repeater?.name || repeaterClientId;
					label = `${repeaterLabel} (שורה ${Number(itemIndex) + 1}) - ${fieldLabel}`;
					element = field;
				}
			} else {
				// Root field error: el_123
				element = allElements.value.find((el) => el.clientId === errorKey);
				label = (element?.config as { label?: string })?.label || element?.name || errorKey;
			}

			summaries.push({ errorKey, label, message });
		}

		return summaries;
	});

	// Scroll to a specific error field
	function scrollToError(errorKey: string) {
		if (!errorKey) return;

		// For repeater errors (el_5[0].el_6), we need to extract the repeater clientId
		let targetFieldId = errorKey;
		if (errorKey.includes("[")) {
			const match = errorKey.match(/^(el_\d+)\[/);
			if (match) {
				targetFieldId = match[1]; // Scroll to the repeater container
			}
		}

		// Find the field element by data attribute
		const fieldElement = document.querySelector(`[data-field-id="${targetFieldId}"]`);
		if (fieldElement) {
			fieldElement.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}

	// Scroll to first error field
	function scrollToFirstError() {
		const firstErrorKey = Object.keys(errors)[0];
		if (firstErrorKey) {
			scrollToError(firstErrorKey);
		}
	}

	// Submit handler
	async function handleSubmit() {
		if (!validateAll()) {
			// Scroll to first error field after DOM updates
			nextTick(() => {
				scrollToFirstError();
			});
			return;
		}

		isSubmitting.value = true;

		try {
			// Convert formData to use element names instead of clientIds
			const submissionData: Record<string, any> = {};
			Object.entries(formData).forEach(([clientId, value]) => {
				const element = allElements.value.find((el) => el.clientId === clientId);
				if (element && isSubmittableElement(element.type)) {
					// Use element name if set, otherwise fall back to clientId
					const key = element.name || clientId;

					// For repeaters, transform nested data to use field names
					if (element.type === "repeater" && Array.isArray(value)) {
						const children = getChildElements(clientId);
						const transformedItems = value.map((item: Record<string, any>) => {
							const transformedItem: Record<string, any> = {};
							Object.entries(item).forEach(([childClientId, childValue]) => {
								const childElement = children.find((c) => c.clientId === childClientId);
								const childKey = childElement?.name || childClientId;
								transformedItem[childKey] = childValue;
							});
							return transformedItem;
						});
						submissionData[key] = transformedItems;
					} else {
						submissionData[key] = value;
					}
				}
			});

			// Use unified endpoint - pass token if available
			await $fetch(`/api/forms/${props.formId}/submit`, {
				method: "POST",
				body: { submissionData, token: props.token },
			});

			isSubmitted.value = true;
		} catch (error: any) {
			console.error("Submission error:", error);
			// Handle 403 for "requires link" error
			if (error?.statusCode === 403) {
				alert(error?.data?.message || "טופס זה דורש קישור אישי לשליחה");
			} else {
				alert(error?.data?.message || "שליחת הטופס נכשלה. אנא נסה שוב.");
			}
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

		<!-- Token gate (requires personal link) -->
		<FormFillTokenGate
			v-else-if="requiresToken"
			:form-title="form?.title ?? ''"
			:form-description="form && 'description' in form ? form.description : null"
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
				<p v-if="form && 'description' in form && form.description" class="form-fill-description">
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

			<!-- Error Summary -->
			<div v-if="errorSummaries.length > 0" class="form-fill-error-summary">
				<div class="form-fill-error-summary-header">
					<Icon name="heroicons:exclamation-triangle" class="h-5 w-5" />
					<span>יש לתקן את השגיאות הבאות:</span>
				</div>
				<ul class="form-fill-error-summary-list">
					<li v-for="err in errorSummaries" :key="err.errorKey">
						<span><strong>{{ err.label }}:</strong> {{ err.message }}</span>
						<button
							type="button"
							class="form-fill-error-summary-link"
							@click="scrollToError(err.errorKey)"
						>
							צפה בשדה
						</button>
					</li>
				</ul>
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
