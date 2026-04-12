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
	<div class="space-y-1 bg-primary-foreground rounded-md">
		<button
			type="button"
			class="flex items-center gap-2 text-sm font-medium text-gray-900 hover:text-gray-700 cursor-pointer p-4 w-full hover:bg-black/2 rounded-md"
			@click="showAdditionalData = !showAdditionalData"
		>
			<Icon
				name="heroicons:chevron-left"
				class="h-4 w-4 transition-transform"
				:class="{ '-rotate-90': showAdditionalData }"
			/>
			נתונים נוספים
		</button>

		<div v-if="showAdditionalData" class="space-y-2 px-4 pb-6">
			<div v-for="(row, index) in rows" :key="index" class="flex items-center gap-2">
				<UiInput
					v-model="row.key"
					type="text"
					placeholder="מפתח"
					class="flex-1 bg-background"
				/>
				<UiInput
					v-model="row.value"
					type="text"
					placeholder="ערך"
					class="flex-1 bg-background"
				/>
				<UiButton type="button" variant="ghost" @click="removeRow(index)">
					<Icon name="heroicons:x-mark" class="h-4 w-4" />
				</UiButton>
			</div>
			<UiButton type="button" variant="link" @click="addRow">
				<Icon name="heroicons:plus" class="h-4 w-4" />
				הוסף שדה
			</UiButton>
		</div>
	</div>
</template>
