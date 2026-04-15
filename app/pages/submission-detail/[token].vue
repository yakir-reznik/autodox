<script setup lang="ts">
	interface Submission {
		id: number;
		name: string | null;
		token: string;
		formId: number;
		prefillData: Record<string, unknown> | null;
		additionalData: Record<string, unknown> | null;
		externalId: string | null;
		createdByUserId: number | null;
		expiresAt: string;
		status: "pending" | "in_progress" | "submitted" | "locked";
		submissionData: Record<string, unknown> | null;
		createdAt: string;
		startedAt: string | null;
		submittedAt: string | null;
		lockedAt: string | null;
	}

	interface FormEntrance {
		id: number;
		sessionToken: string | null;
		formId: number;
		ipAddress: string | null;
		userAgent: string | null;
		referrer: string | null;
		isFormLocked: boolean;
		isNewSession: boolean;
		country: string | null;
		deviceType: "mobile" | "tablet" | "desktop" | "unknown";
		browserName: string | null;
		osName: string | null;
		metadata: Record<string, unknown>;
		timestamp: string;
		createdAt: string;
	}

	interface Form {
		id: number;
		title: string;
		description: string | null;
	}

	interface WebhookDelivery {
		id: number;
		submissionId: number;
		webhookUrl: string;
		status: "pending" | "success" | "failed" | "retry";
		httpStatusCode: number | null;
		errorMessage: string | null;
		responseBody: string | null;
		retryCount: number;
		deliveredAt: string | null;
		createdAt: string;
	}

	interface DetailsResponse {
		success: boolean;
		data: {
			submission: Submission;
			form: Form | null;
			entrances: FormEntrance[];
			webhookDeliveries: WebhookDelivery[];
		};
	}

	const route = useRoute();

	const token = route.params.token as string;

	const {
		data: response,
		pending,
		error,
		refresh,
	} = await useFetch<DetailsResponse>(() => `/api/submissions/${token}/details`);

	const submission = computed(() => response.value?.data?.submission);
	const form = computed(() => response.value?.data?.form);
	const entrances = computed(() => response.value?.data?.entrances ?? []);
	const webhookDeliveries = computed(() => response.value?.data?.webhookDeliveries ?? []);

	const statusColors: Record<string, string> = {
		pending: "bg-gray-100 text-gray-800",
		in_progress: "bg-blue-100 text-blue-800",
		submitted: "bg-green-100 text-green-800",
		locked: "bg-red-100 text-red-800",
	};

	const statusLabels: Record<string, string> = {
		pending: "Pending",
		in_progress: "In Progress",
		submitted: "Submitted",
		locked: "Locked",
	};

	const deviceTypeLabels: Record<string, string> = {
		mobile: "Mobile",
		tablet: "Tablet",
		desktop: "Desktop",
		unknown: "Unknown",
	};

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

	const isDownloading = ref(false);
	const isSubmissionDataExpanded = ref(false);
	const isPrefillDataExpanded = ref(false);
	const isEntrancesExpanded = ref(false);

	const ENTRANCES_LIMIT = 5;
	const visibleEntrances = computed(() =>
		isEntrancesExpanded.value ? entrances.value : entrances.value.slice(0, ENTRANCES_LIMIT),
	);

	const submissionDataLines = computed(() => {
		if (!submission.value?.submissionData) return [];
		return JSON.stringify(submission.value.submissionData, null, 2).split("\n");
	});

	const visibleSubmissionData = computed(() => {
		const lines = submissionDataLines.value;
		if (isSubmissionDataExpanded.value || lines.length <= 10) return lines.join("\n");
		return lines.slice(0, 10).join("\n");
	});

	const sortKeys = (obj: Record<string, unknown>): Record<string, unknown> =>
		Object.fromEntries(
			Object.keys(obj)
				.sort()
				.map((k) => [k, obj[k]]),
		);

	const prefillDataLines = computed(() => {
		if (!submission.value?.prefillData) return [];
		return JSON.stringify(sortKeys(submission.value.prefillData), null, 2).split("\n");
	});

	const visiblePrefillData = computed(() => {
		const lines = prefillDataLines.value;
		if (isPrefillDataExpanded.value || lines.length <= 10) return lines.join("\n");
		return lines.slice(0, 10).join("\n");
	});

	async function downloadPDF() {
		if (isDownloading.value) return;

		try {
			isDownloading.value = true;

			// Create a temporary anchor element to trigger download
			const link = document.createElement("a");
			link.href = `/api/submissions/${token}/download-pdf`;
			link.download = `submission-${token}-${new Date().toISOString().split("T")[0]}.pdf`;
			document.body.appendChild(link);
			link.click();
			document.body.removeChild(link);
		} catch (err) {
			console.error("Failed to download PDF:", err);
			alert("Failed to download PDF. Please try again.");
		} finally {
			// Add a small delay before re-enabling the button
			setTimeout(() => {
				isDownloading.value = false;
			}, 1000);
		}
	}

	useHead({
		title: `Submission Details - Autodox`,
	});
