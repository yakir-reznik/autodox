<template>
	<div class="">
		<div class="mb-3">
			<p
				v-if="config.label"
				class="form-fill-label block text-base font-medium text-foreground"
			>
				{{ config.label }}
				<span v-if="isRequired" class="form-fill-required text-destructive ms-0.5">*</span>
			</p>
			<p v-if="config.helpText" class="form-fill-help text-sm text-muted-foreground mt-1">
				{{ config.helpText }}
			</p>
		</div>

		<div
			class="form-fill-checkbox-group selection-columns flex flex-col gap-2"
			:class="{ 'ring-1 ring-destructive rounded-md p-2': error }"
			:style="columnsVars"
		>
			<label
				v-for="opt in config.options"
				:key="opt.id"
				class="form-fill-checkbox-option flex items-center gap-2 cursor-pointer"
			>
				<input
					type="checkbox"
					:value="opt.value"
					:checked="isChecked(opt.value)"
					class="h-4 w-4 accent-primary"
					@change="
						handleCheckboxChange(opt.value, ($event.target as HTMLInputElement).checked)
					"
					@blur="emit('blur')"
				/>
				<span class="text-base text-foreground">{{ opt.label }}</span>
			</label>

			<label
				v-if="config.allowUserOption"
				class="form-fill-checkbox-option flex items-center gap-2 cursor-pointer"
			>
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
	</div>
</template>

<script setup lang="ts">
	import type { BuilderElement, SelectionOption } from "~/types/form-builder";

	type Props = {
		element: BuilderElement;
		modelValue?: string | string[] | boolean;
		error?: string;
		conditionRequired?: boolean;
	};

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:modelValue": [value: string | string[] | boolean];
		blur: [];
	}>();

	const config = computed(
		() =>
			props.element.config as {
				label?: string;
				helpText?: string;
				options?: SelectionOption[];
				allowUserOption?: boolean;
				columns?: { desktop?: number; tablet?: number; mobile?: number };
				validation?: { required?: boolean };
			},
	);

	const columnsVars = computed(() => ({
		"--cols-mobile": config.value.columns?.mobile ?? 1,
		"--cols-tablet": config.value.columns?.tablet ?? 1,
		"--cols-desktop": config.value.columns?.desktop ?? 1,
	}));

	const isRequired = computed(
		() =>
			props.element.isRequired ||
			config.value.validation?.required ||
			props.conditionRequired,
	);

	const { OTHER_PREFIX, isOtherSelected, otherText, updateOtherText } = useOtherOption(
		computed(() => props.modelValue),
		(v) => emit("update:modelValue", v),
	);

	function isChecked(optionValue: string): boolean {
		return Array.isArray(props.modelValue) && props.modelValue.includes(optionValue);
	}

	function handleCheckboxChange(optionValue: string, checked: boolean) {
		const current = Array.isArray(props.modelValue) ? [...props.modelValue] : [];
		if (checked) {
			if (!current.includes(optionValue)) current.push(optionValue);
		} else {
			const index = current.indexOf(optionValue);
			if (index > -1) current.splice(index, 1);
		}
		emit("update:modelValue", current);
	}

	function handleOtherCheckbox(checked: boolean) {
		const current = Array.isArray(props.modelValue)
			? props.modelValue.filter((v) => !v.startsWith(OTHER_PREFIX))
			: [];
		if (checked) current.push(OTHER_PREFIX);
		emit("update:modelValue", current);
	}
</script>

<style scoped>
	.form-fill-checkbox-group.selection-columns {
		display: grid;
		grid-template-columns: repeat(var(--cols-mobile, 1), minmax(0, 1fr));
	}

	@media (min-width: 768px) {
		.form-fill-checkbox-group.selection-columns {
			grid-template-columns: repeat(var(--cols-tablet, 1), minmax(0, 1fr));
		}
	}

	@media (min-width: 1024px) {
		.form-fill-checkbox-group.selection-columns {
			grid-template-columns: repeat(var(--cols-desktop, 1), minmax(0, 1fr));
		}
	}
</style>
