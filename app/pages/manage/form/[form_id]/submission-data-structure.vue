<template>
	<div class="max-w-3xl">
		<!-- Loading -->
		<div v-if="pending" class="flex flex-col items-center justify-center py-20 text-gray-400">
			<Icon name="svg-spinners:ring-resize" class="h-8 w-8" />
			<p class="mt-3 text-sm">טוען נתוני טופס...</p>
		</div>

		<template v-else>
			<!-- TypeScript -->
			<div class="mb-6 overflow-hidden rounded-xl border border-gray-200 bg-white">
				<div
					class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3"
				>
					<span class="text-sm font-medium text-gray-600">TypeScript</span>
					<BaseCopyButton :text="tsCode" variant="ghost"> העתקה </BaseCopyButton>
				</div>
				<div class="relative">
					<div dir="ltr" class="overflow-x-auto text-left text-sm">
						<table class="w-full border-collapse">
							<tr
								v-for="(line, i) in visibleTsCode.split('\n')"
								:key="i"
								class="leading-6"
							>
								<td
									class="w-0 select-none border-l border-gray-100 px-3 text-right text-xs text-gray-400"
								>
									{{ i + 1 }}
								</td>
								<td class="px-4 [&_.shiki]:bg-transparent!">
									<Shiki lang="typescript" :code="line || ' '" as="span" />
								</td>
							</tr>
						</table>
					</div>
					<div
						v-if="tsLines.length > COLLAPSED_LINES && !expandedTs"
						class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent"
					/>
				</div>
				<button
					v-if="tsLines.length > COLLAPSED_LINES"
					class="w-full border-t border-gray-100 py-2.5 text-center text-sm text-primary hover:bg-gray-50 transition cursor-pointer"
					@click="expandedTs = !expandedTs"
				>
					{{ expandedTs ? "הצג פחות" : `הצג הכל (${tsLines.length} שורות)` }}
				</button>
			</div>

			<!-- JSON Schema -->
			<div class="overflow-hidden rounded-xl border border-gray-200 bg-white">
				<div
					class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3"
				>
					<span class="text-sm font-medium text-gray-600">JSON Schema</span>
					<BaseCopyButton :text="jsonSchemaCode" variant="ghost"> העתקה </BaseCopyButton>
				</div>
				<div class="relative">
					<div dir="ltr" class="overflow-x-auto text-left text-sm">
						<table class="w-full border-collapse">
							<tr
								v-for="(line, i) in visibleJsonCode.split('\n')"
								:key="i"
								class="leading-6"
							>
								<td
									class="w-0 select-none border-l border-gray-100 px-3 text-right text-xs text-gray-400"
								>
									{{ i + 1 }}
								</td>
								<td class="px-4 [&_.shiki]:bg-transparent!">
									<Shiki lang="json" :code="line || ' '" as="span" />
								</td>
							</tr>
						</table>
					</div>
					<div
						v-if="jsonLines.length > COLLAPSED_LINES && !expandedJson"
						class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent"
					/>
				</div>
				<button
					v-if="jsonLines.length > COLLAPSED_LINES"
					class="w-full border-t border-gray-100 py-2.5 text-center text-sm text-primary hover:bg-gray-50 transition cursor-pointer"
					@click="expandedJson = !expandedJson"
				>
					{{ expandedJson ? "הצג פחות" : `הצג הכל (${jsonLines.length} שורות)` }}
				</button>
			</div>
		</template>
	</div>
</template>

