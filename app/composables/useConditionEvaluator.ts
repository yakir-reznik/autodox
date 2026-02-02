import type { BuilderElement, ConditionGroup } from "~/types/form-builder";

type Rule = ConditionGroup["rules"][number];
type Operator = Rule["operator"];

export function useConditionEvaluator(
	elements: Ref<BuilderElement[]> | ComputedRef<BuilderElement[]>,
	formData: Record<string, any>,
) {
	const elementMap = computed(() => {
		const map = new Map<string, BuilderElement>();
		for (const el of toValue(elements)) {
			map.set(el.clientId, el);
		}
		return map;
	});

	function isEmpty(value: any): boolean {
		if (value === undefined || value === null || value === "" || value === false) return true;
		if (Array.isArray(value)) return value.length === 0;
		return false;
	}

	function evaluateOperator(operator: Operator, fieldValue: any, ruleValue: any): boolean {
		switch (operator) {
			case "is_empty":
				return isEmpty(fieldValue);
			case "is_not_empty":
				return !isEmpty(fieldValue);
			case "equals":
				if (Array.isArray(fieldValue)) return fieldValue.includes(ruleValue);
				return String(fieldValue) === String(ruleValue);
			case "not_equals":
				if (Array.isArray(fieldValue)) return !fieldValue.includes(ruleValue);
				return String(fieldValue) !== String(ruleValue);
			case "contains":
				if (Array.isArray(fieldValue)) return fieldValue.includes(ruleValue);
				return String(fieldValue ?? "").includes(String(ruleValue ?? ""));
			case "greater_than":
				return Number(fieldValue) > Number(ruleValue);
			case "less_than":
				return Number(fieldValue) < Number(ruleValue);
			default:
				return false;
		}
	}

	function evaluateRule(rule: Rule, sourceHidden: boolean): boolean {
		if (sourceHidden) return rule.operator === "is_empty";
		return evaluateOperator(rule.operator, formData[rule.sourceFieldId], rule.value);
	}

	// Tracks elements currently being evaluated to prevent infinite loops from circular references
	const evaluating = new Set<string>();

	function computeVisible(clientId: string): boolean {
		const el = elementMap.value.get(clientId);
		if (!el) return true;

		// Children inherit parent visibility (section/repeater cascading)
		if (el.parentId && !computeVisible(el.parentId)) return false;

		const cond = el.conditions;
		if (!cond?.enabled || !cond.rules.length) return true;
		if (cond.action === "require") return true;

		if (evaluating.has(clientId)) return true;
		evaluating.add(clientId);

		try {
			const results = cond.rules.map((rule) => {
				const sourceHidden = !computeVisible(rule.sourceFieldId);
				return evaluateRule(rule, sourceHidden);
			});

			const conditionMet =
				cond.logic === "and"
					? results.every(Boolean)
					: results.some(Boolean);

			return cond.action === "show" ? conditionMet : !conditionMet;
		} finally {
			evaluating.delete(clientId);
		}
	}

	function computeRequired(clientId: string): boolean {
		const el = elementMap.value.get(clientId);
		if (!el?.conditions?.enabled) return false;
		if (el.conditions.action !== "require" || !el.conditions.rules.length) return false;

		const results = el.conditions.rules.map((rule) => {
			const sourceHidden = !computeVisible(rule.sourceFieldId);
			return evaluateRule(rule, sourceHidden);
		});

		return el.conditions.logic === "and"
			? results.every(Boolean)
			: results.some(Boolean);
	}

	function isVisible(clientId: string): boolean {
		return computeVisible(clientId);
	}

	function isRequiredByCondition(clientId: string): boolean {
		return computeRequired(clientId);
	}

	return { isVisible, isRequiredByCondition };
}
