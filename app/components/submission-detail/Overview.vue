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
				<label class="block text-sm font-medium text-gray-700">Status</label>
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
				<label class="block text-sm font-medium text-gray-700">Form</label>
				<div class="mt-2">
					<NuxtLink
						:to="`/fill/${submission.formId}?token=${submission.token}`"
						class="text-blue-600 hover:underline"
					>
						{{ form?.title || `Form #${submission.formId}` }}
					</NuxtLink>
				</div>
			</div>

			<!-- Created By User -->
			<div>
				<label class="block text-sm font-medium text-gray-700">Created By User ID</label>
				<div class="mt-2 text-gray-900">
					{{ submission.createdByUserId ?? "Anonymous" }}
				</div>
			</div>

			<!-- Download PDF Button -->
			<div>
				<label class="block text-sm font-medium mb-2 text-gray-700">Download PDF</label>
				<BaseButton
					variant="primary"
					size="sm"
					@click="downloadPDF"
					:disabled="isDownloading"
				>
					<Icon
						:name="
							isDownloading ? 'svg-spinners:ring-resize' : 'heroicons:arrow-down-tray'
						"
						class="h-4 w-4"
					/>
					{{ isDownloading ? "Downloading..." : "Download PDF" }}
				</BaseButton>
			</div>
		</div>

		<!-- Timeline -->
		<div class="mt-6 border-t border-gray-200 pt-6">
			<h3 class="text-lg font-medium text-gray-900">Timeline</h3>
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
						<p class="text-sm font-medium text-gray-900">Link Created</p>
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
						<p class="text-sm font-medium text-gray-900">Form Started</p>
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
						<p class="text-sm font-medium text-gray-900">Form Submitted</p>
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
						<p class="text-sm font-medium text-gray-900">Form Locked</p>
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
					<strong>Link expires at:</strong>
					{{ formatDate(submission.expiresAt) }}
				</p>
			</div>
		</div>
	</div>
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

	const isDownloading = ref(false);

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
		} catch (err) {
			console.error("Failed to download PDF:", err);
			alert("Failed to download PDF. Please try again.");
		} finally {
			setTimeout(() => {
				isDownloading.value = false;
			}, 1000);
		}
	}
</script>
