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

	const props = defineProps<{
		deliveries: WebhookDelivery[];
		submissionToken: string;
	}>();

	const emit = defineEmits<{ refresh: [] }>();

	const INITIAL_VISIBLE = 2;
	const showAll = ref(false);
	const visibleDeliveries = computed(() =>
		showAll.value ? props.deliveries : props.deliveries.slice(0, INITIAL_VISIBLE),
	);

	const isResending = ref(false);
	async function resendWebhook() {
		if (isResending.value) return;
		isResending.value = true;
		try {
			await $fetch(`/api/submissions/${props.submissionToken}/resend-webhook`, {
				method: "POST",
			});
			emit("refresh");
		} catch (err) {
			console.error("Failed to resend webhook:", err);
		} finally {
			isResending.value = false;
		}
	}

	const modalDelivery = ref<WebhookDelivery | null>(null);
	const isModalOpen = computed({
		get: () => modalDelivery.value !== null,
		set: (v) => {
			if (!v) modalDelivery.value = null;
		},
	});

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

	function truncate(text: string | null, length = 120): string {
		if (!text) return "-";
		return text.length > length ? text.slice(0, length) + "..." : text;
	}

	function getResponseText() {
		if (!navigator) return "";
		const responseBody = modalDelivery.value?.responseBody ?? "";
		return responseBody;
	}
</script>

<template>
	<div class="mb-8 rounded-lg bg-white p-6 shadow">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-medium text-gray-900">
				Webhook Deliveries ({{ deliveries.length }})
			</h2>
			<BaseButton variant="secondary" size="sm" :loading="isResending" @click="resendWebhook">
				<Icon name="heroicons:arrow-path" class="h-4 w-4" />
				שלח מחדש
			</BaseButton>
		</div>

		<div class="space-y-4">
			<div
				v-for="delivery in visibleDeliveries"
				:key="delivery.id"
				class="rounded-lg border border-gray-200 p-4"
			>
				<!-- Status row -->
				<div class="flex flex-wrap items-center gap-3">
					<span
						class="rounded-full px-3 py-1 text-sm font-medium"
						:class="statusColors[delivery.status]"
					>
						{{ statusLabels[delivery.status] }}
					</span>
					<code
						class="rounded bg-gray-100 px-2 py-0.5 font-mono text-sm font-medium text-gray-800"
					>
						{{ delivery.httpStatusCode ?? "—" }}
					</code>
					<span class="text-sm text-gray-500">
						{{ formatDate(delivery.createdAt) }}
					</span>
					<span v-if="delivery.retryCount > 0" class="text-xs text-gray-400">
						({{ delivery.retryCount }} ניסיון חוזר)
					</span>
				</div>

				<!-- Webhook URL -->
				<p class="mt-2 break-all text-sm text-gray-600">
					<strong>URL:</strong>
					<code class="rounded bg-gray-100 px-1 py-0.5 font-mono text-xs">{{
						delivery.webhookUrl
					}}</code>
				</p>

				<!-- Response body preview -->
				<div class="mt-2">
					<p class="text-sm text-gray-600">
						<strong>Response:</strong>
						<code class="font-mono text-xs text-gray-700">{{
							truncate(delivery.responseBody)
						}}</code>
					</p>
					<button
						v-if="delivery.responseBody && delivery.responseBody.length > 120"
						class="mt-1 text-xs text-blue-600 hover:underline"
						@click="modalDelivery = delivery"
					>
						הצג תשובה מלאה
					</button>
				</div>

				<!-- Error -->
				<div v-if="delivery.errorMessage" class="mt-2 rounded bg-red-50 p-2">
					<p class="text-sm text-red-600">{{ delivery.errorMessage }}</p>
				</div>

				<!-- Delivered at -->
				<p v-if="delivery.deliveredAt" class="mt-2 text-sm text-green-700">
					<Icon name="heroicons:check-circle" class="mr-1 inline-block h-4 w-4" />
					נמסר ב {{ formatDate(delivery.deliveredAt) }}
				</p>
			</div>
		</div>

		<!-- Show more -->
		<button
			v-if="!showAll && deliveries.length > INITIAL_VISIBLE"
			class="mt-4 text-sm text-blue-600 hover:underline"
			@click="showAll = true"
		>
			הצג עוד {{ deliveries.length - INITIAL_VISIBLE }} ניסיונות
		</button>

		<!-- Response body modal -->
		<BaseModal v-model="isModalOpen" title="תשובה מלאה" size="xl">
			<div class="relative">
				<BaseCopyButton :text="getResponseText()" />

				<textarea
					readonly
					dir="ltr"
					class="mt-4 h-96 w-full rounded border border-gray-200 bg-gray-50 p-3 text-left font-mono text-xs text-gray-800 resize-none focus:outline-none"
					:value="modalDelivery?.responseBody ?? ''"
				/>
			</div>
		</BaseModal>
	</div>
</template>
