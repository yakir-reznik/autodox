<template>
	<UiSidebarProvider>
		<ManagementPanelSidebar />
		<UiSidebarInset class="flex flex-col h-screen">
			<header class="flex items-center gap-2 border-b px-4 py-3 h-14 sticky top-0 z-10 bg-background shrink-0">
				<slot name="header" />
				<ManagementPanelBreadcrumb />
			</header>
			<main class="flex-1 overflow-auto" :class="{ 'py-8 px-16': !removePadding }">
				<h1 v-if="heading" class="text-3xl font-bold mb-6">{{ heading }}</h1>
				<slot />
			</main>
		</UiSidebarInset>
	</UiSidebarProvider>
</template>

<script setup lang="ts">
	const route = useRoute();
	const heading = computed(() => route.meta.heading);
	const removePadding = computed(() => !!route.meta.removePadding);
</script>
