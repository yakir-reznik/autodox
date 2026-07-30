<template>
	<div class="mb-8 rounded-lg bg-white p-6 shadow">
		<div
			v-if="submission.name || submission.externalId"
			class="mb-4 pb-4 border-b border-gray-200 flex gap-8"
		>
			<div v-if="submission.name">
				<p class="text-xs text-gray-500">שם ההגשה</p>
				<p class="text-lg font-medium text-gray-900 mt-0.5">
					{{ submission.name }}
				</p>
			</div>
			<div v-if="submission.externalId">
				<p class="text-xs text-gray-500">מזהה חיצוני</p>
				<p class="text-lg font-medium text-gray-900 mt-0.5 font-mono">
					{{ submission.externalId }}
				</p>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-6 md:grid-cols-4">
			<!-- Status -->
			<div>
				<label class="block text-sm font-medium text-gray-700">סטטוס</label>
				<div class="mt-2 flex items-center gap-2">
					<span
						class="rounded-full px-3 py-1 text-sm font-medium"
						:class="statusColors[submission.status]"
					>
						{{ statusLabels[submission.status] }}
					</span>
					<span
						v-if="submission.isArchived"
						class="rounded-full bg-amber-100 text-amber-800 px-3 py-1 text-sm font-medium flex items-center gap-1"
						title="הגשה בארכיון"
					>
						<Icon name="heroicons:archive-box" class="h-3 w-3" />
						ארכיון
					</span>
				</div>
			</div>

			<!-- Form -->
			<div>
				<label class="block text-sm font-medium text-gray-700">טופס</label>
				<div class="mt-2">
					<NuxtLink
						:to="`/fill/${submission.formId}?token=${submission.token}`"
						class="text-blue-600 hover:underline"
					>
						{{ form?.title || `טופס #${submission.formId}` }}
					</NuxtLink>
				</div>
			</div>

			<!-- Created By User -->
			<div>
				<label class="block text-sm font-medium text-gray-700">מזהה משתמש יוצר</label>
				<div class="mt-2 text-gray-900">
					{{ submission.createdByUserId ?? "אנונימי" }}
				</div>
			</div>

			<!-- Actions -->
			<div>
				<label class="block text-sm font-medium mb-2 text-gray-700">פעולות</label>
				<UiDropdownMenu dir="rtl">
					<UiDropdownMenuTrigger as-child>
						<BaseButton variant="secondary" size="sm">
							<Icon name="heroicons:ellipsis-vertical" class="h-4 w-4" />
							פעולות נוספות
						</BaseButton>
					</UiDropdownMenuTrigger>
					<UiDropdownMenuContent align="end" class="w-52">
						<UiDropdownMenuItem @click="copyFormLink">
							<Icon name="heroicons:link" class="h-4 w-4 ml-2" />
							העתק קישור לטופס
						</UiDropdownMenuItem>
						<UiDropdownMenuItem @click="copyToken">
							<Icon name="heroicons:clipboard-document" class="h-4 w-4 ml-2" />
							העתק טוקן
						</UiDropdownMenuItem>
						<UiDropdownMenuItem @click="copySubmissionId">
							<Icon name="heroicons:hashtag" class="h-4 w-4 ml-2" />
							העתק מזהה הגשה ({{ submission.id }})
						</UiDropdownMenuItem>
						<UiDropdownMenuItem :disabled="isDownloading" @click="downloadPDF">
							<Icon
								:name="
									isDownloading
										? 'svg-spinners:ring-resize'
										: 'heroicons:arrow-down-tray'
								"
								class="h-4 w-4 ml-2"
							/>
							הורד PDF
						</UiDropdownMenuItem>
						<UiDropdownMenuItem as-child>
							<NuxtLink
								:to="`/print/${submission.token}`"
								target="_blank"
								class="flex items-center w-full"
							>
								<Icon name="heroicons:printer" class="h-4 w-4 ml-2" />
								תצוגת הדפסה
							</NuxtLink>
						</UiDropdownMenuItem>
						<UiDropdownMenuSeparator />
						<UiDropdownMenuItem @click="toggleArchive">
							<Icon
								:name="
									submission.isArchived
										? 'heroicons:archive-box-x-mark'
										: 'heroicons:archive-box-arrow-down'
								"
								class="h-4 w-4 ml-2"
							/>
							{{ submission.isArchived ? "שחזור מארכיון" : "העברה לארכיון" }}
						</UiDropdownMenuItem>
						<UiDropdownMenuItem @click="openRenameModal">
							<Icon name="heroicons:pencil" class="h-4 w-4 ml-2" />
							שינוי שם הגשה
						</UiDropdownMenuItem>
					</UiDropdownMenuContent>
				</UiDropdownMenu>
			</div>
		</div>

		<!-- Timeline -->
		<div class="mt-6 border-t border-gray-200 pt-6">
			<h3 class="text-lg font-medium text-gray-900">ציר זמן</h3>
			<div class="mt-4 space-y-4">
				<div class="flex gap-4">
					<div class="flex flex-col items-center">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100"
						>
							<Icon name="heroicons:calendar-days" class="h-4 w-4 text-blue-600" />
						</div>
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-900">קישור נוצר</p>
						<p class="text-sm text-gray-600">
							{{ formatDate(submission.createdAt) }}
						</p>
					</div>
				</div>

				<div v-if="submission.startedAt" class="flex gap-4">
					<div class="flex flex-col items-center">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100"
						>
							<Icon
								name="heroicons:arrow-right-circle"
								class="h-4 w-4 text-blue-600"
							/>
						</div>
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-900">מילוי הטופס התחיל</p>
						<p class="text-sm text-gray-600">
							{{ formatDate(submission.startedAt) }}
						</p>
					</div>
				</div>

				<div v-if="submission.submittedAt" class="flex gap-4">
					<div class="flex flex-col items-center">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100"
						>
							<Icon name="heroicons:check-circle" class="h-4 w-4 text-green-600" />
						</div>
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-900">הטופס הוגש</p>
						<p class="text-sm text-gray-600">
							{{ formatDate(submission.submittedAt) }}
						</p>
					</div>
				</div>

				<div v-if="submission.archivedAt" class="flex gap-4">
					<div class="flex flex-col items-center">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100"
						>
							<Icon name="heroicons:archive-box" class="h-4 w-4 text-amber-600" />
						</div>
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-900">הועבר לארכיון</p>
						<p class="text-sm text-gray-600">
							{{ formatDate(submission.archivedAt) }}
						</p>
					</div>
				</div>

				<div v-if="submission.lockedAt" class="flex gap-4">
					<div class="flex flex-col items-center">
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100"
						>
							<Icon name="heroicons:lock-closed" class="h-4 w-4 text-red-600" />
						</div>
					</div>
					<div class="flex-1">
						<p class="text-sm font-medium text-gray-900">הטופס ננעל</p>
						<p class="text-sm text-gray-600">
							{{ formatDate(submission.lockedAt) }}
						</p>
					</div>
				</div>
			</div>
		</div>

		<!-- Expiration -->
		<div class="mt-6 border-t border-gray-200 pt-6">
			<div class="rounded-lg bg-yellow-50 p-4">
				<p class="text-sm text-yellow-800">
					<strong>הקישור פג בתאריך:</strong>
					{{ formatDate(submission.expiresAt) }}
				</p>
			</div>
		</div>
	</div>

	<UiDialog v-model:open="showRenameModal">
		<UiDialogContent class="sm:max-w-md" dir="rtl">
			<UiDialogHeader>
				<UiDialogTitle>שינוי שם הגשה</UiDialogTitle>
				<UiDialogDescription>הזן שם חדש להגשה</UiDialogDescription>
			</UiDialogHeader>
			<div class="py-2">
				<UiInput
					v-model="renameName"
					placeholder="שם ההגשה"
					class="w-full"
					@keydown.enter="submitRename"
				/>
			</div>
			<UiDialogFooter class="flex gap-2 justify-start flex-row-reverse">
				<UiButton :disabled="renaming" @click="submitRename">
					<Icon v-if="renaming" name="svg-spinners:ring-resize" class="h-4 w-4" />
					שמור
				</UiButton>
				<UiButton variant="outline" @click="showRenameModal = false">ביטול</UiButton>
			</UiDialogFooter>
		</UiDialogContent>
	</UiDialog>
