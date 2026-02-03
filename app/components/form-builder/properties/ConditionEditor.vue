<script setup lang="ts">
import type { BuilderElement, ConditionGroup } from "~/types/form-builder";
import type {
	ConditionAction,
	ConditionOperator,
	ConditionRule,
} from "~~/server/db/schema";
import { isConditionSource } from "~/composables/useElementDefaults";

interface Props {
	element: BuilderElement;
	allElements: BuilderElement[];
}

const props = defineProps<Props>();

const emit = defineEmits<{
	"update:conditions": [conditions: ConditionGroup];
}>();

const conditions = computed<ConditionGroup>(
	() =>
		props.element.conditions ?? {
			enabled: false,
			action: "show",
			logic: "and",
			rules: [],
		},
);

function update(changes: Partial<ConditionGroup>) {
	emit("update:conditions", { ...conditions.value, ...changes });
}

function updateRule(index: number, changes: Partial<ConditionRule>) {
	const rules = [...conditions.value.rules];
	rules[index] = { ...rules[index], ...changes } as ConditionRule;
	update({ rules });
}

function changeRuleSource(index: number, sourceFieldId: string) {
	updateRule(index, { sourceFieldId, value: undefined });
}

function changeRuleOperator(index: number, operator: ConditionOperator) {
	const changes: Partial<ConditionRule> = { operator };
	if (!needsValue(operator)) changes.value = undefined;
	updateRule(index, changes);
}

function addRule() {
	const firstSource = availableSources.value[0];
	if (!firstSource) return;
	update({
		rules: [
			...conditions.value.rules,
			{ sourceFieldId: firstSource.clientId, operator: "equals", value: "" },
		],
	});
}

function removeRule(index: number) {
	update({ rules: conditions.value.rules.filter((_, i) => i !== index) });
}

// Collect all descendant clientIds of a given parent (for excluding section/repeater children)
function getDescendantIds(parentId: string): Set<string> {
	const ids = new Set<string>();
	for (const el of props.allElements) {
		if (el.parentId === parentId) {
			ids.add(el.clientId);
			for (const id of getDescendantIds(el.clientId)) {
				ids.add(id);
			}
		}
	}
	return ids;
}

const availableSources = computed(() => {
	const excludeIds = getDescendantIds(props.element.clientId);
	excludeIds.add(props.element.clientId);

	return props.allElements.filter((el) => {
		if (excludeIds.has(el.clientId)) return false;
		if (!isConditionSource(el.type)) return false;

		// Exclude repeater children (ambiguous cross-row references)
		const parent = props.allElements.find((p) => p.clientId === el.parentId);
		if (parent?.type === "repeater") return false;

		// Prevent direct circular dependencies
		if (el.conditions?.enabled) {
			if (el.conditions.rules.some((r) => r.sourceFieldId === props.element.clientId)) {
				return false;
			}
		}

		return true;
	});
});

const sourceOptions = computed(() =>
	availableSources.value.map((el) => ({
		label: (el.config as any).label || el.name || el.clientId,
		value: el.clientId,
	})),
);

function getSourceElement(clientId: string): BuilderElement | undefined {
	return props.allElements.find((el) => el.clientId === clientId);
}

const actionOptions = [
	{ label: "הצג כאשר...", value: "show" },
	{ label: "הסתר כאשר...", value: "hide" },
	{ label: "חובה כאשר...", value: "require" },
];

const operatorOptions: { label: string; value: ConditionOperator }[] = [
	{ label: "שווה ל", value: "equals" },
	{ label: "שונה מ", value: "not_equals" },
	{ label: "ריק", value: "is_empty" },
	{ label: "לא ריק", value: "is_not_empty" },
	{ label: "מכיל", value: "contains" },
	{ label: "גדול מ", value: "greater_than" },
	{ label: "קטן מ", value: "less_than" },
];

function needsValue(operator: ConditionOperator): boolean {
	return operator !== "is_empty" && operator !== "is_not_empty";
}

