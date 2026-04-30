<script setup lang="ts">
	import type { BuilderElement } from "~/types/form-builder";

	interface Props {
		element: BuilderElement;
		conflicts?: BuilderElement[];
	}

	const props = withDefaults(defineProps<Props>(), {
		conflicts: () => [],
	});

	const emit = defineEmits<{
		"update:name": [name: string];
		"update:config": [config: Record<string, any>];
		"update:required": [required: boolean];
		"select-field": [clientId: string];
	}>();

	const config = computed(
		() =>
			props.element.config as {
				label?: string;
				helpText?: string;
				validation?: { required?: boolean };
			},
	);

	function updateLabel(label: string) {
		emit("update:config", { label });
	}

	function updateHelpText(helpText: string) {
		emit("update:config", { helpText });
	}

	function conflictLabel(el: BuilderElement): string {
		const cfg = el.config as { label?: string };
		return cfg.label || el.name || el.clientId;
	}
</script>

<template>
	<div class="space-y-4">
		<h3 class="text-sm font-medium text-gray-700">Basic Settings</h3>

		<!-- Field name -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Field Name</label>
			<BaseInput
				:model-value="element.name || ''"
				placeholder="e.g., first_name"
				:class="conflicts.length > 0 ? 'border-red-400 focus:border-red-500' : ''"
				@update:model-value="$emit('update:name', String($event))"
			/>
			<p v-if="conflicts.length === 0" class="mt-1 text-xs text-gray-500">
				Used to identify this field in submissions
			</p>
			<div v-else class="mt-1 text-xs text-red-600">
				<p class="font-medium">
					שם השדה כפול ברמה הזו. תקנו את אחד מהשדות הבאים:
				</p>
				<ul class="mt-1 list-disc ps-4 space-y-0.5">
					<li v-for="c in conflicts" :key="c.clientId">
						<button
							type="button"
							class="text-red-700 underline hover:text-red-800"
							@click="$emit('select-field', c.clientId)"
						>
							{{ conflictLabel(c) }}
						</button>
					</li>
				</ul>
			</div>
		</div>

		<!-- Label -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Label</label>
			<BaseInput
				:model-value="config.label || ''"
				placeholder="Field label"
				@update:model-value="updateLabel($event as string)"
			/>
		</div>

		<!-- Help text -->
		<div>
			<label class="mb-1 block text-sm text-gray-600">Help Text</label>
			<BaseInput
				:model-value="config.helpText || ''"
				placeholder="Additional instructions..."
				@update:model-value="updateHelpText($event as string)"
			/>
		</div>

		<!-- Required toggle -->
		<BaseToggle
			:model-value="element.isRequired"
			@update:model-value="$emit('update:required', $event)"
		>
			Required field
		</BaseToggle>
	</div>
</template>
