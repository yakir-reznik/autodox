<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
	}

	const props = defineProps<Props>();

	const config = computed(
		() =>
			props.element.config as {
				label?: string;
				placeholder?: string;
				helpText?: string;
				pattern?: string;
				defaultValue?: string;
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

	const emailPattern = "[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}";

	const pattern = computed(() => {
		if (props.element.type === "email") {
			return config.value.pattern || emailPattern;
		}
		return config.value.pattern;
	});

	const defaultValueHint = computed(() => {
		const dv = config.value.defaultValue;
		if (!dv) return null;

		const type = props.element.type;

		if (type === "date") {
			return relativeDateLabels[dv as keyof typeof relativeDateLabels] || dv;
		}

		if (type === "time") {
			return relativeTimeLabels[dv as keyof typeof relativeTimeLabels] || dv;
		}

		if (type === "datetime") {
			try {
				const parsed = JSON.parse(dv);
				if (parsed && typeof parsed === "object" && "date" in parsed) {
					const dateLabel =
						relativeDateLabels[parsed.date as keyof typeof relativeDateLabels] ||
						parsed.date;
					const timeLabel = parsed.time
						? relativeTimeLabels[parsed.time as keyof typeof relativeTimeLabels] ||
							parsed.time
						: null;
					return timeLabel ? `${dateLabel}, ${timeLabel}` : dateLabel;
				}
			} catch {}
			// Legacy relative date key
			return relativeDateLabels[dv as keyof typeof relativeDateLabels] || dv;
		}

		// text/email/number — show truncated literal
		const str = String(dv);
		return str.length > 30 ? str.slice(0, 30) + "..." : str;
	});
</script>

<template>
	<div>
		<label v-if="config.label" class="mb-1 block text-sm font-medium text-gray-700">
			{{ config.label }}
			<span v-if="config.validation?.required" class="text-red-500">*</span>
		</label>
		<input
			:type="inputType"
			:placeholder="config.placeholder"
			:pattern="pattern"
			:dir="element.type === 'phone' ? 'ltr' : undefined"
			disabled
			class="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500"
		/>
		<p v-if="defaultValueHint" class="mt-1 text-xs text-blue-500">
			ברירת מחדל: {{ defaultValueHint }}
		</p>
		<p v-if="config.helpText" class="mt-1 text-xs text-gray-500">
			{{ config.helpText }}
		</p>
	</div>
</template>
