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
	const { user, loggedIn } = useUserSession();

	const formId = Number(route.params.id);
	const currentPage = ref(1);

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
							<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
								ID
							</th>
							<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
								Status
							</th>
							<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
								Created
							</th>
							<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
								Submitted
							</th>
							<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
								Expires
							</th>
							<th class="px-6 py-3 text-right text-sm font-medium text-gray-700">
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
							<td class="px-6 py-4 text-sm text-gray-900">
								{{ submission.id }}
							</td>
							<td class="px-6 py-4 text-sm">
								<span
									class="rounded-full px-2.5 py-0.5 text-xs font-medium"
									:class="statusColors[submission.status]"
								>
									{{ statusLabels[submission.status] }}
								</span>
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{{ formatDate(submission.createdAt) }}
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{{
									submission.submittedAt
										? formatDate(submission.submittedAt)
										: "-"
								}}
							</td>
							<td class="px-6 py-4 text-sm text-gray-600">
								{{ formatDate(submission.expiresAt) }}
							</td>
							<td class="px-6 py-4 text-sm">
								<code class="rounded bg-gray-100 px-2 py-1 text-xs text-gray-800">
									{{ submission.token.substring(0, 8) }}...
								</code>
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
							v-for="page in Math.min(5, pagination.totalPages)"
							:key="page"
							class="rounded border px-3 py-1 text-sm font-medium transition-colors"
							:class="
								page === pagination.page
									? 'border-blue-500 bg-blue-50 text-blue-700'
									: 'border-gray-300 text-gray-700 hover:bg-gray-50'
							"
							@click="goToPage(page)"
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
	</div>
</template>