// For selection-type sources, return their options as a dropdown list
function getValueOptions(source: BuilderElement | undefined) {
	if (!source) return null;

	if (source.type === "checkbox") {
		return [
			{ label: "מסומן", value: "true" },
			{ label: "לא מסומן", value: "false" },
		];
	}

	const config = source.config as any;
	if (config.options?.length) {
		return config.options.map((opt: any) => ({
			label: opt.label,
			value: opt.value,
		}));
	}

	return null;
}
</script>

<template>
	<div class="space-y-4">
		<!-- Header with toggle -->
		<div class="flex items-center justify-between">
			<h3 class="text-sm font-medium text-gray-700">לוגיקה מותנית</h3>
			<UiSwitch
				:model-value="conditions.enabled"
				@update:model-value="update({ enabled: $event })"
			/>
		</div>

		<template v-if="conditions.enabled">
			<!-- Action selector -->
			<BaseSelect
				:model-value="conditions.action"
				:options="actionOptions"
				@update:model-value="update({ action: $event as ConditionAction })"
			/>

			<!-- Logic toggle (shown when 2+ rules) -->
			<div
				v-if="conditions.rules.length >= 2"
				class="flex items-center gap-2 text-sm text-gray-600"
			>
				<button
					class="rounded px-2 py-0.5 transition-colors"
					:class="
						conditions.logic === 'and'
							? 'bg-blue-100 font-medium text-blue-700'
							: 'hover:bg-gray-100'
					"
					@click="update({ logic: 'and' })"
				>
					כל התנאים
				</button>
				<span>/</span>
				<button
					class="rounded px-2 py-0.5 transition-colors"
					:class="
						conditions.logic === 'or'
							? 'bg-blue-100 font-medium text-blue-700'
							: 'hover:bg-gray-100'
					"
					@click="update({ logic: 'or' })"
				>
					אחד מהתנאים
				</button>
			</div>

			<!-- Rules list -->
			<div class="space-y-3">
				<div
					v-for="(rule, index) in conditions.rules"
					:key="index"
					class="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
				>
					<!-- Source field -->
					<BaseSelect
						:model-value="rule.sourceFieldId"
						:options="sourceOptions"
						@update:model-value="changeRuleSource(index, $event as string)"
					/>

					<!-- Operator -->
					<BaseSelect
						:model-value="rule.operator"
						:options="operatorOptions"
						@update:model-value="changeRuleOperator(index, $event as ConditionOperator)"
					/>

					<!-- Value input (hidden for is_empty/is_not_empty) -->
					<template v-if="needsValue(rule.operator)">
						<!-- Selection source or checkbox → dropdown -->
						<BaseSelect
							v-if="getValueOptions(getSourceElement(rule.sourceFieldId))"
							:model-value="String(rule.value ?? '')"
							:options="getValueOptions(getSourceElement(rule.sourceFieldId))!"
							@update:model-value="updateRule(index, { value: $event as string })"
						/>
						<!-- Number source → number input -->
						<BaseInput
							v-else-if="getSourceElement(rule.sourceFieldId)?.type === 'number'"
							type="number"
							:model-value="(rule.value as string | number) ?? ''"
							placeholder="ערך"
							@update:model-value="
								updateRule(index, { value: $event ? Number($event) : '' })
							"
						/>
						<!-- Default → text input -->
						<BaseInput
							v-else
							:model-value="String(rule.value ?? '')"
							placeholder="ערך"
							@update:model-value="updateRule(index, { value: $event as string })"
						/>
					</template>

					<!-- Remove rule -->
					<button
						class="flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
						@click="removeRule(index)"
					>
						<Icon name="heroicons:trash" class="h-3.5 w-3.5" />
						הסר
					</button>
				</div>
			</div>

			<!-- Add rule button -->
			<button
				v-if="availableSources.length > 0"
				class="text-sm text-blue-600 hover:text-blue-800"
				@click="addRule"
			>
				+ הוסף תנאי
			</button>
			<p v-else class="text-xs text-gray-400">אין שדות זמינים לתנאי</p>
		</template>
	</div>
</template>
