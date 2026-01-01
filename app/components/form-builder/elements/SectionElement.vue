<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
}

const props = defineProps<Props>();

const config = computed(() => props.element.config as {
	title?: string;
	description?: string;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	bordered?: boolean;
	backgroundColor?: string;
});

const isCollapsed = ref(config.value.defaultCollapsed || false);

function toggleCollapse() {
	if (config.value.collapsible) {
		isCollapsed.value = !isCollapsed.value;
	}
}

const sectionStyle = computed(() => ({
	backgroundColor: config.value.backgroundColor || "transparent",
}));
</script>

<template>
	<div
		class="rounded-lg"
		:class="{ 'border border-gray-200': config.bordered }"
		:style="sectionStyle"
	>
		<!-- Section header -->
		<div
			v-if="config.title || config.collapsible"
			class="flex items-center justify-between px-4 py-3"
			:class="{ 'cursor-pointer': config.collapsible }"
			@click="toggleCollapse"
		>
			<div>
				<h4 v-if="config.title" class="font-medium text-gray-900">
					{{ config.title }}
				</h4>
				<p v-if="config.description" class="mt-0.5 text-sm text-gray-500">
					{{ config.description }}
				</p>
			</div>
			<button
				v-if="config.collapsible"
				type="button"
				class="text-gray-400 transition-transform"
				:class="{ 'rotate-180': !isCollapsed }"
			>
				<Icon name="heroicons:chevron-down" class="h-5 w-5" />
			</button>
		</div>

		<!-- Section content placeholder -->
		<div v-show="!isCollapsed" class="px-4 pb-4">
			<slot />
		</div>
	</div>
</template>
