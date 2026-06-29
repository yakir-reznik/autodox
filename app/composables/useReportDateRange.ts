type ReportDatePreset =
	| "past_30_days"
	| "today"
	| "yesterday"
	| "this_week"
	| "last_week"
	| "this_month"
	| "last_month"
	| "this_year"
	| "last_year";

export const reportDatePresets: Array<{ label: string; value: ReportDatePreset }> = [
	{ label: "30 הימים האחרונים", value: "past_30_days" },
	{ label: "היום", value: "today" },
	{ label: "אתמול", value: "yesterday" },
	{ label: "השבוע", value: "this_week" },
	{ label: "שבוע שעבר", value: "last_week" },
	{ label: "החודש", value: "this_month" },
	{ label: "חודש שעבר", value: "last_month" },
	{ label: "השנה", value: "this_year" },
	{ label: "שנה שעברה", value: "last_year" },
];

export function useReportDateRange() {
	const selectedPreset = ref<ReportDatePreset>("past_30_days");
	const initialRange = getReportPresetRange(selectedPreset.value);
	const fromDate = ref(initialRange.from);
	const toDate = ref(initialRange.to);
	const appliedFrom = ref(initialRange.from);
	const appliedTo = ref(initialRange.to);

	const rangeError = computed(() => {
		if (!fromDate.value || !toDate.value) return null;
		const diff =
			(new Date(toDate.value).getTime() - new Date(fromDate.value).getTime()) / 86400000;
		if (diff < 0) return "תאריך סיום חייב להיות אחרי תאריך התחלה";
		if (diff > 365) return "טווח התאריכים לא יכול לעלות על 365 ימים";
		return null;
	});

	const canApply = computed(() => !rangeError.value && fromDate.value && toDate.value);

	function applyPreset(preset: ReportDatePreset) {
		selectedPreset.value = preset;
		const range = getReportPresetRange(preset);
		fromDate.value = range.from;
		toDate.value = range.to;
	}

	function applyFilters() {
		if (!canApply.value) return false;
		appliedFrom.value = fromDate.value;
		appliedTo.value = toDate.value;
		return true;
	}

	return {
		selectedPreset,
		fromDate,
		toDate,
		appliedFrom,
		appliedTo,
		rangeError,
		canApply,
		applyPreset,
		applyFilters,
	};
}

function getReportPresetRange(preset: ReportDatePreset) {
	const today = startOfDay(new Date());
	const yesterday = addDays(today, -1);

	if (preset === "today") return range(today, today);
	if (preset === "yesterday") return range(yesterday, yesterday);
	if (preset === "this_week") return range(startOfWeek(today), today);
	if (preset === "last_week") {
		const end = addDays(startOfWeek(today), -1);
		return range(startOfWeek(end), end);
	}
	if (preset === "this_month") return range(new Date(today.getFullYear(), today.getMonth(), 1), today);
	if (preset === "last_month") {
		const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
		const end = new Date(today.getFullYear(), today.getMonth(), 0);
		return range(start, end);
	}
	if (preset === "this_year") return range(new Date(today.getFullYear(), 0, 1), today);
	if (preset === "last_year") {
		const year = today.getFullYear() - 1;
		return range(new Date(year, 0, 1), new Date(year, 11, 31));
	}

	return range(addDays(today, -30), today);
}

function range(from: Date, to: Date) {
	return {
		from: toDateInputValue(from),
		to: toDateInputValue(to),
	};
}

function startOfDay(date: Date) {
	return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfWeek(date: Date) {
	return addDays(date, -date.getDay());
}

function addDays(date: Date, days: number) {
	const next = new Date(date);
	next.setDate(next.getDate() + days);
	return next;
}

function toDateInputValue(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}
