<script setup lang="ts">
	import {
		type FormListItem,
		type FormStatusKey,
		formStatusLabels,
	} from "~/types/FormListItem";

	interface Props {
		modelValue: boolean;
		form: FormListItem | null;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:modelValue": [value: boolean];
		confirm: [status: FormStatusKey];
	}>();

	const selectedStatus = ref<FormStatusKey>("draft");

	watch(
		() => props.modelValue,
		(isOpen) => {
			if (isOpen && props.form) selectedStatus.value = props.form.status;
		},
	);

	const close = () => emit("update:modelValue", false);

	const handleConfirm = () => {
		emit("confirm", selectedStatus.value);
		close();
	};

	const statusOptions: { key: FormStatusKey; icon: string }[] = [
		{ key: "draft", icon: "heroicons:pencil" },
		{ key: "published", icon: "heroicons:globe-alt" },
		{ key: "archived", icon: "heroicons:archive-box" },
	];

	const isCurrentStatus = computed(() => selectedStatus.value === props.form?.status);
</script>

<template>
	<BaseModal
		:model-value="modelValue"
		title="שינוי סטטוס"
		size="sm"
		@update:model-value="emit('update:modelValue', $event)"
	>
		<div class="space-y-4">
			<div class="rounded-lg bg-gray-50 p-3">
				<p class="text-sm text-gray-600">טופס:</p>
				<p class="text-sm font-semibold text-gray-900 truncate">{{ form?.title }}</p>
			</div>

			<div class="space-y-2">
				<label class="block text-sm font-medium text-gray-700">בחר סטטוס:</label>

				<div class="space-y-2">
					<button
						v-for="option in statusOptions"
						:key="option.key"
						type="button"
						class="w-full rounded-lg px-4 py-3 text-right transition-colors"
						:class="
							selectedStatus === option.key
								? 'bg-blue-50 border-2 border-blue-500'
								: 'border border-gray-300 bg-white hover:bg-gray-50'
						"
						@click="selectedStatus = option.key"
					>
						<div class="flex items-center gap-3">
							<div
								class="flex h-5 w-5 items-center justify-center rounded-full border-2"
								:class="
									selectedStatus === option.key
										? 'border-blue-500'
										: 'border-gray-300'
								"
							>
								<div
									v-if="selectedStatus === option.key"
									class="h-2.5 w-2.5 rounded-full bg-blue-500"
								/>
							</div>
							<Icon :name="option.icon" class="h-5 w-5 text-gray-600" />
							<span class="text-sm font-medium text-gray-900">{{
								formStatusLabels[option.key].label
							}}</span>
							<span
								class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium mr-auto"
								:class="formStatusLabels[option.key].classNames"
							>
								{{ formStatusLabels[option.key].label }}
							</span>
						</div>
					</button>
				</div>
			</div>
		</div>

		<template #footer>
			<BaseButton variant="secondary" @click="close">ביטול</BaseButton>
			<BaseButton variant="primary" :disabled="isCurrentStatus" @click="handleConfirm">
				שינוי סטטוס
			</BaseButton>
		</template>
	</BaseModal>
</template>
