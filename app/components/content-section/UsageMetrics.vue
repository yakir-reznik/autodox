<script setup lang="ts">
interface Counters {
	elements: number;
	reports: number;
	permissions: number;
	themes: number;
}

defineProps<{
	counters: Counters;
}>();
</script>

<template>
	<!-- ==================== STATS ==================== -->
	<section
		id="stats"
		data-stats
		class="reveal relative bg-linear-to-l from-blue-600 via-blue-700 to-indigo-700 py-12"
	>
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="grid grid-cols-2 gap-8 lg:grid-cols-4">
				<div class="text-center">
					<div class="text-3xl font-extrabold text-white sm:text-4xl">
						{{ counters.elements.toLocaleString() }}
					</div>
					<div class="mt-1 text-sm text-blue-200">רכיבי טופס</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-extrabold text-white sm:text-4xl">
						{{ counters.reports.toLocaleString() }}
					</div>
					<div class="mt-1 text-sm text-blue-200">דוחות ניהול</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-extrabold text-white sm:text-4xl">
						{{ counters.permissions.toLocaleString() }}
					</div>
					<div class="mt-1 text-sm text-blue-200">הרשאות שיתוף</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-extrabold text-white sm:text-4xl">
						{{ counters.themes.toLocaleString() }}
					</div>
					<div class="mt-1 text-sm text-blue-200">ערכות נושא</div>
				</div>
			</div>
		</div>
	</section>
</template>
