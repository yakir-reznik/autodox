export type ElementForValidation = {
	id: string;
	name: string | null;
	parentId: string | null;
	type: string;
};

export type DuplicateGroup = {
	scopeKey: string | null;
	name: string;
	ids: string[];
};

// Walk up parent chain to find nearest "repeater" ancestor; returns its id, or null for root scope.
// Layout containers (section, grid) are NOT scope boundaries — submission data flattens through them.
export function getScopeKey(
	element: ElementForValidation,
	byId: Map<string, ElementForValidation>,
): string | null {
	let current = element.parentId ? byId.get(element.parentId) : undefined;
	while (current) {
		if (current.type === "repeater") return current.id;
		current = current.parentId ? byId.get(current.parentId) : undefined;
	}
	return null;
}

// Find groups of elements that share the same name within the same submission scope.
// Only elements with a non-empty name are considered. Element type is not filtered here —
// callers should pre-filter to fields if desired (the server-side payload only includes
// fields with names, since layout types have name === null).
export function findDuplicateNameGroups(
	elements: ElementForValidation[],
): DuplicateGroup[] {
	const byId = new Map<string, ElementForValidation>();
	for (const el of elements) byId.set(el.id, el);

	// Map<scopeKey-or-"__root__", Map<name, ids[]>>
	const buckets = new Map<string, Map<string, string[]>>();

	for (const el of elements) {
		if (!el.name) continue;
		const scopeKey = getScopeKey(el, byId);
		const bucketKey = scopeKey ?? "__root__";
		let nameMap = buckets.get(bucketKey);
		if (!nameMap) {
			nameMap = new Map();
			buckets.set(bucketKey, nameMap);
		}
		let ids = nameMap.get(el.name);
		if (!ids) {
			ids = [];
			nameMap.set(el.name, ids);
		}
		ids.push(el.id);
	}

	const groups: DuplicateGroup[] = [];
	for (const [bucketKey, nameMap] of buckets) {
		for (const [name, ids] of nameMap) {
			if (ids.length > 1) {
				groups.push({
					scopeKey: bucketKey === "__root__" ? null : bucketKey,
					name,
					ids,
				});
			}
		}
	}
	return groups;
}
