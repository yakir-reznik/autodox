<template>
	<!-- Content -->
	<main dir="rtl" class="max-w-4xl">
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
			<BaseButton variant="secondary" class="mt-4" @click="refresh"> Try Again </BaseButton>
		</div>

		<div v-else-if="submission">
			<SubmissionDetailOverview :submission :form />

			<SubmissionDetailSubmittedData :submission />

			<SubmissionDetailPrefillData :submission />

			<SubmissionDetailAdditionalData :submission />

			<SubmissionDetailFormEntrances :entrances />

			<SubmissionDetailWebhookDeliveries
				:deliveries="webhookDeliveries"
				:submission
				:form
				@refresh="refresh"
			/>
		</div>
	</main>
</template>

<script setup lang="ts">
	import { type Submission, type FormEntrance } from "~/types/Submission";

	definePageMeta({
		layout: "management-panel",
		heading: "פרטי הגשה",
		breadcrumbs: [
			{ label: "רשימת טפסים", to: "/manage" },
			{ label: `רשימת הגשות` },
			{ label: "פרטי הגשה" },
		],
	});

	interface Form {
		id: number;
		title: string;
		description: string | null;
		webhookUrl?: string | null;
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

	useHead({
		title: `Submission Details - Autodox`,
	});

	// Update breadcrumbs after loading page data
	if (form.value) {
		route.meta.breadcrumbs = [
			{ label: "רשימת טפסים", to: "/manage" },
			{
				label: `רשימת הגשות (${form.value.title})`,
				to: `/manage/submissions/${form.value.id}`,
			},
			{ label: "פרטי הגשה" },
		];
	}
</script>
