<template>
	<h1>Vue Draggable test</h1>
	<div class="w-3xl mx-auto py-24">
		<draggable
			class="list-group flex flex-row gap-2 flex-wrap rtl"
			item-key="id"
			tag="ul"
			v-model="list"
			:animation="200"
			@start="isDragging = true"
			@end="isDragging = false"
			:invertSwap="false"
		>
			<template #item="{ element }">
				<li
					class="list-group-item p-4 bg-blue-100 border-blue-600 border rtl flex-basis-1 w-1/4"
				>
					{{ element.label }}
				</li>
			</template>
		</draggable>
	</div>
</template>

<script setup lang="ts">
	import draggable from "vuedraggable";

	const isDragging = ref(false);

	const list = ref([
		{
			id: 1,
			label: "פריט מספר 1",
			order: 1,
		},
		{
			id: 2,
			label: "פריט מספר 2",
			order: 2,
		},
		{
			id: 3,
			label: "פריט מספר 3",
			order: 3,
		},
		{
			id: 4,
			label: "פריט מספר 4",
			order: 4,
		},
		{
			id: 5,
			label: "פריט מספר 5",
			order: 5,
		},
		{
			id: 6,
			label: "פריט מספר 6",
			order: 6,
		},
		{
			id: 7,
			label: "פריט מספר 7",
			order: 7,
		},
	]);
</script>

<style lang="css" scoped></style>
