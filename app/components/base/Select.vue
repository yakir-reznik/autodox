<script setup lang="ts">
interface Option {
	label: string;
	value: string | number;
}

interface Props {
	modelValue?: string | number;
	options: Option[];
	placeholder?: string;
	disabled?: boolean;
	error?: string;
	id?: string;
}

const props = withDefaults(defineProps<Props>(), {
	disabled: false,
});

const emit = defineEmits<{
	"update:modelValue": [value: string | number];
}>();

const selectedValue = computed({
	get: () => props.modelValue ?? "",
	set: (value) => emit("update:modelValue", value),
});
</script>

<template>
	<div class="w-full">
		<select
			v-model="selectedValue"
			:id="id"
			:disabled="disabled"
			class="w-full appearance-none rounded-lg border bg-white px-3 py-2 pe-8 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
			:class="[
				error
					? 'border-red-500 focus:ring-red-500'
					: 'border-gray-300 hover:border-gray-400',
			]"
		>
			<option v-if="placeholder" value="" disabled>
				{{ placeholder }}
			</option>
			<option
				v-for="option in options"
				:key="option.value"
				:value="option.value"
			>
				{{ option.label }}
			</option>
		</select>
		<p v-if="error" class="mt-1 text-sm text-red-500">{{ error }}</p>
	</div>
</template>
