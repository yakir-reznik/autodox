<script setup lang="ts">
	import type {
		BuilderElement,
		GridBreakpointConfig,
	} from "~/types/form-builder";

	type GridConfig = {
		desktop: GridBreakpointConfig;
		mobile: GridBreakpointConfig;
	};

	interface Props {
		element: BuilderElement;
		getChildren: (parentClientId: string) => BuilderElement[];
		formData: Record<string, any>;
		errors: Record<string, string>;
		readonly?: boolean;
		getConditionRequired?: (clientId: string) => boolean;
	}

	const props = defineProps<Props>();

	const config = computed(() => props.element.config as GridConfig);
	const children = computed(() => props.getChildren(props.element.clientId));

	const gridVars = computed(() => {
		const d = config.value.desktop;
		const m = config.value.mobile;
		return {
			"--grid-cols-m": String(m.columns),
			"--grid-cols-d": String(d.columns),
			"--grid-gap-m": m.gap,
			"--grid-gap-d": d.gap,
			"--grid-justify-m": m.justify,
			"--grid-justify-d": d.justify,
			"--grid-align-m": m.align,
			"--grid-align-d": d.align,
		} as Record<string, string>;
	});

	function updateChildData(clientId: string, value: any) {
		props.formData[clientId] = value;
	}
</script>

<template>
	<div class="form-fill-grid" :style="gridVars">
		<FormFillFormField
			v-for="child in children"
			:key="child.clientId"
			:element="child"
			:get-children="getChildren"
			:model-value="formData[child.clientId]"
			:error="errors[child.clientId]"
			:form-data="formData"
			:errors="errors"
			:readonly="readonly"
			:condition-required="getConditionRequired?.(child.clientId)"
			:get-condition-required="getConditionRequired"
			@update:model-value="updateChildData(child.clientId, $event)"
		/>
	</div>
</template>

<style scoped>
	.form-fill-grid {
		display: grid;
		grid-template-columns: repeat(var(--grid-cols-m), minmax(0, 1fr));
		gap: var(--grid-gap-m);
		justify-items: var(--grid-justify-m);
		align-items: var(--grid-align-m);
	}

	@media (min-width: 768px) {
		.form-fill-grid {
			grid-template-columns: repeat(var(--grid-cols-d), minmax(0, 1fr));
			gap: var(--grid-gap-d);
			justify-items: var(--grid-justify-d);
			align-items: var(--grid-align-d);
		}
	}
</style>
