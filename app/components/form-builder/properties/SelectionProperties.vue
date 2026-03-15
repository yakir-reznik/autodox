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
