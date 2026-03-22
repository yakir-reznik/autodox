<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";
import { getInterpolatableFields } from "~/utils/interpolate";

interface Props {
	elements: BuilderElement[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
	select: [fieldName: string];
	close: [];
}>();

const search = ref("");

const fields = computed(() => getInterpolatableFields(props.elements));

const filteredFields = computed(() => {
	if (!search.value) return fields.value;
	const q = search.value.toLowerCase();
	return fields.value.filter(
		(f) => f.label.toLowerCase().includes(q) || f.name.toLowerCase().includes(q),
	);
});

function selectField(fieldName: string) {
	emit("select", fieldName);
	emit("close");
}

function onClickOutside(event: MouseEvent) {
	const target = event.target as HTMLElement;
	if (!target.closest(".interpolation-picker")) {
		emit("close");
	}
}

onMounted(() => {
	document.addEventListener("click", onClickOutside, true);
});

onUnmounted(() => {
	document.removeEventListener("click", onClickOutside, true);
});
</script>

<template>
	<div class="interpolation-picker absolute left-0 right-0 z-50 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
		<div class="p-2">
			<input
				v-model="search"
				type="text"
				placeholder="חפש שדה..."
				class="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
			/>
		</div>

		<div v-if="filteredFields.length === 0" class="px-3 py-4 text-center text-sm text-gray-500">
			אין שדות זמינים
		</div>

		<ul v-else class="max-h-48 overflow-y-auto px-1 pb-1">
			<li
				v-for="field in filteredFields"
				:key="field.clientId"
				class="cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-blue-50"
				@click="selectField(field.name)"
			>
				<span class="text-gray-900">{{ field.label }}</span>
				<span class="mr-1 text-xs text-gray-400">({{ field.name }})</span>
			</li>
		</ul>
	</div>
</template>
