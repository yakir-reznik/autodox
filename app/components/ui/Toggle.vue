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

const enabled = computed({
	get: () => props.modelValue,
	set: (value) => emit("update:modelValue", value),
});
</script>

<template>
	<label
		class="inline-flex cursor-pointer items-center gap-3"
		:class="{ 'cursor-not-allowed opacity-50': disabled }"
	>
		<button
			:id="id"
			type="button"
			role="switch"
			:aria-checked="enabled"
			:disabled="disabled"
			class="relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed"
			:class="enabled ? 'bg-blue-600' : 'bg-gray-200'"
			@click="enabled = !enabled"
		>
			<span
				class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform"
				:class="enabled ? 'translate-x-5 rtl:-translate-x-5' : 'translate-x-0'"
			/>
		</button>
		<span class="text-sm text-gray-700">
			<slot />
		</span>
	</label>
</template>
