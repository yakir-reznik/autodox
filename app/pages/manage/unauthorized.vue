<template>
	<div class="flex h-full flex-col items-center justify-center px-4 text-center">
		<div class="rounded-full bg-red-100 p-6 aspect-square">
			<Icon name="heroicons:lock-closed" class="text-2xl text-red-500 translate-y-0.5" />
		</div>

		<h1 class="mt-6 text-3xl font-bold text-gray-900">אין גישה</h1>
		<p class="mt-3 max-w-sm text-gray-500">
			אין לך הרשאות לביצוע הפעולה. אם אתה חושב שמדובר בשגיאה, פנה למנהל המערכת.
		</p>

		<button
			type="button"
			class="mt-8 inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50"
			@click="goBack"
		>
			<Icon name="heroicons:arrow-right" class="h-4 w-4" />
			חזרה
		</button>
	</div>
</template>

<script setup lang="ts">
	definePageMeta({
		layout: "management-panel",
		breadcrumbs: [{ label: "שגיאה" }],
	});

	function goBack() {
		window.history.back();
	}
</script>
