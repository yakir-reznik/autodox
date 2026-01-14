<template>
	<div :key="form.id" class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md">
		<div class="flex items-start justify-between">
			<div class="flex-1">
				<h3 class="font-medium text-gray-900">
					{{ form.title }}
				</h3>
				<p v-if="form.description" class="mt-1 text-sm text-gray-500 line-clamp-2">
					{{ form.description }}
				</p>
			</div>
			<span
				class="shrink-0 rounded-full px-2 py-1 text-xs font-medium"
				:class="getFormStatusLabelClasses(form.status)"
			>
				{{ getFormStatusLabel(form.status) }}
			</span>
		</div>
		<div class="mt-4 flex items-center justify-between">
			<div class="text-sm text-gray-500">עודכן ב {{ formatDate(form.updatedAt) }}</div>
			<div
				v-if="form.folderName"
				class="text-xs text-indigo-800 bg-indigo-100 rounded px-2 py-1"
			>
				{{ form.folderName }}
			</div>
		</div>
		<div class="mt-6 flex flex-col gap-2">
			<NuxtLink :to="`/edit/${form.id}`">
				<UiButton variant="primary" class="w-full">
					<Icon name="heroicons:pencil-square" class="h-4 w-4" />
					עריכה
				</UiButton>
			</NuxtLink>
			<div class="flex gap-2">
				<NuxtLink :to="`/fill/${form.id}`" class="flex-1">
					<UiButton variant="secondary" class="w-full">
						<Icon name="heroicons:document-text" class="h-4 w-4" />
						מילוי
					</UiButton>
				</NuxtLink>
				<NuxtLink :to="`/submissions/${form.id}`" class="flex-1">
					<UiButton variant="secondary" class="w-full">
						<Icon name="heroicons:inbox" class="h-4 w-4" />
						הגשות
					</UiButton>
				</NuxtLink>
			</div>
			<UiButton variant="ghost" size="sm" class="w-full" @click="handleMoveForm(form)">
				<Icon name="mdi:folder-move" class="h-4 w-4" />
				העברה לתיקייה
			</UiButton>
		</div>
	</div>
</template>

<script setup lang="ts">
	import {
		type FormListItem,
		getFormStatusLabel,
		getFormStatusLabelClasses,
	} from "~/types/FormListItem";

	const { form } = defineProps<{
		form: FormListItem;
	}>();

	const emit = defineEmits<{
		moveForm: [form: FormListItem];
	}>();

	function handleMoveForm(form: FormListItem) {
		emit("moveForm", form);
	}
</script>

<style lang="sass" scoped></style>
