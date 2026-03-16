<script setup lang="ts">
	import type { BuilderElement, SelectionOption } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:config": [config: Record<string, any>];
	}>();

	const config = computed(
		() =>
			props.element.config as {
				placeholder?: string;
				options?: SelectionOption[];
				allowUserOption?: boolean;
				columns?: { desktop?: number; tablet?: number; mobile?: number };
				defaultValue?: string | boolean;
			},
	);

	const options = computed(() => config.value.options || []);

	const columns = computed(() => ({
		desktop: config.value.columns?.desktop ?? 1,
		tablet: config.value.columns?.tablet ?? 1,
		mobile: config.value.columns?.mobile ?? 1,
	}));

	function updateColumns(key: "desktop" | "tablet" | "mobile", value: number) {
		emit("update:config", {
			columns: { ...columns.value, [key]: value },
		});
	}

	function updateOptions(newOptions: SelectionOption[]) {
		emit("update:config", { options: newOptions });
		// Clear defaultValue if it references removed options
		validateDefaultValue(newOptions);
	}

	function validateDefaultValue(currentOptions: SelectionOption[]) {
		const dv = config.value.defaultValue;
		if (!dv || typeof dv === "boolean") return;

		const validValues = new Set(currentOptions.map((o) => o.value));

		if (props.element.type === "checkboxes") {
			try {
				const arr = JSON.parse(dv) as string[];
				const filtered = arr.filter((v) => validValues.has(v));
				if (filtered.length !== arr.length) {
					emit("update:config", {
						defaultValue: filtered.length ? JSON.stringify(filtered) : undefined,
					});
				}
			} catch {}
		} else {
			if (!validValues.has(dv as string)) {
				emit("update:config", { defaultValue: undefined });
			}
		}
	}

	const checkboxesDefault = computed(() => {
		const dv = config.value.defaultValue;
		if (!dv || typeof dv !== "string") return [] as string[];
		try {
			return JSON.parse(dv) as string[];
		} catch {
			return [] as string[];
		}
	});

	function toggleCheckboxDefault(value: string) {
		const current = [...checkboxesDefault.value];
		const idx = current.indexOf(value);
		if (idx >= 0) current.splice(idx, 1);
		else current.push(value);
		emit("update:config", { defaultValue: current.length ? JSON.stringify(current) : undefined });
	}
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">Selection Settings</h3>

		<!-- Placeholder (for dropdown) -->
		<div v-if="element.type === 'dropdown'">
			<label class="mb-1 block text-sm text-gray-600">Placeholder</label>
			<BaseInput
				:model-value="config.placeholder || ''"
				placeholder="Select an option..."
				@update:model-value="$emit('update:config', { placeholder: $event })"
			/>
		</div>

		<!-- Options editor -->
		<FormBuilderPropertiesOptionsEditor :options="options" @update:options="updateOptions" />

		<!-- Allow other -->
		<BaseToggle
			:model-value="config.allowUserOption || false"
			@update:model-value="$emit('update:config', { allowUserOption: $event })"
		>
			Allow "Other" option
		</BaseToggle>

		<!-- Default value: single checkbox -->
		<BaseToggle
			v-if="element.type === 'checkbox'"
			:model-value="config.defaultValue === true"
			@update:model-value="$emit('update:config', { defaultValue: $event || undefined })"
		>
			מסומן כברירת מחדל
		</BaseToggle>

		<!-- Default value: dropdown/radio -->
		<div v-if="['dropdown', 'radio'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">ערך ברירת מחדל</label>
			<select
				:value="(config.defaultValue as string) || ''"
				class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
				@change="$emit('update:config', { defaultValue: ($event.target as HTMLSelectElement).value || undefined })"
			>
				<option value="">ללא</option>
				<option v-for="opt in options" :key="opt.id" :value="opt.value">
					{{ opt.label }}
				</option>
			</select>
		</div>

		<!-- Default value: checkboxes (multi-select) -->
		<div v-if="element.type === 'checkboxes' && options.length">
			<label class="mb-1 block text-sm text-gray-600">ברירת מחדל</label>
			<div class="space-y-1">
				<label v-for="opt in options" :key="opt.id" class="flex items-center gap-2 text-sm text-gray-700">
					<input
						type="checkbox"
						:checked="checkboxesDefault.includes(opt.value)"
						class="rounded border-gray-300"
						@change="toggleCheckboxDefault(opt.value)"
					/>
					{{ opt.label }}
				</label>
			</div>
		</div>

		<!-- Columns (checkboxes only) -->
		<div v-if="element.type === 'checkboxes' || element.type === 'radio'" class="space-y-2">
			<label class="mb-1 block text-sm text-gray-600">עמודות</label>
			<div class="grid grid-cols-3 gap-2">
				<div>
					<label class="mb-0.5 block text-xs text-gray-500">דסקטופ</label>
					<BaseInput
						type="number"
						:model-value="columns.desktop"
						:min="1"
						:max="6"
						@update:model-value="updateColumns('desktop', Number($event))"
					/>
				</div>
				<div>
					<label class="mb-0.5 block text-xs text-gray-500">טאבלט</label>
					<BaseInput
						type="number"
						:model-value="columns.tablet"
						:min="1"
						:max="6"
						@update:model-value="updateColumns('tablet', Number($event))"
					/>
				</div>
				<div>
					<label class="mb-0.5 block text-xs text-gray-500">מובייל</label>
					<BaseInput
						type="number"
						:model-value="columns.mobile"
						:min="1"
						:max="6"
						@update:model-value="updateColumns('mobile', Number($event))"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