<script setup lang="ts">
	import { ArrowRight } from "lucide-vue-next";
	import type { FormWithElements } from "~/types/form-builder";
	import type { ElementType } from "~~/server/db/schema";

	definePageMeta({
		layout: "management-panel",
		heading: "מבנה נתונים של הגשה",
		breadcrumbs: [
			{
				label: "רשימת טפסים",
				to: "/manage",
			},
			{
				label: "עריכת טופס",
			},
			{
				label: "מבנה נתונים של הגשה",
			},
		],
	});

	const route = useRoute();
	const formId = route.params.form_id as string;

	const { data: form, pending } = await useFetch<FormWithElements>(`/api/forms/${formId}`);

	route.meta.breadcrumbs = [
		{
			label: "רשימת טפסים",
			to: "/manage",
		},
		{
			label: `עריכת טופס (${form.value?.title})`,
			to: `/manage/form/${formId}/edit`,
		},
		{
			label: "מבנה נתונים של הגשה",
		},
	];

	const layoutTypes: ElementType[] = [
		"heading_h1",
		"heading_h2",
		"heading_h3",
		"paragraph",
		"image",
		"video",
		"divider",
		"spacer",
		"section",
	];

	function tsTypeForElement(type: ElementType): string {
		switch (type) {
			case "number":
				return "number";
			case "checkbox":
				return "boolean";
			case "checkboxes":
				return "string[]";
			case "signature":
				return "string";
			default:
				return "string";
		}
	}

	function jsonSchemaTypeForElement(type: ElementType): {
		type: string;
		items?: { type: string };
	} {
		switch (type) {
			case "number":
				return { type: "number" };
			case "checkbox":
				return { type: "boolean" };
			case "checkboxes":
				return { type: "array", items: { type: "string" } };
			default:
				return { type: "string" };
		}
	}

	function sanitizeFieldName(name: string): string {
		const cleaned = name.replace(/[^a-zA-Z0-9_$]/g, "_").replace(/^(\d)/, "_$1");
		return cleaned || "field";
	}

	type FormElement = FormWithElements["elements"][number];

	function getFieldElements(elements: FormElement[], parentId: number | null = null) {
		return elements
			.filter((el) => el.parentId === parentId && !layoutTypes.includes(el.type))
			.sort((a, b) => parseFloat(a.position) - parseFloat(b.position));
	}

	function getFieldName(el: FormElement): string {
		const label = el.config && "label" in el.config ? el.config.label : undefined;
		return el.name || sanitizeFieldName(label || `field_${el.id}`);
	}

	function getFieldLabel(el: FormElement): string | undefined {
		return el.config && "label" in el.config ? el.config.label : undefined;
	}

	// --- TypeScript generation ---

	function generateTypeScript(): string {
		if (!form.value) return "// טופס לא נמצא";

		const elements = form.value.elements.filter((el) => !el.isDeleted);
		const topLevel = getFieldElements(elements, null);

		const lines: string[] = [];
		lines.push(`type FormSubmission = {`);

		for (const el of topLevel) {
			const label = getFieldLabel(el);
			const fieldName = getFieldName(el);
			const optional = !el.isRequired ? "?" : "";

			if (el.type === "repeater") {
				const children = getFieldElements(elements, el.id);
				if (children.length > 0) {
					lines.push(`  /** ${label || fieldName} */`);
					lines.push(`  ${fieldName}${optional}: Array<{`);
					for (const child of children) {
						const childLabel = getFieldLabel(child);
						const childName = getFieldName(child);
						const childOptional = !child.isRequired ? "?" : "";
						const childType = tsTypeForElement(child.type);
						if (childLabel) lines.push(`    /** ${childLabel} */`);
						lines.push(`    ${childName}${childOptional}: ${childType};`);
					}
					lines.push(`  }>;`);
				} else {
					if (label) lines.push(`  /** ${label} */`);
					lines.push(`  ${fieldName}${optional}: Array<Record<string, unknown>>;`);
				}
			} else {
				const tsType = tsTypeForElement(el.type);
				if (label) lines.push(`  /** ${label} */`);
				lines.push(`  ${fieldName}${optional}: ${tsType};`);
			}
		}

		lines.push(`};`);
		return lines.join("\n");
	}

	// --- JSON Schema generation ---

	function generateJsonSchema(): string {
		if (!form.value) return "{}";

		const elements = form.value.elements.filter((el) => !el.isDeleted);
		const topLevel = getFieldElements(elements, null);

		const properties: Record<string, any> = {};
		const required: string[] = [];

		for (const el of topLevel) {
			const label = getFieldLabel(el);
			const fieldName = getFieldName(el);

			if (el.type === "repeater") {
				const children = getFieldElements(elements, el.id);
				if (children.length > 0) {
					const childProps: Record<string, any> = {};
					const childRequired: string[] = [];
					for (const child of children) {
						const childLabel = getFieldLabel(child);
						const childName = getFieldName(child);
						childProps[childName] = {
							...jsonSchemaTypeForElement(child.type),
							...(childLabel ? { description: childLabel } : {}),
						};
						if (child.isRequired) childRequired.push(childName);
					}
					properties[fieldName] = {
						type: "array",
						...(label ? { description: label } : {}),
						items: {
							type: "object",
							properties: childProps,
							...(childRequired.length > 0 ? { required: childRequired } : {}),
						},
					};
				} else {
					properties[fieldName] = {
						type: "array",
						...(label ? { description: label } : {}),
						items: { type: "object" },
					};
				}
			} else {
				properties[fieldName] = {
					...jsonSchemaTypeForElement(el.type),
					...(label ? { description: label } : {}),
				};
			}

			if (el.isRequired) required.push(fieldName);
		}

		const schema = {
			$schema: "https://json-schema.org/draft/2020-12/schema",
			title: "FormSubmission",
			description: form.value.title,
			type: "object",
			properties,
			...(required.length > 0 ? { required } : {}),
		};

		return JSON.stringify(schema, null, 2);
	}

	const tsCode = computed(() => generateTypeScript());
	const jsonSchemaCode = computed(() => generateJsonSchema());

	const COLLAPSED_LINES = 15;

	const expandedTs = ref(false);
	const expandedJson = ref(false);

	const tsLines = computed(() => tsCode.value.split("\n"));
	const jsonLines = computed(() => jsonSchemaCode.value.split("\n"));

	const visibleTsCode = computed(() =>
		expandedTs.value || tsLines.value.length <= COLLAPSED_LINES
			? tsCode.value
			: tsLines.value.slice(0, COLLAPSED_LINES).join("\n"),
	);

	const visibleJsonCode = computed(() =>
		expandedJson.value || jsonLines.value.length <= COLLAPSED_LINES
			? jsonSchemaCode.value
			: jsonLines.value.slice(0, COLLAPSED_LINES).join("\n"),
	);
</script>
