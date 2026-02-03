<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface RepeaterConfig {
	label?: string;
	helpText?: string;
	itemName?: string;
	minItems?: number;
	maxItems?: number;
	addButtonText?: string;
	bordered?: boolean;
	backgroundColor?: string;
}

interface Props {
	element: BuilderElement;
	getChildren: (parentClientId: string) => BuilderElement[];
	modelValue?: Record<string, any>[];
	error?: string;
	formData: Record<string, any>;
	errors: Record<string, string>;
	getConditionRequired?: (clientId: string) => boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: Record<string, any>[]];
}>();

const config = computed(() => props.element.config as RepeaterConfig);
const children = computed(() => props.getChildren(props.element.clientId));

const minItems = computed(() => config.value.minItems ?? 1);
const maxItems = computed(() => config.value.maxItems);
const isFixedLength = computed(() =>
	maxItems.value !== undefined && minItems.value === maxItems.value
);

// Initialize items with minimum count
const items = computed({
	get: () => {
		const current = props.modelValue || [];
		// Ensure we have at least minItems
		if (current.length < minItems.value) {
			const newItems = [...current];
			while (newItems.length < minItems.value) {
				newItems.push({});
			}
			return newItems;
		}
		return current;
	},
	set: (newItems) => {
		emit("update:modelValue", newItems);
	},
});

// Initialize on mount if needed
onMounted(() => {
	if (!props.modelValue || props.modelValue.length < minItems.value) {
		const initialItems: Record<string, any>[] = [];
		for (let i = 0; i < minItems.value; i++) {
			initialItems.push({});
		}
		emit("update:modelValue", initialItems);
	}
});

const canAdd = computed(() => {
	if (isFixedLength.value) return false;
	if (maxItems.value === undefined) return true;
	return items.value.length < maxItems.value;
});

const canRemove = computed(() => {
	if (isFixedLength.value) return false;
	return items.value.length > minItems.value;
});

function addItem() {
	if (canAdd.value) {
		items.value = [...items.value, {}];
	}
}

function removeItem(index: number) {
	if (canRemove.value) {
		const newItems = [...items.value];
		newItems.splice(index, 1);
		items.value = newItems;
	}
}

function updateItemField(itemIndex: number, fieldClientId: string, value: any) {
	const newItems = [...items.value];
	if (!newItems[itemIndex]) {
		newItems[itemIndex] = {};
	}
	newItems[itemIndex] = { ...newItems[itemIndex], [fieldClientId]: value };
	items.value = newItems;
}

// Get error for a specific field in a specific item
function getFieldError(itemIndex: number, fieldClientId: string): string | undefined {
	const errorKey = `${props.element.clientId}[${itemIndex}].${fieldClientId}`;
	return props.errors[errorKey];
}

const containerClass = computed(() => {
	const classes = ["form-fill-repeater"];
	if (config.value.bordered) {
		classes.push("bordered");
	}
	return classes.join(" ");
});

const itemStyle = computed(() => {
	if (config.value.backgroundColor) {
		return { backgroundColor: config.value.backgroundColor };
	}
	return { backgroundColor: "#f9fafb" };
});
</script>

<template>
	<div :class="containerClass">
		<!-- Label -->
		<label v-if="config.label" class="form-fill-label mb-2 block">
			{{ config.label }}
		</label>

		<!-- Help text -->
		<p v-if="config.helpText" class="form-fill-help mb-3">
			{{ config.helpText }}
		</p>

		<!-- Items -->
		<div class="space-y-4">
			<div
				v-for="(item, itemIndex) in items"
				:key="itemIndex"
				class="relative rounded-lg border border-gray-200 p-4"
				:style="itemStyle"
			>
				<!-- Item header with index and remove button -->
				<div class="mb-3 flex items-center justify-between">
					<span class="text-sm font-medium text-gray-600">
						{{ config.itemName ? `${config.itemName} #${itemIndex + 1}` : `#${itemIndex + 1}` }}
					</span>
					<button
						v-if="canRemove"
						type="button"
						class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
						@click="removeItem(itemIndex)"
					>
						<Icon name="heroicons:trash" class="h-4 w-4" />
					</button>
				</div>

				<!-- Nested fields -->
				<div class="space-y-4">
					<FormFillFormField
						v-for="child in children"
						:key="`${itemIndex}-${child.clientId}`"
						:element="child"
						:get-children="getChildren"
						:model-value="item[child.clientId]"
						:error="getFieldError(itemIndex, child.clientId)"
						:form-data="item"
						:errors="errors"
						:condition-required="getConditionRequired?.(child.clientId)"
						:get-condition-required="getConditionRequired"
						@update:model-value="updateItemField(itemIndex, child.clientId, $event)"
					/>
				</div>
			</div>
		</div>

		<!-- Add button -->
		<button
			v-if="canAdd"
			type="button"
			class="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 transition-colors hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600"
			@click="addItem"
		>
			<Icon name="heroicons:plus" class="h-4 w-4" />
			{{ config.addButtonText || 'הוסף עוד' }}
		</button>

		<!-- Error message -->
		<p v-if="error" class="form-fill-error mt-2">{{ error }}</p>
	</div>
</template>
