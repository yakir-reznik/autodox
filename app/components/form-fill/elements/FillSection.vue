<script setup lang="ts">
import type { BuilderElement } from "~/types/form-builder";

interface Props {
	element: BuilderElement;
	getChildren: (parentClientId: string) => BuilderElement[];
	formData: Record<string, any>;
	errors: Record<string, string>;
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:modelValue": [value: any];
}>();

const config = computed(() => props.element.config as {
	title?: string;
	description?: string;
	collapsible?: boolean;
	defaultCollapsed?: boolean;
	bordered?: boolean;
	backgroundColor?: string;
});

const isCollapsed = ref(config.value.defaultCollapsed || false);

const children = computed(() => props.getChildren(props.element.clientId));

const sectionClass = computed(() => {
	const classes = ["form-fill-section"];
	if (config.value.bordered) {
		classes.push("bordered");
	}
	return classes.join(" ");
});

const sectionStyle = computed(() => {
	if (config.value.backgroundColor) {
		return { backgroundColor: config.value.backgroundColor };
	}
	return {};
});

function toggleCollapse() {
	if (config.value.collapsible) {
		isCollapsed.value = !isCollapsed.value;
	}
}

// Bubble up form data changes
function updateChildData(clientId: string, value: any) {
	// The parent FormFill handles the formData directly
	// We need to emit the update for the child
	props.formData[clientId] = value;
}
</script>

<template>
	<div :class="sectionClass" :style="sectionStyle">
		<!-- Section header -->
		<div
			v-if="config.title"
			class="form-fill-section-header"
			:class="{ 'form-fill-section-toggle': config.collapsible }"
			@click="toggleCollapse"
		>
			<div class="flex items-center justify-between">
				<h4 class="form-fill-section-title">{{ config.title }}</h4>
				<Icon
					v-if="config.collapsible"
					:name="isCollapsed ? 'heroicons:chevron-down' : 'heroicons:chevron-up'"
					class="h-5 w-5 text-gray-500"
				/>
			</div>
			<p v-if="config.description" class="form-fill-section-description">
				{{ config.description }}
			</p>
		</div>

		<!-- Section content -->
		<div v-show="!isCollapsed" class="form-fill-section-content">
			<FormFillFormField
				v-for="child in children"
				:key="child.clientId"
				:element="child"
				:get-children="getChildren"
				:model-value="formData[child.clientId]"
				:error="errors[child.clientId]"
				:form-data="formData"
				:errors="errors"
				@update:model-value="updateChildData(child.clientId, $event)"
			/>
		</div>
	</div>
</template>
