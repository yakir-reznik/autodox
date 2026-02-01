<script setup lang="ts">
	type Submission = {
		id: number;
		token: string;
		formId: number;
		prefillData: Record<string, unknown> | null;
		additionalData: Record<string, unknown> | null;
		createdByUserId: number | null;
		expiresAt: string;
		status: "pending" | "in_progress" | "submitted" | "locked";
		isPublic: boolean;
		submissionData: Record<string, unknown> | null;
		createdAt: string;
		startedAt: string | null;
		submittedAt: string | null;
		lockedAt: string | null;
		formTitle?: string;
	};

	type PaginationInfo = {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNextPage: boolean;
		hasPreviousPage: boolean;
	};

	const props = withDefaults(
		defineProps<{
			submissions: Submission[];
			pagination?: PaginationInfo;
			pending: boolean;
			error: any;
			showFormColumn?: boolean;
		}>(),
		{
			showFormColumn: false,
		},
	);

	const page = defineModel<number>("page", { required: true });
	const emit = defineEmits<{ refresh: [] }>();

	const toasts = useToasts();

	const selectedSubmission = ref<Submission | null>(null);
	const showJsonModal = ref(false);
	const downloadingPdfs = ref<Set<string>>(new Set());

	const statusColors = {
		pending: "bg-gray-100 text-gray-800",
		in_progress: "bg-blue-100 text-blue-800",
		submitted: "bg-green-100 text-green-800",
		locked: "bg-red-100 text-red-800",
	};

	const statusLabels = {
		pending: "Pending",
		in_progress: "In Progress",
		submitted: "Submitted",
		locked: "Locked",
	};

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("he-IL", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	}

	function openJsonModal(submission: Submission) {
		selectedSubmission.value = submission;
		showJsonModal.value = true;
	}

	function closeJsonModal() {
		showJsonModal.value = false;
		selectedSubmission.value = null;
	}

	function copyJsonToClipboard() {
		if (selectedSubmission.value?.submissionData) {
			const jsonString = JSON.stringify(selectedSubmission.value.submissionData, null, 2);
			navigator.clipboard.writeText(jsonString).then(() => {
				toasts.add({
					title: "המידע הועתק ללוח",
					theme: "success",
					duration: 3000,
				});
			});
		}
	}

	function openFillUrl(formId: number, token: string) {
		const fillUrl = `${window.location.origin}/fill/${formId}?token=${token}`;
		window.open(fillUrl, "_blank");
	}

	function copyTokenToClipboard(token: string) {
		navigator.clipboard.writeText(token).then(() => {
			toasts.add({
				title: "הטוקן הועתק ללוח",
				theme: "success",
				duration: 3000,
			});
		});
	}

	function downloadPDF(token: string) {
		if (downloadingPdfs.value.has(token)) return;

		try {
			downloadingPdfs.value.add(token);

			const link = document.createElement("a");
			link.href = `/api/submissions/${token}/download-pdf`;
			link.download = `submission-${token}-${new Date().toISOString().split("T")[0]}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);

			toasts.add({
				title: "מוריד PDF...",
				theme: "success",
				duration: 2000,
			});
		} catch (err) {
			console.error("Failed to download PDF:", err);
			toasts.add({
				title: "שגיאה: לא ניתן להוריד PDF",
				theme: "error",
				duration: 3000,
			});
		} finally {
			setTimeout(() => {
				downloadingPdfs.value.delete(token);
			}, 1000);
		}
	}

	function handlePreviousPage() {
		if (props.pagination?.hasPreviousPage) {
			page.value--;
		}
	}

	function handleNextPage() {
		if (props.pagination?.hasNextPage) {
			page.value++;
		}
	}

	function goToPage(p: number) {
		page.value = p;
	}

	const paginationPages = computed(() => {
		if (!props.pagination) return [];
		const totalPages = props.pagination.totalPages;
		const currentPageNum = props.pagination.page;
		const pages: (number | string)[] = [];

		pages.push(1);

		const start = Math.max(2, currentPageNum - 1);
		const end = Math.min(totalPages - 1, currentPageNum + 1);

		if (start > 2) {
			pages.push("...");
		}

		for (let i = start; i <= end; i++) {
			if (i !== 1 && i !== totalPages) {
				pages.push(i);
			}
		}

		if (end < totalPages - 1) {
			pages.push("...");
		}

		if (totalPages > 1 && !pages.includes(totalPages)) {
			pages.push(totalPages);
		}

		return pages;
	});
</script>

<template>
	<!-- Loading state -->
	<div v-if="pending" class="flex items-center justify-center py-12">
		<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
	</div>

	<!-- Error state -->
	<div v-else-if="error" class="rounded-lg bg-red-50 p-6 text-center">
		<Icon name="heroicons:exclamation-circle" class="mx-auto h-12 w-12 text-red-500" />
		<p class="mt-2 text-red-700">Failed to load submissions</p>
		<BaseButton variant="secondary" class="mt-4" @click="emit('refresh')">
			Try Again
		</BaseButton>
	</div>

	<!-- Empty state -->
	<div
		v-else-if="!submissions || submissions.length === 0"
		class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center"
	>
		<Icon name="heroicons:inbox" class="mx-auto h-12 w-12 text-gray-400" />
		<h3 class="mt-4 text-lg font-medium text-gray-900">No submissions yet</h3>
		<p class="mt-2 text-gray-500">
			<slot name="empty-message">This form hasn't received any submissions.</slot>
		</p>
	</div>

	<!-- Submissions table -->
	<template v-else>
		<div class="overflow-x-auto rounded-lg bg-white shadow">
			<table class="w-full">
				<thead class="border-b border-gray-200 bg-gray-50">
					<tr>
						<th
							class="px-6 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap"
						>
							ID
						</th>
						<th
							v-if="showFormColumn"
							class="px-6 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap"
						>
							Form
						</th>
						<th
							class="px-6 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap"
						>
							Status
						</th>
						<th
							class="px-6 py-3 text-sm font-medium text-gray-700 text-center whitespace-nowrap"
						>
							Created By User ID
						</th>
						<th
							class="px-6 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap"
						>
							Created
						</th>
						<th
							class="px-6 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap"
						>
							Submitted
						</th>
						<th
							class="px-6 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap"
						>
							Actions
						</th>
						<th
							class="px-6 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap"
						>
							Token
						</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-200">
					<tr
						v-for="submission in submissions"
						:key="submission.id"
						class="hover:bg-gray-50"
					>
						<td class="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">
							{{ submission.id }}
						</td>
						<td
							v-if="showFormColumn"
							class="px-6 py-4 text-sm whitespace-nowrap"
						>
							<NuxtLink
								:to="`/submissions/form/${submission.formId}`"
								class="text-blue-600 hover:text-blue-800 hover:underline"
							>
								{{ submission.formTitle ?? `Form #${submission.formId}` }}
							</NuxtLink>
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap">
							<div class="flex items-center gap-2">
								<span
									class="rounded-full px-2.5 py-0.5 text-xs font-medium"
									:class="statusColors[submission.status]"
								>
									{{ statusLabels[submission.status] }}
								</span>
								<span
									v-if="submission.isPublic"
									class="rounded-full bg-purple-100 text-purple-800 px-2 py-0.5 text-xs font-medium flex items-center gap-1"
									title="הגשה ציבורית"
								>
									<Icon name="heroicons:globe-alt" class="h-3 w-3" />
									ציבורי
								</span>
							</div>
						</td>
						<td
							class="px-6 py-4 text-sm text-gray-600 text-center whitespace-nowrap"
						>
							{{ submission.createdByUserId ?? "-" }}
						</td>
						<td class="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
							{{ formatDate(submission.createdAt) }}
						</td>
						<td class="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
							{{
								submission.submittedAt
									? formatDate(submission.submittedAt)
									: "-"
							}}
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap">
							<div class="flex gap-2">
								<NuxtLink :to="`/submission-detail/${submission.token}`">
									<BaseButton variant="primary" size="sm">
										<Icon name="heroicons:eye" class="h-4 w-4" />
										Details
									</BaseButton>
								</NuxtLink>
								<BaseButton
									variant="secondary"
									size="sm"
									@click="downloadPDF(submission.token)"
									:disabled="downloadingPdfs.has(submission.token)"
									:title="'Download PDF report'"
								>
									<Icon
										:name="
											downloadingPdfs.has(submission.token)
												? 'svg-spinners:ring-resize'
												: 'heroicons:arrow-down-tray'
										"
										class="h-4 w-4"
									/>
									PDF
								</BaseButton>
								<BaseButton
									v-if="submission.submissionData"
									variant="secondary"
									size="sm"
									@click="openJsonModal(submission)"
								>
									<Icon name="heroicons:document-text" class="h-4 w-4" />
									View Data
								</BaseButton>
								<BaseButton
									v-if="!['submitted', 'locked'].includes(submission.status)"
									variant="secondary"
									size="sm"
									@click="openFillUrl(submission.formId, submission.token)"
								>
									<Icon
										name="heroicons:arrow-top-right-on-square"
										class="h-4 w-4"
									/>
									Open Form
								</BaseButton>
							</div>
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap">
							<button
								@click="copyTokenToClipboard(submission.token)"
								class="flex items-center gap-2 rounded bg-gray-100 px-2 py-1 hover:bg-gray-200 transition-colors cursor-pointer"
								:title="`Copy token: ${submission.token}`"
							>
								<code class="font-mono text-xs text-gray-700 ltr">
									{{ submission.token.substring(0, 5) }}...
								</code>
								<Icon
									name="heroicons:clipboard-document"
									class="h-4 w-4 text-gray-500"
								/>
							</button>
						</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		<div
			v-if="pagination && pagination.totalPages > 1"
			class="mt-6 flex items-center justify-between"
		>
			<div class="text-sm text-gray-600">
				Showing page
				<span class="font-medium">{{ pagination.page }}</span>
				of
				<span class="font-medium">{{ pagination.totalPages }}</span>
				(Total:
				<span class="font-medium">{{ pagination.total }}</span>
				submissions)
			</div>

			<div class="flex gap-2">
				<BaseButton
					variant="secondary"
					size="sm"
					:disabled="!pagination.hasPreviousPage"
					@click="handlePreviousPage"
				>
					<Icon name="heroicons:arrow-right" class="h-4 w-4" />
					Previous
				</BaseButton>

				<div class="flex gap-1">
					<UiButton
						v-for="(pg, index) in paginationPages"
						:key="`${pg}-${index}`"
						:disabled="pg === '...'"
						:variant="pg === pagination.page ? 'default' : 'outline'"
						size="sm"
						@click="pg !== '...' && goToPage(Number(pg))"
					>
						{{ pg }}
					</UiButton>
				</div>

				<BaseButton
					variant="secondary"
					size="sm"
					:disabled="!pagination.hasNextPage"
					@click="handleNextPage"
				>
					Next
					<Icon name="heroicons:arrow-left" class="h-4 w-4" />
				</BaseButton>
			</div>
		</div>
	</template>

	<!-- JSON Modal -->
	<div
		v-if="showJsonModal && selectedSubmission"
		class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
	>
		<div class="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
			<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
				<h2 class="text-lg font-medium text-gray-900">
					Submission Data (ID: {{ selectedSubmission.id }})
				</h2>
				<button @click="closeJsonModal" class="text-gray-400 hover:text-gray-600">
					<Icon name="heroicons:x-mark" class="h-6 w-6" />
				</button>
			</div>

			<div class="max-h-96 overflow-y-auto p-6">
				<div dir="ltr" class="rounded-lg bg-gray-50 p-4 font-mono text-sm text-left">
					<pre class="whitespace-pre-wrap wrap-break-word text-gray-800">{{
						JSON.stringify(selectedSubmission.submissionData, null, 2)
					}}</pre>
				</div>
			</div>

			<div class="flex gap-3 border-t border-gray-200 px-6 py-4">
				<BaseButton variant="primary" @click="copyJsonToClipboard">
					<Icon name="heroicons:clipboard-document" class="h-4 w-4" />
					Copy JSON
				</BaseButton>
				<BaseButton variant="secondary" @click="closeJsonModal"> Close </BaseButton>
			</div>
		</div>
	</div>
</template>