</template>

<script setup lang="ts">
	import { type Submission, statusColors, statusLabels } from "~/types/Submission";

	type Form = {
		id: number;
		title: string;
		description: string | null;
	};

	const props = defineProps<{
		submission: Submission;
		form: Form | null | undefined;
	}>();

	const emit = defineEmits<{ refresh: [] }>();
	const toasts = useToasts();

	const isDownloading = ref(false);
	const showRenameModal = ref(false);
	const renameName = ref("");
	const renaming = ref(false);

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("he-IL", {
			timeZone: "UTC",
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	}

	async function downloadPDF() {
		if (isDownloading.value) return;

		try {
			isDownloading.value = true;

			const link = document.createElement("a");
			link.href = `/api/submissions/${props.submission.token}/download-pdf`;
			link.download = `submission-${props.submission.token}-${new Date().toISOString().split("T")[0]}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
			toasts.add({
				title: "מוריד PDF...",
				theme: "success",
				duration: 2000,
			});
		} catch (err) {
			console.error("הורדת PDF נכשלה:", err);
			toasts.add({
				title: "שגיאה: לא ניתן להוריד PDF",
				theme: "error",
				duration: 3000,
			});
		} finally {
			setTimeout(() => {
				isDownloading.value = false;
			}, 1000);
		}
	}

	async function copyFormLink() {
		const url = `${window.location.origin}/fill/${props.submission.formId}?token=${props.submission.token}`;
		await navigator.clipboard.writeText(url);
		toasts.add({ title: "הקישור הועתק", theme: "success", duration: 2000 });
	}

	async function copyToken() {
		await navigator.clipboard.writeText(props.submission.token);
		toasts.add({ title: "הטוקן הועתק", theme: "success", duration: 2000 });
	}

	async function copySubmissionId() {
		await navigator.clipboard.writeText(String(props.submission.id));
		toasts.add({ title: "מזהה ההגשה הועתק", theme: "success", duration: 2000 });
	}

	function openRenameModal() {
		renameName.value = props.submission.name ?? "";
		showRenameModal.value = true;
	}

	async function submitRename() {
		if (!renameName.value.trim()) return;
		renaming.value = true;

		try {
			await $fetch(`/api/submissions/${props.submission.token}/rename`, {
				method: "PATCH",
				body: { name: renameName.value.trim() },
			});
			toasts.add({ title: "שם ההגשה עודכן", theme: "success", duration: 2000 });
			showRenameModal.value = false;
			emit("refresh");
		} catch {
			toasts.add({ title: "שגיאה: לא ניתן לשנות שם", theme: "error", duration: 3000 });
		} finally {
			renaming.value = false;
		}
	}

	async function toggleArchive() {
		try {
			await $fetch(`/api/submissions/${props.submission.token}/archive`, {
				method: "PATCH",
			});
			emit("refresh");
		} catch {
			toasts.add({ title: "שגיאה: לא ניתן לעדכן ארכיון", theme: "error", duration: 3000 });
		}
	}
</script>
