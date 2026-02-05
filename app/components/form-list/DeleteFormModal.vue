<script setup lang="ts">
	import type { FormListItem } from "~/types/FormListItem";

	defineProps<{
		modelValue: boolean;
		form: FormListItem | null;
	}>();

	const emit = defineEmits<{
		"update:modelValue": [value: boolean];
		confirm: [];
	}>();

	const close = () => emit("update:modelValue", false);

	const handleDelete = () => {
		emit("confirm");
		close();
	};
</script>

<template>
	<BaseModal
		:model-value="modelValue"
		title="מחיקת טופס"
		size="sm"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<div class="space-y-4">
			<div class="flex justify-center">
				<div class="rounded-full bg-red-100 p-3">
					<Icon name="mdi:alert" class="h-8 w-8 text-red-600" />
				</div>
			</div>

			<div class="text-center">
				<p class="text-sm text-gray-700">
					האם אתה בטוח שברצונך למחוק את הטופס
					<span class="font-semibold">{{ form?.title }}</span
					>?
				</p>
			</div>

			<div class="rounded-lg bg-red-50 p-3">
				<p class="text-xs text-red-700 text-center">
					פעולה זו היא בלתי הפיכה ולא ניתן לשחזר את הטופס לאחר המחיקה.
				</p>
			</div>
		</div>

		<template #footer>
			<BaseButton variant="secondary" @click="close">ביטול</BaseButton>
			<BaseButton variant="danger" @click="handleDelete">מחיקה</BaseButton>
		</template>
	</BaseModal>
</template>
