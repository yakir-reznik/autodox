<script setup lang="ts">
	import draggable from "vuedraggable";
	import type { SelectionOption } from "~/types/form-builder";

	interface Props {
		options: SelectionOption[];
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:options": [options: SelectionOption[]];
	}>();

	const localOptions = computed({
		get: () => [...props.options],
		set: (value) => emit("update:options", value),
	});

	function generateId(): string {
		return `opt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
	}

	function addOption() {
		const newOptions = [...props.options, { id: generateId(), label: "", value: "" }];
		emit("update:options", newOptions);
	}

	function removeOption(index: number) {
		const newOptions = props.options.filter((_, i) => i !== index);
		emit("update:options", newOptions);
	}

	function updateOption(index: number, field: "label" | "value", value: string) {
		const newOptions = [...props.options];
		const option = newOptions[index];

		if (!option) return;

		option[field] = value;

		// Auto-generate value from label if value is empty
		if (field === "label" && !option.value) {
			option.value = value.toLowerCase().replace(/\s+/g, "_");
		}

		emit("update:options", newOptions);
	}
</script>

<template>
	<div class="space-y-2">
		<label class="block text-sm text-gray-600">Options</label>

		<draggable
			v-model="localOptions"
			item-key="id"
			handle=".option-drag-handle"
			animation="200"
			class="space-y-2"
		>
			<template #item="{ element, index }">
				<div class="flex items-center gap-2">
					<div class="option-drag-handle cursor-move text-gray-400">
						<Icon name="heroicons:bars-3" class="h-4 w-4" />
					</div>
					<input
						:value="element.label"
						placeholder="Label"
						class="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						@input="
							updateOption(index, 'label', ($event.target as HTMLInputElement).value)
						"
					/>
					<input
						:value="element.value"
						placeholder="Value"
						class="w-24 rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
						@input="
							updateOption(index, 'value', ($event.target as HTMLInputElement).value)
						"
					/>
					<button
						type="button"
						class="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
						@click="removeOption(index)"
					>
						<Icon name="heroicons:trash" class="h-4 w-4" />
					</button>
				</div>
			</template>
		</draggable>

		<button
			type="button"
			class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
			@click="addOption"
		>
			<Icon name="heroicons:plus" class="h-4 w-4" />
			Add Option
		</button>
	</div>
</template>
