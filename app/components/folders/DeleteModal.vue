<script setup lang="ts">
	import type { Folder } from "~/types/form-builder";

	interface Props {
		modelValue: boolean;
		folder: Folder | null;
		formCount: number;
	}

	defineProps<Props>();

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
		title="מחיקת תיקייה"
		size="sm"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<div class="space-y-4">
			<!-- Warning Icon -->
			<div class="flex justify-center">
				<div class="rounded-full bg-red-100 p-3">
					<Icon name="mdi:alert" class="h-8 w-8 text-red-600" />
				</div>
			</div>

			<!-- Warning Message -->
			<div class="text-center">
				<p class="text-sm text-gray-700">
					האם אתה בטוח שברצונך למחוק את התיקייה
					<span class="font-semibold">{{ folder?.name }}</span
					>?
				</p>
				<p v-if="formCount > 0" class="mt-2 text-sm text-red-600 font-medium">
					פעולה זו תמחק גם {{ formCount }} טפסים שנמצאים בתיקייה זו.
				</p>
				<p v-else class="mt-2 text-sm text-gray-500">התיקייה ריקה ואין בה טפסים.</p>
			</div>

			<!-- Additional Warning -->
			<div class="rounded-lg bg-red-50 p-3">
				<p class="text-xs text-red-700 text-center">
					פעולה זו היא בלתי הפיכה ולא ניתן לשחזר את התיקייה והטפסים לאחר המחיקה.
				</p>
			</div>
		</div>

		<template #footer>
			<BaseButton variant="secondary" @click="close">ביטול</BaseButton>
			<BaseButton variant="danger" @click="handleDelete">מחיקה</BaseButton>
		</template>
	</BaseModal>
</template>
