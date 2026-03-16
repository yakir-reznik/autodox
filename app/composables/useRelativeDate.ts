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

type RelativeTimeKey =
	| "now"
	| "30m_ago"
	| "1h_ago"
	| "2h_ago"
	| "3h_ago"
	| "4h_ago"
	| "5h_ago"
	| "6h_ago"
	| "30m_ahead"
	| "1h_ahead"
	| "2h_ahead"
	| "3h_ahead"
	| "4h_ahead"
	| "5h_ahead"
	| "6h_ahead";

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

export const relativeTimeLabels: Record<RelativeTimeKey, string> = {
	"6h_ago": "לפני 6 שעות",
	"5h_ago": "לפני 5 שעות",
	"4h_ago": "לפני 4 שעות",
	"3h_ago": "לפני 3 שעות",
	"2h_ago": "לפני שעתיים",
	"1h_ago": "לפני שעה",
	"30m_ago": "לפני 30 דקות",
	now: "עכשיו",
	"30m_ahead": "עוד 30 דקות",
	"1h_ahead": "עוד שעה",
	"2h_ahead": "עוד שעתיים",
	"3h_ahead": "עוד 3 שעות",
	"4h_ahead": "עוד 4 שעות",
	"5h_ahead": "עוד 5 שעות",
	"6h_ahead": "עוד 6 שעות",
};

export function isRelativeDateKey(value: string): boolean {
	return value in relativeDateLabels;
}

export function isRelativeTimeKey(value: string): boolean {
	return value in relativeTimeLabels;
}

export function resolveRelativeTime(key: string): string | null {
	const now = new Date();
	const offsets: Record<string, number> = {
		now: 0,
		"30m_ago": -30,
		"1h_ago": -60,
		"2h_ago": -120,
		"3h_ago": -180,
		"4h_ago": -240,
		"5h_ago": -300,
		"6h_ago": -360,
		"30m_ahead": 30,
		"1h_ahead": 60,
		"2h_ahead": 120,
		"3h_ahead": 180,
		"4h_ahead": 240,
		"5h_ahead": 300,
		"6h_ahead": 360,
	};

	const offset = offsets[key];
	if (offset === undefined) return null;

	const result = new Date(now.getTime() + offset * 60 * 1000);
	const hh = String(result.getHours()).padStart(2, "0");
	const mm = String(result.getMinutes()).padStart(2, "0");
	return `${hh}:${mm}`;
}

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

function formatDateString(date: Date): string {
	const yyyy = date.getFullYear();
	const mm = String(date.getMonth() + 1).padStart(2, "0");
	const dd = String(date.getDate()).padStart(2, "0");
	return `${yyyy}-${mm}-${dd}`;
}

export function resolveDateTimeDefault(defaultValue: string, fieldType: "date" | "datetime" | "time"): string | null {
	if (!defaultValue) return null;

	if (fieldType === "date") {
		const date = resolveRelativeDate(defaultValue);
		if (date) return formatDateString(date);
		// Assume ISO date string as-is
		return defaultValue;
	}

	if (fieldType === "time") {
		const resolved = resolveRelativeTime(defaultValue);
		if (resolved) return resolved;
		// Assume HH:MM string as-is
		return defaultValue;
	}

	// datetime: try JSON {date, time} format first
	try {
		const parsed = JSON.parse(defaultValue);
		if (parsed && typeof parsed === "object" && "date" in parsed) {
			const datePart = resolveRelativeDate(parsed.date)
				? formatDateString(resolveRelativeDate(parsed.date)!)
				: parsed.date;
			const timePart = parsed.time
				? (resolveRelativeTime(parsed.time) ?? parsed.time)
				: "00:00";
			return `${datePart}T${timePart}`;
		}
	} catch {
		// Not JSON — fall through to legacy handling
	}

	// Legacy: plain relative date key for datetime
	const date = resolveRelativeDate(defaultValue);
	if (date) return `${formatDateString(date)}T00:00`;

	return defaultValue;
}
