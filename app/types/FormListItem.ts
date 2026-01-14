export interface FormListItem {
	id: number;
	title: string;
	description: string | null;
	folderId: number | null;
	folderName: string | null;
	status: "draft" | "published" | "archived";
	theme: "default" | "dark" | "ocean" | "forest" | "unicorn";
	webhookUrl: string | null;
	createdBy: number;
	updatedBy: number | null;
	createdAt: string;
	updatedAt: string;
}

export const formStatusLabels = {
	draft: {
		label: "טיוטה",
		classNames: "bg-yellow-100 text-yellow-800",
	},
	published: {
		label: "פורסם",
		classNames: "bg-green-100 text-green-800",
	},
	archived: {
		label: "בארכיון",
		classNames: "bg-gray-100 text-gray-800",
	},
};

export type FormStatusKey = keyof typeof formStatusLabels;
export type FormStatusLabel = (typeof formStatusLabels)[FormStatusKey]["label"];

export function getFormStatusLabel(status: FormStatusKey): FormStatusLabel {
	return formStatusLabels[status].label as FormStatusLabel;
}

export function getFormStatusLabelClasses(status: FormListItem["status"]): string {
	return formStatusLabels[status].classNames;
}
