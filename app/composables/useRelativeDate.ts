type RelativeDateKey =
	| "today"
	| "tomorrow"
	| "yesterday"
	| "day_after_tomorrow"
	| "day_before_yesterday"
	| "start_of_week"
	| "end_of_week"
	| "start_of_month"
	| "end_of_month";

export const relativeDateLabels: Record<RelativeDateKey, string> = {
	today: "היום",
	tomorrow: "מחר",
	yesterday: "אתמול",
	day_after_tomorrow: "מחרתיים",
	day_before_yesterday: "שלשום",
	start_of_week: "תחילת השבוע",
	end_of_week: "סוף השבוע",
	start_of_month: "תחילת החודש",
	end_of_month: "סוף החודש",
};

export function resolveRelativeDate(key: string): Date | null {
	const now = new Date();
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

	switch (key) {
		case "today":
			return today;
		case "tomorrow":
			return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
		case "yesterday":
			return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
		case "day_after_tomorrow":
			return new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2);
		case "day_before_yesterday":
			return new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2);
		case "start_of_week": {
			const day = today.getDay();
			// Sunday-based week (Hebrew calendar convention)
			return new Date(today.getFullYear(), today.getMonth(), today.getDate() - day);
		}
		case "end_of_week": {
			const day = today.getDay();
			return new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - day));
		}
		case "start_of_month":
			return new Date(today.getFullYear(), today.getMonth(), 1);
		case "end_of_month":
			return new Date(today.getFullYear(), today.getMonth() + 1, 0);
		default:
			return null;
	}
}

export function resolveRelativeDateString(key: string, type: "date" | "datetime" = "date"): string | null {
	const date = resolveRelativeDate(key);
	if (!date) return null;

	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");

	if (type === "datetime") {
		return `${yyyy}-${mm}-${dd}T00:00`;
	}
	return `${yyyy}-${mm}-${dd}`;
}
