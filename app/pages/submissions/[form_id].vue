<script setup lang="ts">
	interface Submission {
		id: number;
		token: string;
		formId: number;
		prefillData: Record<string, unknown> | null;
		additionalData: Record<string, unknown> | null;
		createdByUserId: number | null;
		expiresAt: string;
		status: "pending" | "in_progress" | "submitted" | "locked";
		submissionData: Record<string, unknown> | null;
		createdAt: string;
		startedAt: string | null;
		submittedAt: string | null;
		lockedAt: string | null;
	}

	interface PaginatedResponse {
		data: Submission[];
		pagination: {
			page: number;
			limit: number;
			total: number;
			totalPages: number;
			hasNextPage: boolean;
			hasPreviousPage: boolean;
		};
	}

	const route = useRoute();
	const toasts = useToasts();

	const { user, loggedIn } = useUserSession();

	const formId = Number(route.params.form_id);
	const currentPage = ref(1);
	const selectedSubmission = ref<Submission | null>(null);
	const showJsonModal = ref(false);
	const userMap = ref<Record<number, string>>({});
	const isCreatingSubmission = ref(false);

	const {
		data: response,
		pending,
		error,
		refresh,
	} = await useFetch<PaginatedResponse>(
		() => `/api/forms/${formId}/submissions?page=${currentPage.value}`
	);

	const submissions = computed(() => response.value?.data ?? []);
	const pagination = computed(() => response.value?.pagination);

	// Watch for page changes and refresh data
	watch(
		() => currentPage.value,
		async () => {
			await refresh();
		}
	);

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

	function openFillUrl(token: string) {
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

	function handlePreviousPage() {
		if (pagination.value?.hasPreviousPage) {
			currentPage.value--;
		}
	}

	function handleNextPage() {
		if (pagination.value?.hasNextPage) {
			currentPage.value++;
		}
	}

	function goToPage(page: number) {
		currentPage.value = page;
	}

	// Generate page numbers to display in pagination (smart paging)
	const paginationPages = computed(() => {
		if (!pagination.value) return [];
		const totalPages = pagination.value.totalPages;
		const currentPageNum = pagination.value.page;
		const pages: (number | string)[] = [];

		// Show first page
		pages.push(1);

		// Calculate range around current page
		const start = Math.max(2, currentPageNum - 1);
		const end = Math.min(totalPages - 1, currentPageNum + 1);

		// Add ellipsis if needed
		if (start > 2) {
			pages.push("...");
		}

		// Add pages around current page
		for (let i = start; i <= end; i++) {
			if (i !== 1 && i !== totalPages) {
				pages.push(i);
			}
		}

		// Add ellipsis if needed
		if (end < totalPages - 1) {
			pages.push("...");
		}

		// Show last page (if more than one page)
		if (totalPages > 1 && !pages.includes(totalPages)) {
			pages.push(totalPages);
		}

		return pages;
	});

	async function createNewSubmission() {
		if (!user.value?.apiKey) {
			toasts.add({
				title: "שגיאה: לא נמצא API Key",
				theme: "error",
				duration: 3000,
			});
			return;
		}

		isCreatingSubmission.value = true;

		try {
			const response = await $fetch<{
				success: boolean;
				link?: string;
				token?: string;
				formId?: number;
				expiresAt?: string;
				message?: string;
			}>(`/api/forms/${formId}/create-submission-link`, {
				method: "POST",
				headers: {
					"x-api-key": user.value.apiKey,
				},
			});

			if (response.success) {
				toasts.add({
					title: "הגשה חדשה נוצרה בהצלחה",
					theme: "success",
					duration: 3000,
				});

				// Refresh the submissions list to show the new submission
				await refresh();
			} else {
				toasts.add({
					title: `שגיאה: ${response.message || "לא ניתן ליצור הגשה"}`,
					theme: "error",
					duration: 3000,
				});
			}
		} catch (error: any) {
			toasts.add({
				title: `שגיאה: ${error.message || "לא ניתן ליצור הגשה"}`,
				theme: "error",
				duration: 3000,
			});
		} finally {
			isCreatingSubmission.value = false;
		}
	}

	const downloadingPdfs = ref<Set<string>>(new Set());

	function downloadPDF(token: string) {
		if (downloadingPdfs.value.has(token)) return;

		try {
			downloadingPdfs.value.add(token);

			// Create a temporary anchor element to trigger download
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
			// Add a small delay before re-enabling the button
			setTimeout(() => {
				downloadingPdfs.value.delete(token);
			}, 1000);
		}
	}

	useHead({
		title: "Submissions - Autodox",
	});
</script>

<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<!-- Header -->
		<header class="bg-white shadow">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<NuxtLink to="/forms">
							<UiButton variant="secondary" size="sm">
								<Icon name="heroicons:arrow-left" class="h-5 w-5" />
							</UiButton>
						</NuxtLink>
						<div>
							<h1 class="text-2xl font-bold text-gray-900">Submissions</h1>
							<p class="text-sm text-gray-600">Form ID: {{ formId }}</p>
						</div>
					</div>
					<div class="flex items-center gap-3">
						<div class="text-sm text-gray-600" v-if="loggedIn">
							{{ user?.name }}
						</div>
					</div>
				</div>
			</div>
		</header>

		<!-- Content -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<!-- Create New Submission Button -->
			<div class="mb-6 flex justify-end gap-3">
				<UiButton
					variant="secondary"
					@click="refresh"
					:disabled="pending"
					:title="'Refresh submissions data'"
				>
					<Icon v-if="pending" name="svg-spinners:ring-resize" class="h-4 w-4" />
					<Icon v-else name="heroicons:arrow-path" class="h-4 w-4" />
					{{ pending ? "טוען..." : "רענן" }}
				</UiButton>
				<UiButton
					variant="primary"
					@click="createNewSubmission"
					:disabled="isCreatingSubmission || !loggedIn"
				>
					<Icon
						v-if="isCreatingSubmission"
						name="svg-spinners:ring-resize"
						class="h-4 w-4"
					/>
					<Icon v-else name="heroicons:plus" class="h-4 w-4" />
					{{ isCreatingSubmission ? "יוצר הגשה..." : "צור הגשה חדשה" }}
				</UiButton>
			</div>

			<!-- Loading state -->
			<div v-if="pending" class="flex items-center justify-center py-12">
				<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
			</div>

			<!-- Error state -->
			<div v-else-if="error" class="rounded-lg bg-red-50 p-6 text-center">
				<Icon name="heroicons:exclamation-circle" class="mx-auto h-12 w-12 text-red-500" />
				<p class="mt-2 text-red-700">Failed to load submissions</p>
				<UiButton variant="secondary" class="mt-4" @click="refresh"> Try Again </UiButton>
			</div>

			<!-- Empty state -->
			<div
				v-else-if="!submissions || submissions.length === 0"
				class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center"
			>
				<Icon name="heroicons:inbox" class="mx-auto h-12 w-12 text-gray-400" />
				<h3 class="mt-4 text-lg font-medium text-gray-900">No submissions yet</h3>
				<p class="mt-2 text-gray-500">This form hasn't received any submissions.</p>
			</div>

			<!-- Submissions table -->
			<div v-else class="overflow-x-auto rounded-lg bg-white shadow">
				<table class="w-full">
					<thead class="border-b border-gray-200 bg-gray-50">
						<tr>
							<th
								class="px-6 py-3 text-right text-sm font-medium text-gray-700 whitespace-nowrap"
							>
								ID
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
							<td class="px-6 py-4 text-sm whitespace-nowrap">
								<span
									class="rounded-full px-2.5 py-0.5 text-xs font-medium"
									:class="statusColors[submission.status]"
								>
									{{ statusLabels[submission.status] }}
								</span>
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
										<UiButton variant="primary" size="sm">
											<Icon name="heroicons:eye" class="h-4 w-4" />
											Details
										</UiButton>
									</NuxtLink>
									<UiButton
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
									</UiButton>
									<UiButton
										v-if="submission.submissionData"
										variant="secondary"
										size="sm"
										@click="openJsonModal(submission)"
									>
										<Icon name="heroicons:document-text" class="h-4 w-4" />
										View Data
									</UiButton>
									<UiButton
										v-if="!['submitted', 'locked'].includes(submission.status)"
										variant="secondary"
										size="sm"
										@click="openFillUrl(submission.token)"
									>
										<Icon
											name="heroicons:arrow-top-right-on-square"
											class="h-4 w-4"
										/>
										Open Form
									</UiButton>
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
					<UiButton
						variant="secondary"
						size="sm"
						:disabled="!pagination.hasPreviousPage"
						@click="handlePreviousPage"
					>
						<Icon name="heroicons:arrow-right" class="h-4 w-4" />
						Previous
					</UiButton>

					<!-- Page numbers -->
					<div class="flex gap-1">
						<button
							v-for="(page, index) in paginationPages"
							:key="`${page}-${index}`"
							:disabled="page === '...'"
							class="rounded border px-3 py-1 text-sm font-medium transition-colors disabled:cursor-default disabled:border-gray-200 disabled:bg-white disabled:text-gray-400"
							:class="
								page === pagination.page
									? 'border-blue-500 bg-blue-50 text-blue-700'
									: 'border-gray-300 text-gray-700 hover:bg-gray-50 disabled:hover:bg-white'
							"
							@click="page !== '...' && goToPage(Number(page))"
						>
							{{ page }}
						</button>
					</div>

					<UiButton
						variant="secondary"
						size="sm"
						:disabled="!pagination.hasNextPage"
						@click="handleNextPage"
					>
						Next
						<Icon name="heroicons:arrow-left" class="h-4 w-4" />
					</UiButton>
				</div>
			</div>
		</main>

		<!-- JSON Modal -->
		<div
			v-if="showJsonModal && selectedSubmission"
			class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
		>
			<div class="relative w-full max-w-3xl rounded-lg bg-white shadow-xl">
				<!-- Modal Header -->
				<div class="flex items-center justify-between border-b border-gray-200 px-6 py-4">
					<h2 class="text-lg font-medium text-gray-900">
						Submission Data (ID: {{ selectedSubmission.id }})
					</h2>
					<button @click="closeJsonModal" class="text-gray-400 hover:text-gray-600">
						<Icon name="heroicons:x-mark" class="h-6 w-6" />
					</button>
				</div>

				<!-- Modal Content -->
				<div class="max-h-96 overflow-y-auto p-6">
					<!-- JSON Display with LTR and left alignment -->
					<div dir="ltr" class="rounded-lg bg-gray-50 p-4 font-mono text-sm text-left">
						<pre class="whitespace-pre-wrap wrap-break-word text-gray-800">{{
							JSON.stringify(selectedSubmission.submissionData, null, 2)
						}}</pre>
					</div>
				</div>

				<!-- Modal Footer -->
				<div class="flex gap-3 border-t border-gray-200 px-6 py-4">
					<UiButton variant="primary" @click="copyJsonToClipboard">
						<Icon name="heroicons:clipboard-document" class="h-4 w-4" />
						Copy JSON
					</UiButton>
					<UiButton variant="secondary" @click="closeJsonModal"> Close </UiButton>
				</div>
			</div>
		</div>
	</div>
</template>
