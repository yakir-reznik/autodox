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
	readonly?: boolean;
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
</script>

<template>
	<div :class="containerClass">
		<!-- Label -->
		<label v-if="config.label" class="form-fill-label block text-sm font-medium text-foreground mb-2">
			{{ config.label }}
		</label>

		<!-- Help text -->
		<p v-if="config.helpText" class="form-fill-help text-sm text-muted-foreground mb-3">
			{{ config.helpText }}
		</p>

		<!-- Items -->
		<div class="space-y-4">
			<div
				v-for="(item, itemIndex) in items"
				:key="itemIndex"
				class="form-fill-repeater-item relative rounded-md border border-input p-4 bg-accent"
				:class="{ '!border-destructive': error }"
			>
				<!-- Item header with index and remove button -->
				<div class="form-fill-repeater-header flex items-center justify-between mb-3">
					<span class="form-fill-repeater-index text-sm font-medium text-muted-foreground">
						{{ config.itemName ? `${config.itemName} #${itemIndex + 1}` : `#${itemIndex + 1}` }}
					</span>
					<button
						v-if="canRemove && !readonly"
						type="button"
						class="form-fill-repeater-remove rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
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
						:readonly="readonly"
						:condition-required="getConditionRequired?.(child.clientId)"
						:get-condition-required="getConditionRequired"
						@update:model-value="updateItemField(itemIndex, child.clientId, $event)"
					/>
				</div>
			</div>
		</div>

		<!-- Add button -->
		<button
			v-if="canAdd && !readonly"
			type="button"
			class="form-fill-repeater-add mt-4 flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed border-input py-3 px-4 text-sm text-muted-foreground transition-colors hover:border-ring hover:bg-ring/5 hover:text-ring"
			@click="addItem"
		>
			<Icon name="heroicons:plus" class="h-4 w-4" />
			{{ config.addButtonText || 'הוסף עוד' }}
		</button>

		<!-- Error message -->
		<p v-if="error" class="form-fill-error text-sm text-destructive mt-2">{{ error }}</p>
	</div>
</template>
