export type SubmissionStatusSummary = {
	pending: number;
	in_progress: number;
	submitted: number;
	locked: number;
	total: number;
	startedCount: number;
	submittedCount: number;
	completionRate: number;
	avgFillTimeSeconds: number | null;
};

export type ExternalIdPerformanceRow = SubmissionStatusSummary & {
	externalId: string | null;
	uniqueFormsCount: number;
};

export type FormPerformanceRow = SubmissionStatusSummary & {
	formId: number;
	formName: string;
};

export type FormExternalIdPerformanceRow = FormPerformanceRow & {
	externalId: string | null;
};

export type OverviewReportResponse = SubmissionStatusSummary & {
	publicCount: number;
	tokenCount: number;
	archivedCount: number;
	topForms: FormPerformanceRow[];
	topExternalIds: ExternalIdPerformanceRow[];
};

export type SubmissionsSummaryByExternalIdResponse = {
	externalIds: Array<{
		externalId: string | null;
		total: number;
	}>;
	externalIdStatuses: ExternalIdPerformanceRow[];
	total: number;
};
