<script setup lang="ts">
import type { BuilderElement, ElementType } from "~/types/form-builder";
import { getDefaultConfig } from "~/composables/useElementDefaults";
import type { ThemeColors } from "~~/shared/types/themes";

const props = defineProps<{ colors: ThemeColors; darkColors?: ThemeColors; mode: "light" | "dark" }>();
const emit = defineEmits<{ "update:mode": [value: "light" | "dark"] }>();
const styles = computed(() => Object.fromEntries(Object.entries({
	...props.colors,
	...(props.mode === "dark" ? props.darkColors : {}),
}).map(([key, value]) => [`--${key}`, value])));
const types: Array<{ type: ElementType; parent?: string }> = [
	{ type: "heading_h1" }, { type: "paragraph" }, { type: "text" }, { type: "email" },
	{ type: "number" }, { type: "phone" }, { type: "textarea" }, { type: "date" }, { type: "time" },
	{ type: "datetime" }, { type: "dropdown" }, { type: "radio" }, { type: "checkbox" },
	{ type: "checkboxes" }, { type: "signature" }, { type: "heading_h2" }, { type: "heading_h3" },
	{ type: "rich_text" }, { type: "divider" }, { type: "spacer" }, { type: "image" }, { type: "video" },
	{ type: "section" }, { type: "text", parent: "section" }, { type: "grid" },
	{ type: "text", parent: "grid" }, { type: "repeater" }, { type: "text", parent: "repeater" },
];
const elements: BuilderElement[] = types.map(({ type, parent }, index) => ({
	id: null, clientId: parent ? `${parent}-${index}` : type, type, position: index,
	parentId: parent ?? null, name: null, config: getDefaultConfig(type), isRequired: false,
}));
const rootElements = computed(() => elements.filter((item) => !item.parentId));
const children = (id: string) => elements.filter((element) => element.parentId === id);
const data = reactive<Record<string, any>>({
	text: "ישראל ישראלי",
	number: 42,
	textarea: "פרטים לדוגמה",
	date: "2026-06-15",
	dropdown: "option1",
	radio: "option1",
	checkbox: true,
	checkboxes: ["option1"],
});
const errors = reactive<Record<string, string>>({});
</script>

<template>
	<div class="mb-3 flex flex-wrap items-center gap-2" role="group" aria-label="מצב תצוגה">
		<button type="button" class="rounded-md border px-3 py-1 text-sm" :class="mode === 'light' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white'" :aria-pressed="mode === 'light'" @click="emit('update:mode', 'light')">בהיר</button>
		<button type="button" class="rounded-md border px-3 py-1 text-sm" :class="mode === 'dark' ? 'border-blue-600 bg-blue-50 text-blue-800' : 'border-gray-300 bg-white'" :aria-pressed="mode === 'dark'" @click="emit('update:mode', 'dark')">כהה</button>
	</div>
	<div :style="styles" :class="{ dark: mode === 'dark' }" class="form-fill-container rounded-xl border border-border bg-background p-5 text-foreground sm:p-8" dir="rtl">
		<div class="mx-auto max-w-xl space-y-6">
			<FormFillFormField v-for="element in rootElements.slice(0, 4)" :key="element.clientId"
				v-model="data[element.clientId]" :element="element" :get-children="children" :form-data="data" :errors="errors" />
			<div class="form-fill-card space-y-6 rounded-lg bg-card p-5 text-card-foreground shadow-sm">
				<FormFillFormField v-for="element in rootElements.slice(4)" :key="element.clientId"
					v-model="data[element.clientId]" :element="element" :get-children="children" :form-data="data" :errors="errors" />
				<button type="button" class="rounded-md bg-primary px-5 py-2 text-primary-foreground">שליחה</button>
			</div>
		</div>
	</div>
</template>
