<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
	modelValue?: string;
	error?: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: string];
	blur: [];
}>();

const config = computed(() => props.element.config as {
	label?: string;
	helpText?: string;
	maxWidth?: number;
	maxHeight?: number;
	validation?: { required?: boolean };
});

const isRequired = computed(() => props.element.isRequired || config.value.validation?.required);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDrawing = ref(false);
const hasSignature = ref(false);

const canvasWidth = computed(() => config.value.maxWidth || 400);
const canvasHeight = computed(() => config.value.maxHeight || 200);

function startDrawing(event: MouseEvent | TouchEvent) {
	isDrawing.value = true;
	const canvas = canvasRef.value;
	if (!canvas) return;

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const rect = canvas.getBoundingClientRect();
	const point = getPoint(event, rect);

	ctx.beginPath();
	ctx.moveTo(point.x, point.y);
}

function draw(event: MouseEvent | TouchEvent) {
	if (!isDrawing.value) return;

	const canvas = canvasRef.value;
	if (!canvas) return;

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	const rect = canvas.getBoundingClientRect();
	const point = getPoint(event, rect);

	ctx.lineTo(point.x, point.y);
	ctx.stroke();
	hasSignature.value = true;
}

function stopDrawing() {
	if (isDrawing.value) {
		isDrawing.value = false;
		saveSignature();
	}
}

function getPoint(event: MouseEvent | TouchEvent, rect: DOMRect) {
	if ("touches" in event) {
		return {
			x: event.touches[0].clientX - rect.left,
			y: event.touches[0].clientY - rect.top,
		};
	}
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	};
}

function saveSignature() {
	const canvas = canvasRef.value;
	if (!canvas) return;

	const dataUrl = canvas.toDataURL("image/png");
	emit("update:modelValue", dataUrl);
}

function clearSignature() {
	const canvas = canvasRef.value;
	if (!canvas) return;

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	hasSignature.value = false;
	emit("update:modelValue", "");
	emit("blur");
}

onMounted(() => {
	const canvas = canvasRef.value;
	if (!canvas) return;

	const ctx = canvas.getContext("2d");
	if (!ctx) return;

	ctx.strokeStyle = "#000";
	ctx.lineWidth = 2;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
});
</script>

<template>
	<div>
		<label v-if="config.label" class="form-fill-label">
			{{ config.label }}
			<span v-if="isRequired" class="form-fill-required">*</span>
		</label>

		<canvas
			ref="canvasRef"
			:width="canvasWidth"
			:height="canvasHeight"
			class="form-fill-signature-canvas"
			@mousedown="startDrawing"
			@mousemove="draw"
			@mouseup="stopDrawing"
			@mouseleave="stopDrawing"
			@touchstart.prevent="startDrawing"
			@touchmove.prevent="draw"
			@touchend="stopDrawing"
		/>

		<div class="form-fill-signature-actions">
			<button
				type="button"
				class="text-sm text-gray-600 hover:text-gray-800"
				@click="clearSignature"
			>
				Clear
			</button>
		</div>

		<p v-if="error" class="form-fill-error">{{ error }}</p>
		<p v-else-if="config.helpText" class="form-fill-help">{{ config.helpText }}</p>
	</div>
</template>