</script>

<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<SubmissionDetailHeader :token />

		<!-- Content -->
		<main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<!-- Loading state -->
			<div v-if="pending" class="flex items-center justify-center py-12">
				<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
			</div>

			<!-- Error state -->
			<div v-else-if="error" class="rounded-lg bg-red-50 p-6 text-center">
				<Icon name="heroicons:exclamation-circle" class="mx-auto h-12 w-12 text-red-500" />
				<p class="mt-2 text-red-700">
					{{ error.message || "Failed to load submission details" }}
				</p>
				<BaseButton variant="secondary" class="mt-4" @click="refresh">
					Try Again
				</BaseButton>
			</div>

			<!-- Content -->
			<div v-else-if="submission">
				<!-- Submission Overview Card -->
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
							<div class="mt-2">
								<span
									class="rounded-full px-3 py-1 text-sm font-medium"
									:class="statusColors[submission.status]"
								>
									{{ statusLabels[submission.status] }}
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
							<label class="block text-sm font-medium text-gray-700"
								>Created By User ID</label
							>
							<div class="mt-2 text-gray-900">
								{{ submission.createdByUserId ?? "Anonymous" }}
							</div>
						</div>

						<!-- Download PDF Button -->
						<div>
							<label class="block text-sm font-medium mb-2 text-gray-700"
								>Download PDF</label
							>
							<BaseButton
								v-if="!pending && submission"
								variant="primary"
								size="sm"
								@click="downloadPDF"
								:disabled="isDownloading"
							>
								<Icon
									:name="
										isDownloading
											? 'svg-spinners:ring-resize'
											: 'heroicons:arrow-down-tray'
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
										<Icon
											name="heroicons:calendar-days"
											class="h-4 w-4 text-blue-600"
										/>
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
										<Icon
											name="heroicons:check-circle"
											class="h-4 w-4 text-green-600"
										/>
									</div>
								</div>
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">Form Submitted</p>
									<p class="text-sm text-gray-600">
										{{ formatDate(submission.submittedAt) }}
									</p>
								</div>
							</div>

							<div v-if="submission.lockedAt" class="flex gap-4">
								<div class="flex flex-col items-center">
									<div
										class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100"
									>
										<Icon
											name="heroicons:lock-closed"
											class="h-4 w-4 text-red-600"
										/>
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

				<!-- Submission Data -->
				<div
					v-if="submission.submissionData"
					class="mb-8 overflow-hidden rounded-lg bg-white shadow"
				>
					<div
						class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3"
					>
						<h2 class="text-lg font-medium text-gray-900">Submitted Data</h2>
						<BaseCopyButton
							:text="JSON.stringify(submission.submissionData, null, 2)"
							variant="ghost"
						/>
					</div>
					<div class="relative">
						<div
							dir="ltr"
							class="overflow-x-auto p-4 text-sm [&_.shiki]:bg-transparent!"
						>
							<Shiki lang="json" :code="visibleSubmissionData" />
						</div>
						<div
							v-if="submissionDataLines.length > 10 && !isSubmissionDataExpanded"
							class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent"
						/>
					</div>
					<button
						v-if="submissionDataLines.length > 10"
						class="w-full cursor-pointer border-t border-gray-100 py-2.5 text-center text-sm text-blue-600 transition hover:bg-gray-50"
						@click="isSubmissionDataExpanded = !isSubmissionDataExpanded"
					>
						{{
							isSubmissionDataExpanded
								? "הצג פחות"
								: `הצג עוד (${submissionDataLines.length - 10} שורות נוספות)`
						}}
					</button>
				</div>

				<!-- Prefill Data -->
				<div
					v-if="submission.prefillData"
					class="mb-8 overflow-hidden rounded-lg bg-white shadow"
				>
					<div
						class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3"
					>
						<h2 class="text-lg font-medium text-gray-900">Prefill Data</h2>
						<BaseCopyButton
							:text="JSON.stringify(sortKeys(submission.prefillData!), null, 2)"
							variant="ghost"
						/>
					</div>
					<div class="relative">
						<div
							dir="ltr"
							class="overflow-x-auto p-4 text-sm [&_.shiki]:bg-transparent!"
						>
							<Shiki lang="json" :code="visiblePrefillData" />
						</div>
						<div
							v-if="prefillDataLines.length > 10 && !isPrefillDataExpanded"
							class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent"
						/>
					</div>
					<button
						v-if="prefillDataLines.length > 10"
						class="w-full cursor-pointer border-t border-gray-100 py-2.5 text-center text-sm text-blue-600 transition hover:bg-gray-50"
						@click="isPrefillDataExpanded = !isPrefillDataExpanded"
					>
						{{
							isPrefillDataExpanded
								? "הצג פחות"
								: `הצג עוד (${prefillDataLines.length - 10} שורות נוספות)`
						}}
					</button>
				</div>

				<!-- Additional Data -->
				<div
					v-if="submission.additionalData"
					class="mb-8 overflow-hidden rounded-lg bg-white shadow"
				>
					<div
						class="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-6 py-3"
					>
						<h2 class="text-lg font-medium text-gray-900">Additional Data</h2>
						<BaseCopyButton
							:text="JSON.stringify(submission.additionalData, null, 2)"
							variant="ghost"
						/>
					</div>
					<div dir="ltr" class="overflow-x-auto p-4 text-sm [&_.shiki]:bg-transparent!">
						<Shiki
							lang="json"
							:code="JSON.stringify(submission.additionalData, null, 2)"
						/>
					</div>
				</div>

				<!-- Form Entrances -->
				<div
					v-if="entrances.length > 0"
					class="mb-8 overflow-hidden rounded-lg bg-white shadow"
				>
					<div class="border-b border-gray-200 bg-gray-50 px-6 py-3">
						<h2 class="text-lg font-medium text-gray-900">
							Form Entrances ({{ entrances.length }})
						</h2>
					</div>
					<div class="relative">
						<div class="overflow-x-auto">
							<table class="w-full">
								<thead class="border-b border-gray-200 bg-gray-50">
									<tr>
										<th
											class="px-4 py-3 text-right text-sm font-medium text-gray-700"
										>
											Entrance #
										</th>
										<th
											class="px-4 py-3 text-right text-sm font-medium text-gray-700"
										>
											Date & Time
										</th>
										<th
											class="px-4 py-3 text-center text-sm font-medium text-gray-700"
										>
											Device Type
										</th>
										<th
											class="px-4 py-3 text-right text-sm font-medium text-gray-700"
										>
											Browser
										</th>
										<th
											class="px-4 py-3 text-right text-sm font-medium text-gray-700"
										>
											OS
										</th>
										<th
											class="px-4 py-3 text-center text-sm font-medium text-gray-700"
										>
											IP Address
										</th>
										<th
											class="px-4 py-3 text-center text-sm font-medium text-gray-700"
										>
											Country
										</th>
										<th
											class="px-4 py-3 text-center text-sm font-medium text-gray-700"
										>
											New Session
										</th>
									</tr>
								</thead>
								<tbody class="divide-y divide-gray-200">
									<tr
										v-for="(entrance, index) in visibleEntrances"
										:key="entrance.id"
										class="hover:bg-gray-50"
									>
										<td class="px-4 py-3 text-sm text-gray-900">
											#{{ index + 1 }}
										</td>
										<td class="px-4 py-3 text-sm text-gray-600">
											{{ formatDate(entrance.timestamp) }}
										</td>
										<td class="px-4 py-3 text-center text-sm text-gray-600">
											<span
												class="inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800"
											>
												{{ deviceTypeLabels[entrance.deviceType] }}
											</span>
										</td>
										<td class="px-4 py-3 text-sm text-gray-600">
											{{ entrance.browserName ?? "-" }}
										</td>
										<td class="px-4 py-3 text-sm text-gray-600">
											{{ entrance.osName ?? "-" }}
										</td>
										<td class="px-4 py-3 text-center text-sm">
											<code
												v-if="entrance.ipAddress"
												class="rounded bg-gray-100 px-2 py-1 font-mono text-xs text-gray-700"
											>
												{{ entrance.ipAddress }}
											</code>
											<span v-else class="text-gray-400">-</span>
										</td>
										<td class="px-4 py-3 text-center text-sm text-gray-600">
											{{ entrance.country ?? "-" }}
										</td>
										<td class="px-4 py-3 text-center text-sm">
											<Icon
												v-if="entrance.isNewSession"
												name="heroicons:check-circle"
												class="mx-auto h-5 w-5 text-green-600"
											/>
											<Icon
												v-else
												name="heroicons:x-circle"
												class="mx-auto h-5 w-5 text-gray-400"
											/>
										</td>
									</tr>
								</tbody>
							</table>
						</div>
						<div
							v-if="entrances.length > ENTRANCES_LIMIT && !isEntrancesExpanded"
							class="pointer-events-none absolute bottom-0 left-0 right-0 h-20 bg-linear-to-t from-white to-transparent"
						/>
					</div>
					<button
						v-if="entrances.length > ENTRANCES_LIMIT"
						class="w-full cursor-pointer border-t border-gray-100 py-2.5 text-center text-sm text-blue-600 transition hover:bg-gray-50"
						@click="isEntrancesExpanded = !isEntrancesExpanded"
					>
						{{
							isEntrancesExpanded
								? "הצג פחות"
								: `הצג עוד (${entrances.length - ENTRANCES_LIMIT} כניסות נוספות)`
						}}
					</button>
				</div>

				<!-- Webhook Deliveries -->
				<SubmissionDetailWebhookDeliveries
					v-if="webhookDeliveries.length > 0"
					:deliveries="webhookDeliveries"
					:submission-token="token"
					@refresh="refresh"
				/>
			</div>
		</main>
	</div>
</template>
