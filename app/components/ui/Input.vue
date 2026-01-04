<script setup lang="ts">
	interface Props {
		modelValue?: string | number;
		type?: "text" | "email" | "number" | "password" | "date" | "time" | "datetime-local";
		placeholder?: string;
		disabled?: boolean;
		error?: string;
		id?: string;
	}

	const props = withDefaults(defineProps<Props>(), {
		type: "text",
		disabled: false,
	});

	const attrs = useAttrs();

	const emit = defineEmits<{
		"update:modelValue": [value: string | number];
	}>();

	const inputValue = computed({
		get: () => props.modelValue ?? "",
		set: (value) => emit("update:modelValue", value),
	});
</script>

<template>
	<div class="w-full">
		<input
			v-bind="attrs"
			v-model="inputValue"
			:id="id"
			:type="type"
			:placeholder="placeholder"
			:disabled="disabled"
			class="w-full rounded-lg border px-3 py-2 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
			:class="[
				error
					? 'border-red-500 focus:ring-red-500'
					: 'border-gray-300 hover:border-gray-400',
			]"
		/>
		<p v-if="error" class="mt-1 text-sm text-red-500">{{ error }}</p>
	</div>
</template>
