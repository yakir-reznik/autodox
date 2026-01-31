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
		retryCount: number;
		deliveredAt: string | null;
		createdAt: string;
		updatedAt: string;
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
	const { user, loggedIn } = useUserSession();

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

	const webhookStatusColors: Record<string, string> = {
		success: "bg-green-100 text-green-800",
		failed: "bg-red-100 text-red-800",
		retry: "bg-yellow-100 text-yellow-800",
		pending: "bg-gray-100 text-gray-800",
	};

	const webhookStatusLabels: Record<string, string> = {
		success: "Success",
		failed: "Failed",
		retry: "Retrying",
		pending: "Pending",
	};

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("he-IL", {
			year: "numeric",
			month: "short",
			day: "numeric",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
		});
	}

	function copyToClipboard(text: string, label: string = "Text") {
		navigator.clipboard.writeText(text).then(() => {
			console.log(`${label} copied to clipboard`);
		});
	}

	const isDownloading = ref(false);

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
		<!-- Header -->
		<header class="bg-white shadow">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<NuxtLink to="/forms">
							<BaseButton variant="secondary" size="sm">
								<Icon name="heroicons:arrow-left" class="h-5 w-5" />
							</BaseButton>
						</NuxtLink>
						<div>
							<h1 class="text-2xl font-bold text-gray-900">Submission Details</h1>
							<p class="text-sm text-gray-600">Token: {{ token }}</p>
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
				<div v-if="submission.submissionData" class="mb-8 rounded-lg bg-white p-6 shadow">
					<h2 class="mb-4 text-lg font-medium text-gray-900">Submitted Data</h2>
					<div
						dir="ltr"
						class="overflow-x-auto rounded-lg bg-gray-50 p-4 font-mono text-sm"
					>
						<pre class="whitespace-pre-wrap wrap-break-word text-gray-800">{{
							JSON.stringify(submission.submissionData, null, 2)
						}}</pre>
					</div>
					<div class="mt-4 flex gap-2">
						<BaseButton
							variant="secondary"
							size="sm"
							@click="
								copyToClipboard(
									JSON.stringify(submission.submissionData, null, 2),
									'Submission data',
								)
							"
						>
							<Icon name="heroicons:clipboard-document" class="h-4 w-4" />
							Copy JSON
						</BaseButton>
					</div>
				</div>

				<!-- Prefill Data -->
				<div v-if="submission.prefillData" class="mb-8 rounded-lg bg-white p-6 shadow">
					<h2 class="mb-4 text-lg font-medium text-gray-900">Prefill Data</h2>
					<div
						dir="ltr"
						class="overflow-x-auto rounded-lg bg-gray-50 p-4 font-mono text-sm"
					>
						<pre class="whitespace-pre-wrap wrap-break-word text-gray-800">{{
							JSON.stringify(submission.prefillData, null, 2)
						}}</pre>
					</div>
					<div class="mt-4 flex gap-2">
						<BaseButton
							variant="secondary"
							size="sm"
							@click="
								copyToClipboard(
									JSON.stringify(submission.prefillData, null, 2),
									'Prefill data',
								)
							"
						>
							<Icon name="heroicons:clipboard-document" class="h-4 w-4" />
							Copy JSON
						</BaseButton>
					</div>
				</div>

				<!-- Additional Data -->
				<div v-if="submission.additionalData" class="mb-8 rounded-lg bg-white p-6 shadow">
					<h2 class="mb-4 text-lg font-medium text-gray-900">Additional Data</h2>
					<div
						dir="ltr"
						class="overflow-x-auto rounded-lg bg-gray-50 p-4 font-mono text-sm"
					>
						<pre class="whitespace-pre-wrap wrap-break-word text-gray-800">{{
							JSON.stringify(submission.additionalData, null, 2)
						}}</pre>
					</div>
					<div class="mt-4 flex gap-2">
						<BaseButton
							variant="secondary"
							size="sm"
							@click="
								copyToClipboard(
									JSON.stringify(submission.additionalData, null, 2),
									'Additional data',
								)
							"
						>
							<Icon name="heroicons:clipboard-document" class="h-4 w-4" />
							Copy JSON
						</BaseButton>
					</div>
				</div>

				<!-- Form Entrances -->
				<div v-if="entrances.length > 0" class="mb-8 rounded-lg bg-white p-6 shadow">
					<h2 class="mb-4 text-lg font-medium text-gray-900">
						Form Entrances ({{ entrances.length }})
					</h2>
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
									v-for="(entrance, index) in entrances"
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
				</div>

				<!-- Webhook Deliveries -->
				<div
					v-if="webhookDeliveries.length > 0"
					class="mb-8 rounded-lg bg-white p-6 shadow"
				>
					<h2 class="mb-4 text-lg font-medium text-gray-900">
						Webhook Deliveries ({{ webhookDeliveries.length }})
					</h2>
					<div class="space-y-4">
						<div
							v-for="delivery in webhookDeliveries"
							:key="delivery.id"
							class="rounded-lg border border-gray-200 p-4"
						>
							<!-- Header with status and URL -->
							<div
								class="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"
							>
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<span
											class="rounded-full px-3 py-1 text-sm font-medium"
											:class="webhookStatusColors[delivery.status]"
										>
											{{ webhookStatusLabels[delivery.status] }}
										</span>
										<span
											v-if="delivery.httpStatusCode"
											class="text-sm text-gray-600"
										>
											HTTP {{ delivery.httpStatusCode }}
										</span>
									</div>
									<p class="mt-2 break-all text-sm text-gray-700">
										<strong>URL:</strong>
										<code class="rounded bg-gray-100 px-1 py-0.5 font-mono">
											{{ delivery.webhookUrl }}
										</code>
									</p>
								</div>
								<div class="text-right text-sm text-gray-600">
									<p>
										<strong>Attempt:</strong>
										{{ delivery.retryCount + 1 }}
									</p>
									<p class="mt-1">
										{{ formatDate(delivery.createdAt) }}
									</p>
								</div>
							</div>

							<!-- Delivered timestamp -->
							<div v-if="delivery.deliveredAt" class="mt-3 text-sm text-green-700">
								<Icon
									name="heroicons:check-circle"
									class="mr-1 inline-block h-4 w-4"
								/>
								Delivered at {{ formatDate(delivery.deliveredAt) }}
							</div>

							<!-- Error message -->
							<div v-if="delivery.errorMessage" class="mt-3 rounded-lg bg-red-50 p-3">
								<p class="text-sm font-medium text-red-700">Error</p>
								<p class="mt-1 text-sm text-red-600">{{ delivery.errorMessage }}</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
</template>
