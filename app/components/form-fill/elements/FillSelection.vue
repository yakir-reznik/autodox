<script setup lang="ts">
import type { BuilderElement, SelectionOption } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
	modelValue?: string | string[] | boolean;
	error?: string;
	conditionRequired?: boolean;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: string | string[] | boolean];
	blur: [];
}>();

const config = computed(() => props.element.config as {
	label?: string;
	placeholder?: string;
	helpText?: string;
	options?: SelectionOption[];
	allowUserOption?: boolean;
	columns?: { desktop?: number; tablet?: number; mobile?: number };
	defaultValue?: string | boolean;
	validation?: { required?: boolean };
});


const columnsVars = computed(() => ({
	'--cols-mobile': config.value.columns?.mobile ?? 1,
	'--cols-tablet': config.value.columns?.tablet ?? 1,
	'--cols-desktop': config.value.columns?.desktop ?? 1,
}));

const isRequired = computed(() => props.element.isRequired || config.value.validation?.required || props.conditionRequired);

const OTHER_PREFIX = "__other__:";

const isOtherSelected = computed(() => {
	if (props.element.type === "checkboxes") {
		return Array.isArray(props.modelValue) && props.modelValue.some(v => v.startsWith(OTHER_PREFIX));
	}
	return typeof props.modelValue === "string" && props.modelValue.startsWith(OTHER_PREFIX);
});

const otherText = computed(() => {
	if (props.element.type === "checkboxes") {
		if (!Array.isArray(props.modelValue)) return "";
		const entry = props.modelValue.find(v => v.startsWith(OTHER_PREFIX));
		return entry ? entry.slice(OTHER_PREFIX.length) : "";
	}
	return typeof props.modelValue === "string" && props.modelValue.startsWith(OTHER_PREFIX)
		? props.modelValue.slice(OTHER_PREFIX.length)
		: "";
});

function selectOther() {
	emit("update:modelValue", OTHER_PREFIX);
}

function updateOtherText(text: string) {
	if (props.element.type === "checkboxes") {
		const current = Array.isArray(props.modelValue) ? props.modelValue.filter(v => !v.startsWith(OTHER_PREFIX)) : [];
		current.push(OTHER_PREFIX + text);
		emit("update:modelValue", current);
	} else {
		emit("update:modelValue", OTHER_PREFIX + text);
	}
}

// Handle checkbox group changes
function handleCheckboxChange(optionValue: string, checked: boolean) {
	const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
	if (checked) {
		if (!current.includes(optionValue)) {
			current.push(optionValue);
		}
	} else {
		const index = current.indexOf(optionValue);
		if (index > -1) {
			current.splice(index, 1);
		}
	}
	emit("update:modelValue", current);
}

function handleOtherCheckbox(checked: boolean) {
	const current = Array.isArray(props.modelValue) ? props.modelValue.filter(v => !v.startsWith(OTHER_PREFIX)) : [];
	if (checked) {
		current.push(OTHER_PREFIX);
	}
	emit("update:modelValue", current);
}

function isChecked(optionValue: string): boolean {
	return Array.isArray(props.modelValue) && props.modelValue.includes(optionValue);
}
</script>

