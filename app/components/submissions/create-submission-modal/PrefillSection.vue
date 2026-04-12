<script setup lang="ts">
	import type { ElementType, ElementConfig, SelectionOption } from "~/types/form-builder";

	type FormElement = {
		id: number;
		type: ElementType;
		name: string | null;
		config: ElementConfig;
		parentId: number | null;
	};

	type Props = {
		fields: FormElement[];
		prefillData: Record<string, any>;
	};

	defineProps<Props>();

	const showPrefill = ref(false);

	function getOptions(config: ElementConfig): SelectionOption[] {
		return (config as any).options ?? [];
	}

	function getInputType(
		type: ElementType,
	): "text" | "email" | "number" | "tel" | "date" | "time" | "datetime-local" {
		if (type === "datetime") return "datetime-local";
		if (type === "email") return "email";
		if (type === "number") return "number";
		if (type === "phone") return "tel";
		if (type === "date") return "date";
		if (type === "time") return "time";
		return "text";
	}

	function toggleCheckboxValue(
		prefillData: Record<string, any>,
		fieldName: string,
		value: string,
		checked: boolean,
	) {
		const arr = Array.isArray(prefillData[fieldName]) ? [...prefillData[fieldName]] : [];
		if (checked && !arr.includes(value)) {
			arr.push(value);
		} else if (!checked) {
			const idx = arr.indexOf(value);
			if (idx > -1) arr.splice(idx, 1);
		}
		prefillData[fieldName] = arr;
	}
</script>

<template>
	<div class="space-y-3 bg-primary-foreground rounded-md">
		<button
			type="button"
			class="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700 cursor-pointer p-4 w-full hover:bg-black/2 rounded-md"
			@click="showPrefill = !showPrefill"
		>
			<Icon
				name="heroicons:chevron-left"
				class="h-4 w-4 transition-transform"
				:class="{ '-rotate-90': showPrefill }"
			/>
			מילוי מוקדם
		</button>

		<div v-if="showPrefill" class="space-y-4 px-4 pb-6">
			<div v-for="field in fields" :key="field.id" class="space-y-1">
				<label class="block text-sm font-medium text-gray-700">
					{{ (field.config as any).label || field.name }}
				</label>
				<p class="text-xs text-gray-400">{{ field.name }}</p>

				<!-- Text-like inputs -->
				<UiInput
					v-if="
						[
							'text',
							'email',
							'number',
							'phone',
							'textarea',
							'date',
							'time',
							'datetime',
						].includes(field.type)
					"
					v-model="prefillData[field.name!]"
					:type="getInputType(field.type)"
					:placeholder="(field.config as any).placeholder || ''"
					class="bg-background"
				/>

				<!-- Dropdown -->
				<UiSelect
					v-else-if="field.type === 'dropdown'"
					v-model="prefillData[field.name!]"
					dir="rtl"
				>
					<UiSelectTrigger class="bg-background w-full">
						<UiSelectValue placeholder="בחר..." />
					</UiSelectTrigger>
					<UiSelectContent>
						<UiSelectItem
							v-for="opt in getOptions(field.config)"
							:key="opt.id"
							:value="opt.value"
						>
							{{ opt.label }}
						</UiSelectItem>
					</UiSelectContent>
				</UiSelect>

				<!-- Radio -->
				<UiRadioGroup
					v-else-if="field.type === 'radio'"
					v-model="prefillData[field.name!]"
					class="flex flex-wrap gap-4 pt-1"
					dir="rtl"
				>
					<label
						v-for="opt in getOptions(field.config)"
						:key="opt.id"
						class="flex items-center gap-2 cursor-pointer"
					>
						<UiRadioGroupItem :value="opt.value" dir="rtl" class="bg-background" />
						<span class="text-sm text-gray-700">{{ opt.label }}</span>
					</label>
				</UiRadioGroup>

				<!-- Checkbox (single boolean) -->
				<BaseToggle
					v-else-if="field.type === 'checkbox'"
					v-model="prefillData[field.name!]"
				/>

				<!-- Checkboxes (multi-select) -->
				<div v-else-if="field.type === 'checkboxes'" class="flex flex-wrap gap-4 pt-1">
					<label
						v-for="opt in getOptions(field.config)"
						:key="opt.id"
						class="flex items-center gap-2 cursor-pointer"
					>
						<UiCheckbox
							:checked="
								Array.isArray(prefillData[field.name!]) &&
								prefillData[field.name!].includes(opt.value)
							"
							@update:checked="
								toggleCheckboxValue(prefillData, field.name!, opt.value, $event)
							"
							class="bg-background"
						/>
						<span class="text-sm text-gray-700">{{ opt.label }}</span>
					</label>
				</div>
			</div>
		</div>
	</div>
</template>
