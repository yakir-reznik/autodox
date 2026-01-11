<script setup lang="ts">
	interface Form {
		id: number;
		title: string;
		description: string | null;
		status: "draft" | "published" | "archived";
		createdAt: string;
		updatedAt: string;
	}

	const { data: forms, pending, error, refresh } = await useFetch<Form[]>("/api/forms");
	const { user, clear } = useUserSession();
	const router = useRouter();

	const statusColors = {
		draft: "bg-yellow-100 text-yellow-800",
		published: "bg-green-100 text-green-800",
		archived: "bg-gray-100 text-gray-800",
	};

	const statusLabels = {
		draft: "Draft",
		published: "Published",
		archived: "Archived",
	};

	function formatDate(dateString: string) {
		return new Date(dateString).toLocaleDateString("he-IL", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	}

	async function handleLogout() {
		await $fetch("/api/auth/logout", { method: "POST" });
		await clear();
		router.push("/login");
	}

	useHead({
		title: "Forms - Autodox",
	});
</script>

<template>
	<div dir="rtl" class="min-h-screen bg-gray-100">
		<!-- Header -->
		<header class="bg-white shadow">
			<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-4">
						<NuxtLink to="/">
							<UiButton variant="secondary" size="sm">
								<Icon name="heroicons:arrow-left" class="h-5 w-5" />
							</UiButton>
						</NuxtLink>
						<h1 class="text-2xl font-bold text-gray-900">Forms</h1>
					</div>
					<div class="flex items-center gap-3">
						<div class="text-sm text-gray-600">
							{{ user?.name }}
						</div>
						<NuxtLink to="/forms/upload">
							<UiButton variant="secondary">
								<Icon name="heroicons:arrow-up-tray" class="h-5 w-5" />
								Upload JSON
							</UiButton>
						</NuxtLink>
						<NuxtLink to="/forms/new">
							<UiButton variant="primary">
								<Icon name="heroicons:plus" class="h-5 w-5" />
								New Form
							</UiButton>
						</NuxtLink>
						<UiButton variant="secondary" @click="handleLogout">
							<Icon name="heroicons:arrow-right-on-rectangle" class="h-5 w-5" />
							Logout
						</UiButton>
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
				<p class="mt-2 text-red-700">Failed to load forms</p>
				<UiButton variant="secondary" class="mt-4" @click="refresh"> Try Again </UiButton>
			</div>

			<!-- Empty state -->
			<div
				v-else-if="!forms || forms.length === 0"
				class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center"
			>
				<Icon name="heroicons:document-plus" class="mx-auto h-12 w-12 text-gray-400" />
				<h3 class="mt-4 text-lg font-medium text-gray-900">No forms yet</h3>
				<p class="mt-2 text-gray-500">Get started by creating your first form.</p>
				<NuxtLink to="/forms/new" class="mt-6 inline-block">
					<UiButton variant="primary">
						<Icon name="heroicons:plus" class="h-5 w-5" />
						Create Form
					</UiButton>
				</NuxtLink>
			</div>

			<!-- Forms grid -->
			<div v-else class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
				<div
					v-for="form in forms"
					:key="form.id"
					class="rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-md"
				>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<h3 class="font-medium text-gray-900">
								{{ form.title }}
							</h3>
							<p
								v-if="form.description"
								class="mt-1 text-sm text-gray-500 line-clamp-2"
							>
								{{ form.description }}
							</p>
						</div>
						<span
							class="shrink-0 rounded-full px-2 py-1 text-xs font-medium"
							:class="statusColors[form.status]"
						>
							{{ statusLabels[form.status] }}
						</span>
					</div>
					<div class="mt-4 text-sm text-gray-500">
						עודכן ב {{ formatDate(form.updatedAt) }}
					</div>
					<div class="mt-6 flex flex-col gap-2">
						<NuxtLink :to="`/edit/${form.id}`">
							<UiButton variant="primary" class="w-full">
								<Icon name="heroicons:pencil-square" class="h-4 w-4" />
								Edit
							</UiButton>
						</NuxtLink>
						<div class="flex gap-2">
							<NuxtLink :to="`/fill/${form.id}`" class="flex-1">
								<UiButton variant="secondary" class="w-full">
									<Icon name="heroicons:document-text" class="h-4 w-4" />
									Fill
								</UiButton>
							</NuxtLink>
							<NuxtLink :to="`/submissions/${form.id}`" class="flex-1">
								<UiButton variant="secondary" class="w-full">
									<Icon name="heroicons:inbox" class="h-4 w-4" />
									Submissions
								</UiButton>
							</NuxtLink>
						</div>
					</div>
				</div>
			</div>
		</main>
	</div>
</template>
