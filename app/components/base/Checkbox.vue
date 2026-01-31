<script setup lang="ts">
interface Props {
	modelValue?: boolean;
	disabled?: boolean;
	id?: string;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: false,
	disabled: false,
});

const emit = defineEmits<{
	"update:modelValue": [value: boolean];
}>();

const checked = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});
</script>

<template>
	<label class="inline-flex cursor-pointer items-center gap-2" :class="{ 'cursor-not-allowed opacity-50': disabled }">
		<input
			v-model="checked"
			:id="id"
			type="checkbox"
			:disabled="disabled"
			class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:cursor-not-allowed"
		/>
		<span class="text-sm text-gray-700">
			<slot />
		</span>
	</label>
</template>
