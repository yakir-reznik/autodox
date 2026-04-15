<template>
	<div class="mb-8 rounded-lg bg-white p-6 shadow">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-medium text-gray-900">
				Webhook Deliveries ({{ deliveries.length }})
			</h2>
			<BaseButton
				v-if="!isWebhookDisabled"
				variant="secondary"
				size="sm"
				:loading="isResending"
				@click="resendWebhook"
			>
				<Icon name="heroicons:arrow-path" class="h-4 w-4" />
				שלח מחדש
			</BaseButton>
		</div>

		<div v-if="isWebhookDisabled" class="rounded-lg bg-gray-50 p-4">
			<p class="text-sm text-gray-600">Webhook מושבת בהגדרות הטופס ולא סופק בשליחת הטופס.</p>
		</div>

		<div v-else class="space-y-2">
			<div
				v-for="delivery in visibleDeliveries"
				:key="delivery.id"
				class="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3"
			>
				<!-- Status badge -->
				<span
					class="shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium"
					:class="statusColors[delivery.status]"
				>
					{{ statusLabels[delivery.status] }}
				</span>

				<!-- HTTP status code -->
				<code
					class="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-700"
				>
					{{ delivery.httpStatusCode ?? "—" }}
				</code>

				<!-- URL -->
				<span class="min-w-0 flex-1 truncate font-mono text-xs text-gray-500">
					{{ delivery.webhookUrl }}
				</span>

				<!-- Retry count -->
				<span v-if="delivery.retryCount > 0" class="shrink-0 text-xs text-gray-400">
					{{ delivery.retryCount }} ניסיון חוזר
				</span>

				<!-- Time -->
				<span class="shrink-0 text-xs text-gray-400">
					{{ formatDate(delivery.createdAt) }}
				</span>

				<!-- Details button -->
				<BaseButton
					variant="secondary"
					size="sm"
					class="shrink-0"
					@click="openDetail(delivery)"
				>
					הצג פרטים נוספים
				</BaseButton>
			</div>

			<!-- Show more -->
			<button
				v-if="!showAll && deliveries.length > INITIAL_VISIBLE"
				class="mt-2 text-sm text-blue-600 hover:underline"
				@click="showAll = true"
			>
				הצג עוד {{ deliveries.length - INITIAL_VISIBLE }} ניסיונות
			</button>
		</div>

		<!-- Detail modal -->
		<UiDialog v-model:open="isModalOpen">
			<UiDialogScrollContent
				class="max-w-3xl max-h-[85svh] overflow-y-scroll overflow-x-hidden"
				dir="ltr"
			>
				<div class="h-4"></div>
				<UiDialogHeader>
					<UiDialogTitle class="text-right" dir="rtl">פרטי Webhook</UiDialogTitle>
				</UiDialogHeader>

				<!-- Loading -->
				<div v-if="isLoadingDetail" class="flex items-center justify-center py-16">
					<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
				</div>

				<div v-else-if="modalDetail" class="min-w-0 space-y-6 text-sm">
					<!-- Meta row -->
					<div class="flex flex-wrap items-center gap-3" dir="rtl">
						<span
							class="rounded-full px-2.5 py-0.5 text-xs font-medium"
							:class="statusColors[modalDetail.status]"
						>
							{{ statusLabels[modalDetail.status] }}
						</span>
						<code
							class="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-700"
						>
							{{ modalDetail.httpStatusCode ?? "—" }}
						</code>
						<span class="text-xs text-gray-500">{{
							formatDate(modalDetail.createdAt)
						}}</span>
						<span v-if="modalDetail.retryCount > 0" class="text-xs text-gray-400">
							{{ modalDetail.retryCount }} ניסיון חוזר
						</span>
					</div>

					<!-- URL -->
					<div>
						<p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
							URL
						</p>
						<code
							class="block break-all rounded bg-gray-100 px-3 py-2 text-xs text-gray-800"
						>
							{{ modalDetail.webhookUrl }}
						</code>
					</div>

					<!-- Error -->
					<div v-if="modalDetail.errorMessage" class="rounded bg-red-50 px-3 py-2">
						<p class="text-xs text-red-600">{{ modalDetail.errorMessage }}</p>
					</div>

					<!-- Delivered at -->
					<div
						v-if="modalDetail.deliveredAt"
						class="flex items-center gap-1 text-xs text-green-700"
					>
						<Icon name="heroicons:check-circle" class="h-4 w-4" />
						נמסר ב {{ formatDate(modalDetail.deliveredAt) }}
					</div>

					<!-- Request Headers -->
					<div v-if="modalDetail.requestHeaders">
						<div class="mb-1 flex items-center justify-between">
							<p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
								Request Headers
							</p>
							<BaseCopyButton
								:text="toJson(modalDetail.requestHeaders)"
								variant="ghost"
								size="sm"
							/>
						</div>
						<div
							class="w-full overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs [&_.shiki]:bg-transparent!"
						>
							<Shiki lang="json" :code="toJson(modalDetail.requestHeaders)" />
						</div>
					</div>

					<!-- Request Body -->
					<div v-if="modalDetail.requestPayload">
						<div class="mb-1 flex items-center justify-between">
							<p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
								Request Body
							</p>
							<BaseCopyButton
								:text="toJson(modalDetail.requestPayload)"
								variant="ghost"
								size="sm"
							/>
						</div>
						<div
							class="w-full overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs [&_.shiki]:bg-transparent!"
						>
							<Shiki lang="json" :code="toJson(modalDetail.requestPayload)" />
						</div>
					</div>

					<!-- Response Headers -->
					<div v-if="modalDetail.responseHeaders">
						<div class="mb-1 flex items-center justify-between">
							<p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
								Response Headers
							</p>
							<BaseCopyButton
								:text="toJson(modalDetail.responseHeaders)"
								variant="ghost"
								size="sm"
							/>
						</div>
						<div
							class="w-full overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs [&_.shiki]:bg-transparent!"
						>
							<Shiki lang="json" :code="toJson(modalDetail.responseHeaders)" />
						</div>
					</div>

					<!-- Response Body -->
					<div v-if="modalDetail.responseBody">
						<div class="mb-1 flex items-center justify-between">
							<p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
								Response Body
							</p>
							<BaseCopyButton
								:text="modalDetail.responseBody"
								variant="ghost"
								size="sm"
							/>
						</div>
						<div
							class="w-full overflow-x-auto rounded border border-gray-200 bg-gray-50 p-3 text-xs [&_.shiki]:bg-transparent!"
						>
							<Shiki lang="json" :code="modalDetail.responseBody" />
						</div>
					</div>
				</div>
			</UiDialogScrollContent>
		</UiDialog>
	</div>
