<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
		modelValue?: string;
		error?: string;
		readonly?: boolean;
		conditionRequired?: boolean;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:modelValue": [value: string];
		blur: [];
	}>();

	const config = computed(
		() =>
			props.element.config as {
				label?: string;
				helpText?: string;
				validation?: { required?: boolean };
			},
	);

	const isRequired = computed(
		() =>
			props.element.isRequired ||
			config.value.validation?.required ||
			props.conditionRequired,
	);

	const canvasRef = ref<HTMLCanvasElement | null>(null);
	const isDrawing = ref(false);
	const hasSignature = ref(false);

	const canvasWidth = 400;
	const canvasHeight = 250;

	function startDrawing(event: MouseEvent | TouchEvent) {
		isDrawing.value = true;
		const canvas = canvasRef.value;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const foreground = getComputedStyle(document.documentElement)
			.getPropertyValue("--foreground")
			.trim();
		ctx.strokeStyle = foreground || "#000";

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
		const canvas = canvasRef.value;
		const scaleX = canvas ? canvas.width / rect.width : 1;
		const scaleY = canvas ? canvas.height / rect.height : 1;

		if ("touches" in event) {
			const touch = event.touches[0] ?? event.changedTouches[0];
			return {
				x: ((touch?.clientX ?? 0) - rect.left) * scaleX,
				y: ((touch?.clientY ?? 0) - rect.top) * scaleY,
			};
		}
		return {
			x: (event.clientX - rect.left) * scaleX,
			y: (event.clientY - rect.top) * scaleY,
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

	function initCanvas() {
		const canvas = canvasRef.value;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const foreground = getComputedStyle(document.documentElement)
			.getPropertyValue("--foreground")
			.trim();

		ctx.strokeStyle = foreground || "#000";
		ctx.lineWidth = 2;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
	}

	onMounted(initCanvas);
</script>

<template>
	<div>
		<label
			v-if="config.label"
			class="form-fill-label block text-sm font-medium text-foreground mb-1"
		>
			{{ config.label }}
			<span v-if="isRequired" class="form-fill-required text-destructive ms-0.5">*</span>
		</label>

		<!-- Readonly mode: display signature as image -->
		<div v-if="readonly && modelValue" class="form-fill-signature-readonly w-full md:max-w-100">
			<img
				:src="modelValue"
				:alt="config.label || 'חתימה'"
				class="form-fill-signature-image block w-full h-auto border border-input rounded-md"
			/>
		</div>

		<!-- Edit mode: canvas for drawing -->
		<template v-else>
			<p v-if="config.helpText" class="form-fill-help text-sm text-muted-foreground mt-1">
				{{ config.helpText }}
			</p>
			<div class="w-full md:max-w-100">
				<canvas
					ref="canvasRef"
					:width="canvasWidth"
					:height="canvasHeight"
					class="form-fill-signature-canvas border border-input rounded-md bg-card cursor-crosshair w-full block aspect-3/2 md:aspect-auto"
					:class="{ 'border-destructive!': error }"
					@mousedown="startDrawing"
					@mousemove="draw"
					@mouseup="stopDrawing"
					@mouseleave="stopDrawing"
					@touchstart.prevent="startDrawing"
					@touchmove.prevent="draw"
					@touchend="stopDrawing"
				/>
			</div>

			<div class="form-fill-signature-actions flex gap-2 mt-2">
				<button
					type="button"
					class="text-sm text-muted-foreground hover:text-foreground"
					@click="clearSignature"
				>
					איפוס חתימה
				</button>
			</div>
		</template>

		<p v-if="error" class="form-fill-error text-sm text-destructive mt-1">{{ error }}</p>
	</div>
</template>
