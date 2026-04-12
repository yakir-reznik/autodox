<script setup lang="ts">
	type Props = {
		rows: { key: string; value: string }[];
	};

	const props = defineProps<Props>();

	const showAdditionalData = ref(false);

	function addRow() {
		props.rows.push({ key: "", value: "" });
	}

	function removeRow(index: number) {
		props.rows.splice(index, 1);
	}
</script>

<template>
	<div class="space-y-3">
		<button
			type="button"
			class="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700"
			@click="showAdditionalData = !showAdditionalData"
		>
			<Icon
				name="heroicons:chevron-left"
				class="h-4 w-4 transition-transform"
				:class="{ '-rotate-90': showAdditionalData }"
			/>
			נתונים נוספים
		</button>

		<div v-if="showAdditionalData" class="space-y-2 pr-6">
			<div
				v-for="(row, index) in rows"
				:key="index"
				class="flex items-center gap-2"
			>
				<UiInput v-model="row.key" type="text" placeholder="מפתח" class="flex-1" />
				<UiInput v-model="row.value" type="text" placeholder="ערך" class="flex-1" />
				<button
					type="button"
					class="text-gray-400 hover:text-red-500 transition-colors"
					@click="removeRow(index)"
				>
					<Icon name="heroicons:x-mark" class="h-4 w-4" />
				</button>
			</div>
			<button
				type="button"
				class="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
				@click="addRow"
			>
				<Icon name="heroicons:plus" class="h-4 w-4" />
				הוסף שדה
			</button>
		</div>
	</div>
</template>
