<script setup lang="ts">
const props = defineProps<{ modelValue: string; label: string }>();
const emit = defineEmits<{ "update:modelValue": [value: string] }>();
const pickerColor = ref("#000000");

function hexToOklch(hex: string) {
	const digits = hex.slice(1);
	const expanded = digits.length <= 4 ? [...digits].map((digit) => digit + digit).join("") : digits;
	const channels = [0, 2, 4].map((offset) => parseInt(expanded.slice(offset, offset + 2), 16) / 255)
		.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
	const [r, g, b] = channels as [number, number, number];
	const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
	const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
	const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
	const lightness = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
	const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
	const b2 = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
	const chroma = Math.hypot(a, b2);
	const hue = chroma < 0.0001 ? 0 : (Math.atan2(b2, a) * 180 / Math.PI + 360) % 360;
	const alpha = expanded.length === 8 ? ` / ${Number((parseInt(expanded.slice(6), 16) / 255).toFixed(4))}` : "";
	return `oklch(${lightness.toFixed(4)} ${chroma.toFixed(4)} ${hue.toFixed(2)}${alpha})`;
}

function convertHex() {
	const value = props.modelValue.trim();
	if (/^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(value)) emit("update:modelValue", hexToOklch(value));
}

function updatePicker() {
	if (!import.meta.client || !CSS.supports("color", props.modelValue)) return;
	const canvas = document.createElement("canvas");
	canvas.width = 1; canvas.height = 1;
	const context = canvas.getContext("2d", { willReadFrequently: true });
	if (!context) return;
	context.fillStyle = props.modelValue;
	context.fillRect(0, 0, 1, 1);
	const [r, g, b] = context.getImageData(0, 0, 1, 1).data;
	pickerColor.value = `#${[r, g, b].map((value) => (value ?? 0).toString(16).padStart(2, "0")).join("")}`;
}
onMounted(updatePicker);
watch(() => props.modelValue, updatePicker);
</script>

<template>
	<div class="text-sm">
		<label :for="`theme-color-${label}`">{{ label }}</label>
		<div class="mt-1 flex items-center gap-2">
			<input type="color" :value="pickerColor" :aria-label="`בחירת צבע: ${label}`" class="size-9 shrink-0 cursor-pointer rounded border border-gray-300 bg-white p-0.5" @input="emit('update:modelValue', hexToOklch(($event.target as HTMLInputElement).value))" />
			<UiInput :id="`theme-color-${label}`" :model-value="modelValue" dir="ltr" class="min-w-0" @update:model-value="emit('update:modelValue', String($event))" @blur="convertHex" />
		</div>
	</div>
</template>
