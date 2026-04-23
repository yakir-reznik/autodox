<template>
	<div class="form-fill-fieldset-input">
		<label
			v-if="config.label"
			:for="inputId"
			class="form-fill-label block text-sm font-medium text-foreground mb-1"
		>
			{{ config.label }}
			<span v-if="isRequired" class="form-fill-required text-destructive ms-0.5">*</span>
		</label>
		<div class="relative">
			<span
				v-if="readonly && ['date', 'datetime', 'time'].includes(element.type)"
				class="form-fill-input flex items-center justify-between w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground"
				dir="ltr"
			>
				<span>{{ formattedReadonlyValue }}</span>
				<Icon
					:name="element.type === 'time' ? 'lucide:clock' : 'lucide:calendar'"
					class="text-muted-foreground opacity-50 shrink-0"
					size="16"
				/>
			</span>
			<input
				v-else
				:id="inputId"
				:type="inputType"
				:value="modelValue"
				:placeholder="config.placeholder"
				:step="config.step"
				:autocomplete="config.autocomplete || 'off'"
				:dir="['email', 'phone', 'date', 'time'].includes(element.type) ? 'ltr' : 'rtl'"
				class="form-fill-input w-full bg-card border border-input rounded-md py-2 px-4 text-base text-foreground transition-colors focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/10 placeholder:text-muted-foreground/50"
				:class="[
					{
						'border-destructive!': error,
						'appearance-none': ['date'].includes(element.type),
					},
				]"
				@input="handleInput"
				@blur="element.type === 'phone' ? handlePhoneBlur($event) : emit('blur')"
			/>
		</div>
		<p v-if="error" class="form-fill-error text-sm text-destructive mt-1">{{ error }}</p>
		<p v-else-if="config.helpText" class="form-fill-help text-sm text-muted-foreground mt-1">
			{{ config.helpText }}
		</p>
	</div>
</template>

<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
		modelValue?: string | number;
		error?: string;
		conditionRequired?: boolean;
		readonly?: boolean;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:modelValue": [value: string | number];
		blur: [];
	}>();

	const inputId = useId();

	const formattedReadonlyValue = computed(() => {
		const val = props.modelValue;
		if (!val) return "-";
		const dateStr = String(val);
		if (props.element.type === "date") {
			const d = new Date(dateStr);
			return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString("he-IL");
		}
		if (props.element.type === "datetime") {
			const d = new Date(dateStr);
			return isNaN(d.getTime()) ? dateStr : d.toLocaleString("he-IL");
		}
		if (props.element.type === "time") {
			return dateStr;
		}
		return dateStr;
	});

	const config = computed(
		() =>
			props.element.config as {
				label?: string;
				placeholder?: string;
				helpText?: string;
				step?: number;
				defaultValue?: string;
				autocomplete?: string;
				validation?: { required?: boolean };
			},
	);

	const inputType = computed(() => {
		switch (props.element.type) {
			case "email":
				return "email";
			case "number":
				return "number";
			case "phone":
				return "tel";
			case "date":
				return "date";
			case "time":
				return "time";
			case "datetime":
				return "datetime-local";
			default:
				return "text";
		}
	});

	const isRequired = computed(
		() =>
			props.element.isRequired ||
			config.value.validation?.required ||
			props.conditionRequired,
	);

	function sanitizePhone(raw: string): string {
		let result = "";
		for (let i = 0; i < raw.length; i++) {
			const ch = raw[i]!;
			if (ch >= "0" && ch <= "9") {
				result += ch;
			} else if (ch === "+" && result === "") {
				result += ch;
			}
			// spaces, dashes, dots, and other chars are silently ignored
		}
		return result;
	}

	function handleInput(event: Event) {
		const target = event.target as HTMLInputElement;
		if (props.element.type === "phone") {
			const sanitized = sanitizePhone(target.value);
			target.value = sanitized;
			emit("update:modelValue", sanitized);
			return;
		}
		const value =
			props.element.type === "number" ? parseFloat(target.value) || 0 : target.value;
		emit("update:modelValue", value);
	}

	function handlePhoneBlur(event: Event) {
		const target = event.target as HTMLInputElement;
		const sanitized = sanitizePhone(target.value);
		target.value = sanitized;
		emit("update:modelValue", sanitized);
		emit("blur");
	}
</script>
