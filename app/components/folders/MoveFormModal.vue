<script setup lang="ts">
	import type { Folder } from "~/types/form-builder";

	interface Props {
		modelValue: boolean;
		folders: Folder[];
		currentFolderId: number | null;
		formTitle: string;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:modelValue": [value: boolean];
		move: [folderId: number | null];
	}>();

	const selectedFolderId = ref<number | null>(null);

	// Initialize selected folder when modal opens
	watch(
		() => props.modelValue,
		(isOpen) => {
			if (isOpen) selectedFolderId.value = props.currentFolderId;
		},
	);

	const close = () => emit("update:modelValue", false);

	const handleMove = () => {
		emit("move", selectedFolderId.value);
		close();
	};

	// Folder options including "unfiled"
	const folderOptions = computed(() => [
		{ id: null, name: "ללא תיקייה", icon: "mdi:folder-open-outline" },
		...props.folders.map((f) => ({ id: f.id, name: f.name, icon: "mdi:folder" })),
	]);

	const isCurrentFolder = computed(() => selectedFolderId.value === props.currentFolderId);
</script>

<template>
	<BaseModal
		:model-value="modelValue"
		title="העברת טופס לתיקייה"
		size="md"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<div class="space-y-4">
			<!-- Form Title -->
			<div class="rounded-lg bg-gray-50 p-3">
				<p class="text-sm text-gray-600">טופס:</p>
				<p class="text-sm font-semibold text-gray-900 truncate">{{ formTitle }}</p>
			</div>

			<!-- Folder Selection -->
			<div class="space-y-2">
				<label class="block text-sm font-medium text-gray-700">בחר תיקייה:</label>

				<div class="space-y-2 max-h-72 overflow-y-auto">
					<button
						v-for="option in folderOptions"
						:key="option.id ?? 'unfiled'"
						type="button"
						class="w-full rounded-lg px-4 py-3 text-right transition-colors"
						:class="
							selectedFolderId === option.id
								? 'bg-blue-50 border-2 border-blue-500'
								: 'border border-gray-300 bg-white hover:bg-gray-50'
						"
						@click="selectedFolderId = option.id"
					>
						<div class="flex items-center gap-3">
							<div
								class="flex h-5 w-5 items-center justify-center rounded-full border-2"
								:class="
									selectedFolderId === option.id
										? 'border-blue-500'
										: 'border-gray-300'
								"
							>
								<div
									v-if="selectedFolderId === option.id"
									class="h-2.5 w-2.5 rounded-full bg-blue-500"
								/>
							</div>
							<Icon :name="option.icon" class="h-5 w-5 text-gray-600" />
							<span class="text-sm font-medium text-gray-900 flex-1 truncate">{{
								option.name
							}}</span>
						</div>
					</button>
				</div>
			</div>
		</div>

		<template #footer>
			<BaseButton variant="secondary" @click="close">ביטול</BaseButton>
			<BaseButton variant="primary" :disabled="isCurrentFolder" @click="handleMove"
				>העברה</BaseButton
			>
		</template>
	</BaseModal>
</template>
