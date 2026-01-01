<script setup lang="ts">
import type { BuilderElement, ValidationRules } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:config": [config: Record<string, any>];
}>();

const config = computed(() => props.element.config as {
	validation?: ValidationRules;
});

const validation = computed(() => config.value.validation || {});

function updateValidation(updates: Partial<ValidationRules>) {
	emit("update:config", {
		validation: { ...validation.value, ...updates },
	});
}

// Show different validation options based on element type
const showMinMax = computed(() =>
	["text", "email", "textarea", "number"].includes(props.element.type)
);

const showPattern = computed(() =>
	["text", "email"].includes(props.element.type)
);

const isNumberType = computed(() => props.element.type === "number");
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">Validation</h3>

		<!-- Min/Max Length (for text types) -->
		<template v-if="showMinMax && !isNumberType">
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="mb-1 block text-sm text-gray-600">Min Length</label>
					<UiInput
						type="number"
						:model-value="validation.minLength || ''"
						placeholder="0"
						@update:model-value="updateValidation({ minLength: $event ? Number($event) : undefined })"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm text-gray-600">Max Length</label>
					<UiInput
						type="number"
						:model-value="validation.maxLength || ''"
						placeholder="∞"
						@update:model-value="updateValidation({ maxLength: $event ? Number($event) : undefined })"
					/>
				</div>
			</div>
		</template>

		<!-- Min/Max Value (for number type) -->
		<template v-if="isNumberType">
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label class="mb-1 block text-sm text-gray-600">Min Value</label>
					<UiInput
						type="number"
						:model-value="validation.min ?? ''"
						placeholder="-∞"
						@update:model-value="updateValidation({ min: $event !== '' ? Number($event) : undefined })"
					/>
				</div>
				<div>
					<label class="mb-1 block text-sm text-gray-600">Max Value</label>
					<UiInput
						type="number"
						:model-value="validation.max ?? ''"
						placeholder="∞"
						@update:model-value="updateValidation({ max: $event !== '' ? Number($event) : undefined })"
					/>
				</div>
			</div>
		</template>

		<!-- Pattern (regex) -->
		<div v-if="showPattern">
			<label class="mb-1 block text-sm text-gray-600">Pattern (Regex)</label>
			<UiInput
				:model-value="validation.pattern || ''"
				placeholder="e.g., ^[A-Za-z]+$"
				@update:model-value="updateValidation({ pattern: $event as string })"
			/>
			<p class="mt-1 text-xs text-gray-500">Regular expression for validation</p>
		</div>

		<!-- Custom error message -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Custom Error Message</label>
			<UiInput
				:model-value="validation.customMessage || ''"
				placeholder="Please enter a valid value..."
				@update:model-value="updateValidation({ customMessage: $event as string })"
			/>
		</div>
	</div>
</template>
