import type { BuilderElement } from "~/types/form-builder";
import {
	findDuplicateNameGroups,
	type DuplicateGroup,
	type ElementForValidation,
} from "../../shared/utils/fieldNameValidation";

export class DuplicateFieldNamesError extends Error {
	groups: DuplicateGroup[];
	constructor(groups: DuplicateGroup[]) {
		super("Duplicate field names");
		this.name = "DuplicateFieldNamesError";
		this.groups = groups;
	}
}

export function useFieldNameValidation(
	getElements: () => BuilderElement[],
) {
	const duplicateGroups = computed<DuplicateGroup[]>(() => {
		const payload: ElementForValidation[] = getElements().map((el) => ({
			id: el.clientId,
			name: el.name,
			parentId: el.parentId,
			type: el.type,
		}));
		return findDuplicateNameGroups(payload);
	});

	const duplicateClientIds = computed<Set<string>>(() => {
		const set = new Set<string>();
		for (const group of duplicateGroups.value) {
			for (const id of group.ids) set.add(id);
		}
		return set;
	});

	const hasDuplicates = computed(() => duplicateGroups.value.length > 0);

	function conflictsFor(clientId: string): BuilderElement[] {
		const group = duplicateGroups.value.find((g) => g.ids.includes(clientId));
		if (!group) return [];
		return getElements().filter(
			(el) => group.ids.includes(el.clientId) && el.clientId !== clientId,
		);
	}

	return {
		duplicateGroups,
		duplicateClientIds,
		hasDuplicates,
		conflictsFor,
	};
}
