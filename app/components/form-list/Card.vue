<template>
	<div
		:key="form.id"
		class="group flex flex-col h-full rounded-md border border-gray-200 bg-white p-6 transition-all hover:border-gray-300 hover:shadow-sm"
	>
		<!-- Header: Title & Description -->
		<div class="mb-4">
			<h3 class="text-lg font-semibold text-gray-900 leading-tight">
				{{ form.title }}
			</h3>
			<p
				v-if="form.description"
				class="mt-2 text-sm text-gray-600 line-clamp-2 leading-relaxed"
			>
				{{ form.description }}
			</p>
		</div>

		<!-- Metadata Row -->
		<div class="flex items-center gap-2 flex-wrap mb-5 pb-5 border-b border-gray-100">
			<span
				class="inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium"
				:class="getFormStatusLabelClasses(form.status)"
			>
				{{ getFormStatusLabel(form.status) }}
			</span>
			<div
				v-if="form.folderName"
				class="inline-flex items-center gap-1 text-xs text-indigo-700 bg-indigo-50 rounded-md px-2.5 py-0.5 font-medium"
			>
				<Icon name="mdi:folder-outline" class="h-3.5 w-3.5" />
				{{ form.folderName }}
			</div>
			<div class="mr-auto text-xs text-gray-500">
				{{ formatDate(form.updatedAt) }}
			</div>
		</div>

		<!-- Actions -->
		<div class="flex flex-col gap-2 mt-auto">
			<!-- Primary Action -->
			<NuxtLink :to="`/edit/${form.id}`">
				<BaseButton variant="primary" class="w-full justify-center">
					<Icon name="heroicons:pencil-square" class="h-4 w-4" />
					עריכה
				</BaseButton>
			</NuxtLink>

			<!-- Secondary Actions Grid -->
			<div class="grid grid-cols-3 gap-2">
				<NuxtLink :to="`/fill/${form.id}`">
					<BaseButton variant="secondary" class="w-full justify-center" size="sm">
						<Icon name="heroicons:document-text" class="h-4 w-4" />
						מילוי
					</BaseButton>
				</NuxtLink>
				<NuxtLink :to="`/submissions/${form.id}`">
					<BaseButton variant="secondary" class="w-full justify-center" size="sm">
						<Icon name="heroicons:inbox" class="h-4 w-4" />
						הגשות
					</BaseButton>
				</NuxtLink>
				<BaseButton
					variant="ghost"
					size="sm"
					class="w-full justify-center"
					@click="handleMoveForm(form)"
				>
					<Icon name="mdi:folder-move" class="h-4 w-4" />
					העבר
				</BaseButton>
			</div>
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
