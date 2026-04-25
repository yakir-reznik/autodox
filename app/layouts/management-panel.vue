<template>
	<UiSidebarProvider>
		<UiSidebarInset class="flex flex-col min-h-svh">
			<header class="flex items-center gap-2 border-b px-4 py-3 h-14">
				<slot name="header" />
			</header>
			<main class="flex-1 overflow-auto p-6">
				<slot />
			</main>
		</UiSidebarInset>
		<ManagementPanelSidebar />
	</UiSidebarProvider>
</template>

<script setup lang="ts"></script>
