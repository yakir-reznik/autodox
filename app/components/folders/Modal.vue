<script setup lang="ts">
import type { Folder } from "~/types/form-builder";

interface Props {
	modelValue: boolean;
	mode: "create" | "rename";
	folder?: Folder | null;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: boolean];
	submit: [name: string];
}>();

const folderName = ref("");
const inputRef = ref<HTMLInputElement | null>(null);

// Reset form and focus input when modal opens
watch(
	() => props.modelValue,
	async (isOpen) => {
		if (isOpen) {
			folderName.value = props.mode === "rename" && props.folder ? props.folder.name : "";
			await nextTick();
			inputRef.value?.focus();
		}
	},
);

const close = () => emit("update:modelValue", false);

const handleSubmit = () => {
	const name = folderName.value.trim();
	if (!name) return;
	emit("submit", name);
	close();
};

const title = computed(() => (props.mode === "create" ? "תיקייה חדשה" : "שינוי שם תיקייה"));
const submitLabel = computed(() => (props.mode === "create" ? "יצירה" : "שמירה"));
</script>

<template>
	<UiModal :model-value="modelValue" :title="title" size="sm" @update:model-value="emit('update:modelValue', $event)">
		<form @submit.prevent="handleSubmit">
			<UiInput
				ref="inputRef"
				v-model="folderName"
				name="folderName"
				label="שם התיקייה"
				placeholder="הזן שם תיקייה..."
			/>
		</form>

		<template #footer>
			<UiButton variant="secondary" @click="close">ביטול</UiButton>
			<UiButton variant="primary" :disabled="!folderName.trim()" @click="handleSubmit">
				{{ submitLabel }}
			</UiButton>
		</template>
	</UiModal>
</template>
