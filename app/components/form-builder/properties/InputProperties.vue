<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

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
				pattern?: string;
				rows?: number;
				step?: number;
				defaultValue?: string;
			},
	);

	const isDateField = computed(() => ["date", "datetime"].includes(props.element.type));

	const relativeDateOptions = [
		{ value: "", label: "ללא" },
		...Object.entries(relativeDateLabels).map(([value, label]) => ({ value, label })),
	];

	const relativeTimeOptions = [
		{ value: "", label: "ללא" },
		...Object.entries(relativeTimeLabels).map(([value, label]) => ({ value, label })),
	];

	// Date default mode: "none" | "relative" | "manual"
	const dateDefaultMode = computed(() => {
		const dv = getDatePart();
		if (!dv) return "none";
		if (isRelativeDateKey(dv)) return "relative";
		return "manual";
	});

	// DateTime time part mode: "none" | "relative" | "manual"
	const timeDefaultMode = computed(() => {
		const tv = getTimePart();
		if (!tv) return "none";
		if (isRelativeTimeKey(tv)) return "relative";
		return "manual";
	});

	function parseDateTimeDefault(): { date: string; time: string } {
		const dv = config.value.defaultValue;
		if (!dv) return { date: "", time: "" };
		if (props.element.type === "date") return { date: dv, time: "" };
		try {
			const parsed = JSON.parse(dv);
			if (parsed && typeof parsed === "object" && "date" in parsed)
				return { date: parsed.date || "", time: parsed.time || "" };
		} catch {}
		// Legacy: plain relative date key
		if (isRelativeDateKey(dv)) return { date: dv, time: "" };
		return { date: dv, time: "" };
	}

	function getDatePart() {
		return parseDateTimeDefault().date;
	}

	function getTimePart() {
		return parseDateTimeDefault().time;
	}

	function updateDateDefault(datePart: string, timePart?: string) {
		if (props.element.type === "date") {
			emit("update:config", { defaultValue: datePart || undefined });
			return;
		}
		// datetime
		const time = timePart ?? getTimePart();
		if (!datePart && !time) {
			emit("update:config", { defaultValue: undefined });
			return;
		}
		emit("update:config", { defaultValue: JSON.stringify({ date: datePart, time }) });
	}

	function updateTimeDefault(timePart: string) {
		const datePart = getDatePart();
		if (!datePart && !timePart) {
			emit("update:config", { defaultValue: undefined });
			return;
		}
		emit("update:config", { defaultValue: JSON.stringify({ date: datePart, time: timePart }) });
	}

	function setDateMode(mode: string) {
		if (mode === "none") updateDateDefault("", "");
		else if (mode === "relative") updateDateDefault("today");
		else updateDateDefault(new Date().toISOString().slice(0, 10));
	}

	function setTimeMode(mode: string) {
		if (mode === "none") updateTimeDefault("");
		else if (mode === "relative") updateTimeDefault("now");
		else updateTimeDefault("12:00");
	}
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">Input Settings</h3>

		<!-- Placeholder -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Placeholder</label>
			<BaseInput
				:model-value="config.placeholder || ''"
				placeholder="Placeholder text..."
				@update:model-value="$emit('update:config', { placeholder: $event })"
			/>
		</div>

		<!-- Pattern (for email, text, etc.) -->
		<div v-if="['email', 'text'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">Pattern</label>
			<BaseInput
				:model-value="config.pattern || ''"
				placeholder="Regex pattern..."
				@update:model-value="$emit('update:config', { pattern: $event })"
			/>
			<p v-if="element.type === 'email'" class="mt-1 text-xs text-gray-500">
				Default: [a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}
			</p>
		</div>

		<!-- Rows (for textarea) -->
		<div v-if="element.type === 'textarea'">
			<label class="mb-1 block text-sm text-gray-600">Rows</label>
			<BaseInput
				type="number"
				:model-value="config.rows || 4"
				@update:model-value="$emit('update:config', { rows: Number($event) })"
			/>
		</div>

		<!-- Step (for number) -->
		<div v-if="element.type === 'number'">
			<label class="mb-1 block text-sm text-gray-600">Step</label>
			<BaseInput
				type="number"
				:model-value="config.step || 1"
				@update:model-value="$emit('update:config', { step: Number($event) })"
			/>
		</div>

		<!-- Default value for text/email -->
		<div v-if="['text', 'email'].includes(element.type)">
			<label class="mb-1 block text-sm text-gray-600">ערך ברירת מחדל</label>
			<BaseInput
				:model-value="config.defaultValue || ''"
				placeholder="ערך ברירת מחדל..."
				@update:model-value="$emit('update:config', { defaultValue: $event || undefined })"
			/>
		</div>

		<!-- Default value for number -->
		<div v-if="element.type === 'number'">
			<label class="mb-1 block text-sm text-gray-600">ערך ברירת מחדל</label>
			<BaseInput
				type="number"
				:model-value="config.defaultValue || ''"
				@update:model-value="$emit('update:config', { defaultValue: $event || undefined })"
			/>
		</div>

		<!-- Default value for textarea -->
		<div v-if="element.type === 'textarea'">
			<label class="mb-1 block text-sm text-gray-600">ערך ברירת מחדל</label>
			<BaseInput
				:model-value="config.defaultValue || ''"
				placeholder="ערך ברירת מחדל..."
				@update:model-value="$emit('update:config', { defaultValue: $event || undefined })"
			/>
		</div>

		<!-- Default value for time -->
		<div v-if="element.type === 'time'">
			<label class="mb-1 block text-sm text-gray-600">ערך ברירת מחדל</label>
			<select
				:value="config.defaultValue || ''"
				class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
				@change="$emit('update:config', { defaultValue: ($event.target as HTMLSelectElement).value || undefined })"
			>
				<option v-for="opt in relativeTimeOptions" :key="opt.value" :value="opt.value">
					{{ opt.label }}
				</option>
			</select>
		</div>

		<!-- Date/DateTime default -->
		<div v-if="isDateField" class="space-y-3">
			<label class="mb-1 block text-sm text-gray-600">ברירת מחדל לתאריך</label>

			<!-- Date mode selector -->
			<div class="flex gap-2">
				<button
					v-for="opt in [
						{ value: 'none', label: 'ללא' },
						{ value: 'relative', label: 'תאריך יחסי' },
						{ value: 'manual', label: 'תאריך ספציפי' },
					]"
					:key="opt.value"
					type="button"
					class="rounded-md border px-3 py-1 text-sm"
					:class="dateDefaultMode === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'"
					@click="setDateMode(opt.value)"
				>
					{{ opt.label }}
				</button>
			</div>

			<!-- Relative date dropdown -->
			<select
				v-if="dateDefaultMode === 'relative'"
				:value="getDatePart()"
				class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
				@change="updateDateDefault(($event.target as HTMLSelectElement).value)"
			>
				<option v-for="opt in relativeDateOptions.slice(1)" :key="opt.value" :value="opt.value">
					{{ opt.label }}
				</option>
			</select>

			<!-- Manual date picker -->
			<input
				v-if="dateDefaultMode === 'manual'"
				type="date"
				:value="getDatePart()"
				class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
				@input="updateDateDefault(($event.target as HTMLInputElement).value)"
			/>

			<!-- DateTime: time part -->
			<template v-if="element.type === 'datetime'">
				<label class="mb-1 block text-sm text-gray-600">ברירת מחדל לשעה</label>

				<div class="flex gap-2">
					<button
						v-for="opt in [
							{ value: 'none', label: 'ללא' },
							{ value: 'relative', label: 'שעה יחסית' },
							{ value: 'manual', label: 'שעה ספציפית' },
						]"
						:key="opt.value"
						type="button"
						class="rounded-md border px-3 py-1 text-sm"
						:class="timeDefaultMode === opt.value ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600'"
						@click="setTimeMode(opt.value)"
					>
						{{ opt.label }}
					</button>
				</div>

				<!-- Relative time dropdown -->
				<select
					v-if="timeDefaultMode === 'relative'"
					:value="getTimePart()"
					class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
					@change="updateTimeDefault(($event.target as HTMLSelectElement).value)"
				>
					<option v-for="opt in relativeTimeOptions.slice(1)" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>

				<!-- Manual time picker -->
				<input
					v-if="timeDefaultMode === 'manual'"
					type="time"
					:value="getTimePart()"
					class="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm"
					@input="updateTimeDefault(($event.target as HTMLInputElement).value)"
				/>
			</template>
		</div>
	</div>
</template>
