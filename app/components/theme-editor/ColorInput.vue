<script setup lang="ts">
import { isHexColor } from "~~/shared/types/themes";

const props = defineProps<{ modelValue: string; label: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const valid = computed(() => isHexColor(props.modelValue));
const pickerColor = computed(() => {
	if (!valid.value) return "#000000";
	const digits = props.modelValue.slice(1);
	return `#${digits.length <= 4 ? [...digits.slice(0, 3)].map((digit) => digit + digit).join("") : digits.slice(0, 6)}`;
});
</script>

<template>
	<div class="text-sm">
		<label :for="`theme-color-${label}`">{{ label }}</label>
		<div class="mt-1 flex items-center gap-2">
			<input type="color" :value="pickerColor" :aria-label="`בחירת צבע: ${label}`" class="size-9 shrink-0 cursor-pointer rounded border border-gray-300 bg-white p-0.5" @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
			<UiInput :id="`theme-color-${label}`" :model-value="modelValue" :aria-invalid="!valid" dir="ltr" class="min-w-0" @update:model-value="emit('update:modelValue', String($event))" />
		</div>
		<p v-if="!valid" class="mt-1 text-xs text-red-600">יש להזין צבע בפורמט hex תקין.</p>
	</div>
</template>