</template>

<script setup lang="ts">
	type WebhookDelivery = {
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
	};

	type WebhookDeliveryDetail = {
		id: number;
		webhookUrl: string;
		status: "pending" | "success" | "failed" | "retry";
		httpStatusCode: number | null;
		errorMessage: string | null;
		requestPayload: Record<string, unknown> | null;
		requestHeaders: Record<string, string> | null;
		responseBody: string | null;
		responseHeaders: Record<string, string> | null;
		retryCount: number;
		deliveredAt: string | null;
		createdAt: string;
	};

	interface Submission {
		token: string;
		webhookUrl?: string;
	}

	interface Form {
		webhookUrl?: string | null;
	}

	const props = defineProps<{
		deliveries: WebhookDelivery[];
		submission: Submission;
		form?: Form | null;
	}>();

	const emit = defineEmits<{ refresh: [] }>();

	const INITIAL_VISIBLE = 2;
	const showAll = ref(false);
	const visibleDeliveries = computed(() =>
		showAll.value ? props.deliveries : props.deliveries.slice(0, INITIAL_VISIBLE),
	);

	const isWebhookDisabled = computed(
		() => !props.form?.webhookUrl && !props.submission.webhookUrl,
	);

	const isResending = ref(false);
	async function resendWebhook() {
		if (isResending.value) return;
		isResending.value = true;
		try {
			await $fetch(`/api/submissions/${props.submission.token}/resend-webhook`, {
				method: "POST",
			});
			emit("refresh");
		} catch (err) {
			console.error("Failed to resend webhook:", err);
		} finally {
			isResending.value = false;
		}
	}

	// Modal
	const isModalOpen = ref(false);
	const modalDetail = ref<WebhookDeliveryDetail | null>(null);
	const isLoadingDetail = ref(false);

	async function openDetail(delivery: WebhookDelivery) {
		isModalOpen.value = true;
		modalDetail.value = null;
		isLoadingDetail.value = true;
		try {
			const res = await $fetch<{ success: boolean; data: WebhookDeliveryDetail }>(
				`/api/webhook-deliveries/${delivery.id}`,
			);
			modalDetail.value = res.data;
		} catch (err) {
			console.error("Failed to load delivery detail:", err);
		} finally {
			isLoadingDetail.value = false;
		}
	}

	const statusColors: Record<string, string> = {
		success: "bg-green-100 text-green-800",
		failed: "bg-red-100 text-red-800",
		retry: "bg-yellow-100 text-yellow-800",
		pending: "bg-gray-100 text-gray-800",
	};

	const statusLabels: Record<string, string> = {
		success: "הצליח",
		failed: "נכשל",
		retry: "ניסיון חוזר",
		pending: "ממתין",
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

	function toJson(val: unknown): string {
		if (!val) return "";
		return JSON.stringify(val, null, 2);
	}
</script>
