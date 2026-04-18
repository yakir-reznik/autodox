<script setup lang="ts">
	import type {
		BuilderElement,
		GridAxis,
		GridBreakpointConfig,
	} from "~/types/form-builder";

	type GridConfig = {
		desktop: GridBreakpointConfig;
		mobile: GridBreakpointConfig;
	};

	type Breakpoint = "desktop" | "mobile";

	interface Props {
		element: BuilderElement;
	}

	const props = defineProps<Props>();

	const emit = defineEmits<{
		"update:config": [config: Partial<GridConfig>];
	}>();

	const config = computed(() => props.element.config as GridConfig);

	const axisOptions: { value: GridAxis; label: string }[] = [
		{ value: "start", label: "התחלה" },
		{ value: "center", label: "מרכז" },
		{ value: "end", label: "סוף" },
		{ value: "stretch", label: "מתיחה" },
	];

	function updateField<K extends keyof GridBreakpointConfig>(
		breakpoint: Breakpoint,
		key: K,
		value: GridBreakpointConfig[K],
	) {
		emit("update:config", {
			[breakpoint]: { ...config.value[breakpoint], [key]: value },
		} as Partial<GridConfig>);
	}

	function parseColumns(raw: string): number {
		const n = parseInt(raw, 10);
		if (isNaN(n)) return 1;
		return Math.min(12, Math.max(1, n));
	}
</script>

<template>
	<div class="space-y-6">
		<h3 class="text-sm font-medium text-gray-700">הגדרות רשת</h3>

		<div
			v-for="bp in (['desktop', 'mobile'] as Breakpoint[])"
			:key="bp"
			class="space-y-3 border-t border-gray-100 pt-4 first:border-t-0 first:pt-0"
		>
			<h4 class="text-sm font-medium text-gray-600">
				{{ bp === "desktop" ? "שולחן עבודה" : "מובייל" }}
			</h4>

			<div>
				<label class="mb-1 block text-sm text-gray-600">מספר עמודות</label>
				<BaseInput
					type="number"
					min="1"
					max="12"
					:model-value="String(config[bp].columns)"
					@update:model-value="
						updateField(bp, 'columns', parseColumns(String($event)))
					"
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm text-gray-600">רווח</label>
				<BaseInput
					:model-value="config[bp].gap"
					placeholder="1rem"
					@update:model-value="updateField(bp, 'gap', String($event))"
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm text-gray-600">יישור אופקי</label>
				<select
					:value="config[bp].justify"
					class="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
					@change="
						updateField(
							bp,
							'justify',
							($event.target as HTMLSelectElement).value as GridAxis,
						)
					"
				>
					<option v-for="opt in axisOptions" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
			</div>

			<div>
				<label class="mb-1 block text-sm text-gray-600">יישור אנכי</label>
				<select
					:value="config[bp].align"
					class="block w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
					@change="
						updateField(
							bp,
							'align',
							($event.target as HTMLSelectElement).value as GridAxis,
						)
					"
				>
					<option v-for="opt in axisOptions" :key="opt.value" :value="opt.value">
						{{ opt.label }}
					</option>
				</select>
			</div>
		</div>
	</div>
</template>
