<script setup lang="ts">
import type { BuilderElement, ElementType } from "~/types/form-builder";
import { getDefaultConfig } from "~/composables/useElementDefaults";
import type { ThemeColors } from "~~/shared/types/themes";

const props = defineProps<{ colors: ThemeColors; darkColors?: ThemeColors; mode: "light" | "dark"; baseCss: string }>();
const emit = defineEmits<{ "update:mode": [value: "light" | "dark"] }>();
const frame = ref<HTMLIFrameElement | null>(null);
const frameBody = shallowRef<HTMLElement | null>(null);
const frameHeight = ref(300);
let resizeObserver: ResizeObserver | undefined;

function updateFrameTheme() {
	const doc = frame.value?.contentDocument;
	if (!doc || !frameBody.value) return;
	doc.documentElement.classList.toggle("dark", props.mode === "dark");
	const colors = props.mode === "dark" ? (props.darkColors ?? props.colors) : props.colors;
	for (const [key, value] of Object.entries(colors)) doc.documentElement.style.setProperty(`--${key}`, value);
	const theme = doc.getElementById("preview-theme") as HTMLLinkElement | null;
	if (theme) theme.href = props.baseCss;
}

function initFrame() {
	const doc = frame.value?.contentDocument;
	if (!doc) return;
	for (const node of document.head.querySelectorAll('style, link[rel="stylesheet"]')) {
		doc.head.appendChild(node.cloneNode(true));
	}
	const theme = doc.createElement("link");
	theme.id = "preview-theme";
	theme.rel = "stylesheet";
	doc.head.appendChild(theme);
	doc.documentElement.lang = "he";
	doc.documentElement.dir = "rtl";
	frameBody.value = doc.body;
	updateFrameTheme();
	resizeObserver?.disconnect();
	resizeObserver = new ResizeObserver(() => {
		frameHeight.value = Math.max(300, Math.ceil(doc.body.getBoundingClientRect().height));
	});
	resizeObserver.observe(doc.body);
}

watch(() => [props.colors, props.darkColors, props.mode, props.baseCss], updateFrameTheme, { deep: true });
onBeforeUnmount(() => resizeObserver?.disconnect());
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
	<iframe ref="frame" srcdoc="<!DOCTYPE html><html><head></head><body></body></html>" title="תצוגה מקדימה של טופס" class="w-full rounded-xl border border-border" :style="{ height: `${frameHeight}px` }" @load="initFrame" />
	<Teleport v-if="frameBody" :to="frameBody">
	<div class="form-fill-container bg-background font-sans p-4 text-foreground lg:p-6 pb-20" dir="rtl">
		<div class="mx-auto max-w-xl space-y-6">
			<div class="form-fill-card space-y-6 rounded-lg bg-card p-4 shadow-md lg:p-8">
				<FormFillFormField v-for="element in rootElements" :key="element.clientId"
					v-model="data[element.clientId]" :element="element" :get-children="children" :form-data="data" :errors="errors" />
				<button type="button" class="rounded-md bg-primary px-5 py-2 text-primary-foreground">שליחה</button>
			</div>
		</div>
	</div>
	</Teleport>
</template>
