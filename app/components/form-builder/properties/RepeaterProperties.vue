<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface RepeaterConfig {
	label?: string;
	helpText?: string;
	minItems?: number;
	maxItems?: number;
	addButtonText?: string;
	bordered?: boolean;
	backgroundColor?: string;
}

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:config": [config: Partial<RepeaterConfig>];
	"update:name": [name: string];
}>();

const config = computed(() => props.element.config as RepeaterConfig);

const isFixedLength = computed(() => {
	const min = config.value.minItems ?? 1;
	const max = config.value.maxItems;
	return max !== undefined && min === max;
});

function updateMinItems(value: string) {
	const num = parseInt(value);
	emit("update:config", { minItems: isNaN(num) ? 1 : Math.max(0, num) });
}

function updateMaxItems(value: string) {
	if (value === "" || value === undefined) {
		emit("update:config", { maxItems: undefined });
	} else {
		const num = parseInt(value);
		if (!isNaN(num) && num >= (config.value.minItems ?? 1)) {
			emit("update:config", { maxItems: num });
		}
	}
}

function clearMaxLimit() {
	emit("update:config", { maxItems: undefined });
}
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">הגדרות חזרה</h3>

		<!-- Field name -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">שם שדה</label>
			<UiInput
				:model-value="element.name || ''"
				placeholder="e.g., contacts"
				@update:model-value="emit('update:name', String($event))"
			/>
			<p class="mt-1 text-xs text-gray-500">שם זה ישמש לזיהוי הנתונים בהגשות</p>
		</div>

		<!-- Label -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">תווית</label>
			<UiInput
				:model-value="config.label || ''"
				placeholder="שדה חזרה"
				@update:model-value="emit('update:config', { label: String($event) })"
			/>
		</div>

		<!-- Help text -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">טקסט עזרה</label>
			<UiInput
				:model-value="config.helpText || ''"
				placeholder="הסבר לשדה..."
				@update:model-value="emit('update:config', { helpText: String($event) })"
			/>
		</div>

		<!-- Min items -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">מינימום פריטים</label>
			<UiInput
				type="number"
				:model-value="String(config.minItems ?? 1)"
				min="0"
				@update:model-value="updateMinItems(String($event))"
			/>
		</div>

		<!-- Max items -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">מקסימום פריטים</label>
			<div class="flex gap-2">
				<UiInput
					type="number"
					:model-value="config.maxItems !== undefined ? String(config.maxItems) : ''"
					:min="String(config.minItems ?? 1)"
					placeholder="ללא הגבלה"
					class="flex-1"
					@update:model-value="updateMaxItems(String($event))"
				/>
				<button
					v-if="config.maxItems !== undefined"
					type="button"
					class="rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-100"
					@click="clearMaxLimit"
				>
					<Icon name="heroicons:x-mark" class="h-4 w-4" />
				</button>
			</div>
			<p v-if="isFixedLength" class="mt-1 text-xs text-blue-600">
				מספר קבוע של {{ config.minItems }} פריטים
			</p>
		</div>

		<!-- Add button text -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">טקסט כפתור הוספה</label>
			<UiInput
				:model-value="config.addButtonText || ''"
				placeholder="הוסף עוד"
				@update:model-value="emit('update:config', { addButtonText: String($event) })"
			/>
		</div>

		<!-- Visual options -->
		<div class="space-y-3 border-t border-gray-100 pt-4">
			<h4 class="text-sm font-medium text-gray-600">עיצוב</h4>

			<!-- Bordered -->
			<label class="flex cursor-pointer items-center gap-2">
				<input
					type="checkbox"
					:checked="config.bordered !== false"
					class="h-4 w-4 rounded border-gray-300"
					@change="emit('update:config', { bordered: ($event.target as HTMLInputElement).checked })"
				/>
				<span class="text-sm text-gray-600">הצג מסגרת</span>
			</label>

			<!-- Background color -->
			<div>
				<label class="mb-1 block text-sm text-gray-600">צבע רקע</label>
				<div class="flex gap-2">
					<input
						type="color"
						:value="config.backgroundColor || '#f9fafb'"
						class="h-9 w-12 cursor-pointer rounded border border-gray-200"
						@input="emit('update:config', { backgroundColor: ($event.target as HTMLInputElement).value })"
					/>
					<UiInput
						:model-value="config.backgroundColor || '#f9fafb'"
						class="flex-1"
						@update:model-value="emit('update:config', { backgroundColor: String($event) })"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