<template>
	<div>
		<!-- Label (not for single checkbox) -->
		<label v-if="config.label && element.type !== 'checkbox'" class="form-fill-label block text-sm font-medium text-foreground mb-1">
			{{ config.label }}
			<span v-if="isRequired" class="form-fill-required text-destructive ms-0.5">*</span>
		</label>

		<!-- Dropdown -->
		<template v-if="element.type === 'dropdown'">
			<select
				:value="isOtherSelected ? '__other__' : modelValue"
				class="form-fill-select w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground cursor-pointer transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10"
				:class="{ 'border-destructive': error }"
				@change="($event.target as HTMLSelectElement).value === '__other__' ? selectOther() : emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
				@blur="emit('blur')"
			>
				<option value="">{{ config.placeholder || 'Select...' }}</option>
				<option v-for="opt in config.options" :key="opt.id" :value="opt.value">
					{{ opt.label }}
				</option>
				<option v-if="config.allowUserOption" value="__other__">אחר</option>
			</select>
			<input
				v-if="config.allowUserOption && isOtherSelected"
				type="text"
				:value="otherText"
				class="form-fill-input w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10 placeholder:text-muted-foreground mt-2"
				placeholder="פרט..."
				@input="updateOtherText(($event.target as HTMLInputElement).value)"
				@blur="emit('blur')"
			/>
		</template>

		<!-- Radio buttons -->
		<div v-else-if="element.type === 'radio'" class="form-fill-radio-group selection-columns flex flex-col gap-2" :style="columnsVars">
			<label v-for="opt in config.options" :key="opt.id" class="form-fill-radio-option flex items-center gap-2 cursor-pointer">
				<input
					type="radio"
					:name="element.clientId"
					:value="opt.value"
					:checked="modelValue === opt.value"
					class="h-4 w-4 accent-primary"
					@change="emit('update:modelValue', opt.value)"
					@blur="emit('blur')"
				/>
				<span class="text-base text-foreground">{{ opt.label }}</span>
			</label>
			<label v-if="config.allowUserOption" class="form-fill-radio-option flex items-center gap-2 cursor-pointer">
				<input
					type="radio"
					:name="element.clientId"
					value="__other__"
					:checked="isOtherSelected"
					class="h-4 w-4 accent-primary"
					@change="selectOther()"
				/>
				<span class="text-base text-foreground">אחר</span>
			</label>
			<input
				v-if="config.allowUserOption && isOtherSelected"
				type="text"
				:value="otherText"
				class="form-fill-input w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10 placeholder:text-muted-foreground mt-2"
				placeholder="פרט..."
				@input="updateOtherText(($event.target as HTMLInputElement).value)"
				@blur="emit('blur')"
			/>
		</div>

		<!-- Single checkbox -->
		<label v-else-if="element.type === 'checkbox'" class="form-fill-checkbox flex items-center gap-2 cursor-pointer">
			<input
				type="checkbox"
				:checked="!!modelValue"
				class="h-4 w-4 accent-primary"
				@change="emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
				@blur="emit('blur')"
			/>
			<span class="text-base text-foreground">
				{{ config.label }}
				<span v-if="isRequired" class="form-fill-required text-destructive ms-0.5">*</span>
			</span>
		</label>

		<!-- Multiple checkboxes -->
		<div v-else-if="element.type === 'checkboxes'" class="form-fill-checkbox-group selection-columns flex flex-col gap-2" :style="columnsVars">
			<label v-for="opt in config.options" :key="opt.id" class="form-fill-checkbox-option flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					:value="opt.value"
					:checked="isChecked(opt.value)"
					class="h-4 w-4 accent-primary"
					@change="handleCheckboxChange(opt.value, ($event.target as HTMLInputElement).checked)"
					@blur="emit('blur')"
				/>
				<span class="text-base text-foreground">{{ opt.label }}</span>
			</label>
			<label v-if="config.allowUserOption" class="form-fill-checkbox-option flex items-center gap-2 cursor-pointer">
				<input
					type="checkbox"
					:checked="isOtherSelected"
					class="h-4 w-4 accent-primary"
					@change="handleOtherCheckbox(($event.target as HTMLInputElement).checked)"
					@blur="emit('blur')"
				/>
				<span class="text-base text-foreground">אחר</span>
			</label>
			<input
				v-if="config.allowUserOption && isOtherSelected"
				type="text"
				:value="otherText"
				class="form-fill-input w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10 placeholder:text-muted-foreground mt-2"
				placeholder="פרט..."
				@input="updateOtherText(($event.target as HTMLInputElement).value)"
				@blur="emit('blur')"
			/>
		</div>

		<p v-if="error" class="form-fill-error text-sm text-destructive mt-1">{{ error }}</p>
		<p v-else-if="config.helpText" class="form-fill-help text-sm text-muted-foreground mt-1">{{ config.helpText }}</p>
	</div>
</template>

<style scoped>
.form-fill-radio-group.selection-columns,
.form-fill-checkbox-group.selection-columns {
	display: grid;
	grid-template-columns: repeat(var(--cols-mobile, 1), minmax(0, 1fr));
}

@media (min-width: 768px) {
	.form-fill-radio-group.selection-columns,
	.form-fill-checkbox-group.selection-columns {
		grid-template-columns: repeat(var(--cols-tablet, 1), minmax(0, 1fr));
	}
}

@media (min-width: 1024px) {
	.form-fill-radio-group.selection-columns,
	.form-fill-checkbox-group.selection-columns {
		grid-template-columns: repeat(var(--cols-desktop, 1), minmax(0, 1fr));
	}
}
</style>
