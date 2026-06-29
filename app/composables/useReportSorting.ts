type SortDirection = "asc" | "desc";

export function useReportSorting<T extends Record<string, any>>(
	rows: MaybeRefOrGetter<T[]>,
	defaultKey: keyof T,
	defaultDirection: SortDirection = "desc",
) {
	const sortKey = ref<keyof T>(defaultKey);
	const sortDirection = ref<SortDirection>(defaultDirection);

	const sortedRows = computed(() => {
		const list = [...toValue(rows)];
		const key = sortKey.value;
		const direction = sortDirection.value === "asc" ? 1 : -1;

		return list.sort((a, b) => compareValues(a[key], b[key]) * direction);
	});

	function sortBy(key: keyof T) {
		if (sortKey.value === key) {
			sortDirection.value = sortDirection.value === "asc" ? "desc" : "asc";
			return;
		}

		sortKey.value = key;
		sortDirection.value = typeof toValue(rows)[0]?.[key] === "string" ? "asc" : "desc";
	}

	function sortIcon(key: keyof T) {
		if (sortKey.value !== key) return "heroicons:chevron-up-down";
		return sortDirection.value === "asc" ? "heroicons:chevron-up" : "heroicons:chevron-down";
	}

	return {
		sortKey,
		sortDirection,
		sortedRows,
		sortBy,
		sortIcon,
	};
}

function compareValues(a: unknown, b: unknown) {
	if (typeof a === "number" && typeof b === "number") return a - b;
	return String(a ?? "").localeCompare(String(b ?? ""), "he", { numeric: true });
}
