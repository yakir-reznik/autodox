<script setup lang="ts">
	import type { BuilderElement, SelectionOption } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
	}

	const props = defineProps<Props>();

	const config = computed(
		() =>
			props.element.config as {
				label?: string;
				placeholder?: string;
				helpText?: string;
				options?: SelectionOption[];
				allowUserOption?: boolean;
				columns?: { desktop?: number; tablet?: number; mobile?: number };
				defaultValue?: string | boolean;
				validation?: { required?: boolean };
			},
	);

	const options = computed(() => config.value.options || []);

	const defaultCheckedValues = computed(() => {
		const dv = config.value.defaultValue;
		if (!dv || typeof dv === "boolean") return new Set<string>();
		if (props.element.type === "checkboxes") {
			try {
				return new Set(JSON.parse(dv as string) as string[]);
			} catch {
				return new Set<string>();
			}
		}
		return new Set([dv as string]);
	});

	const defaultValueHint = computed(() => {
		const dv = config.value.defaultValue;
		if (!dv) return null;
		if (typeof dv === "boolean") return dv ? "מסומן" : null;
		if (props.element.type === "checkboxes") {
			try {
				const arr = JSON.parse(dv as string) as string[];
				const labels = arr.map((v) => options.value.find((o) => o.value === v)?.label || v);
				return labels.join(", ");
			} catch {
				return null;
			}
		}
		return options.value.find((o) => o.value === dv)?.label || dv;
	});

	const columnsStyle = computed(() => {
		const d = config.value.columns?.desktop ?? 1;
		return { "grid-template-columns": `repeat(${d}, minmax(0, 1fr))` };
	});
</script>

<template>
	<div>
		<label
			v-if="config.label && element.type !== 'checkbox'"
			class="mb-1 block text-sm font-medium text-gray-700"
		>
			{{ config.label }}
			<span v-if="config.validation?.required" class="text-red-500">*</span>
		</label>

		<!-- Dropdown -->
		<template v-if="element.type === 'dropdown'">
			<select
				disabled
				class="w-full appearance-none rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
			>
				<option value="">{{ config.placeholder || "Select an option" }}</option>
				<option v-for="opt in options" :key="opt.id" :value="opt.value">
					{{ opt.label }}
				</option>
				<option v-if="config.allowUserOption" value="__other__">אחר</option>
			</select>
		</template>

		<!-- Radio buttons -->
		<template v-else-if="element.type === 'radio'">
			<div class="grid gap-2" :style="columnsStyle">
				<label v-for="opt in options" :key="opt.id" class="flex items-center gap-2">
					<input
						type="radio"
						:name="element.clientId"
						disabled
						:checked="defaultCheckedValues.has(opt.value)"
						class="h-4 w-4 border-gray-300 text-blue-600"
					/>
					<span class="text-sm text-gray-600">{{ opt.label }}</span>
				</label>
				<label v-if="config.allowUserOption" class="flex items-center gap-2">
					<input
						type="radio"
						:name="element.clientId"
						disabled
						class="h-4 w-4 border-gray-300 text-blue-600"
					/>
					<span class="text-sm text-gray-600">אחר</span>
				</label>
			</div>
		</template>

		<!-- Single checkbox -->
		<template v-else-if="element.type === 'checkbox'">
			<label class="flex items-center gap-2">
				<input
					type="checkbox"
					disabled
					:checked="config.defaultValue === true"
					class="h-4 w-4 rounded border-gray-300 text-blue-600"
				/>
				<span class="text-sm text-gray-600">{{ config.label }}</span>
			</label>
		</template>

		<!-- Multiple checkboxes -->
		<template v-else-if="element.type === 'checkboxes'">
			<div class="grid gap-2" :style="columnsStyle">
				<label v-for="opt in options" :key="opt.id" class="flex items-center gap-2">
					<input
						type="checkbox"
						disabled
						:checked="defaultCheckedValues.has(opt.value)"
						class="h-4 w-4 rounded border-gray-300 text-blue-600"
					/>
					<span class="text-sm text-gray-600">{{ opt.label }}</span>
				</label>
				<label v-if="config.allowUserOption" class="flex items-center gap-2">
					<input
						type="checkbox"
						disabled
						class="h-4 w-4 rounded border-gray-300 text-blue-600"
					/>
					<span class="text-sm text-gray-600">אחר</span>
				</label>
			</div>
		</template>

		<p v-if="defaultValueHint" class="mt-1 text-xs text-blue-500">
			ברירת מחדל: {{ defaultValueHint }}
		</p>
		<p v-if="config.helpText" class="mt-1 text-xs text-gray-500">
			{{ config.helpText }}
		</p>
	</div>
</template>
