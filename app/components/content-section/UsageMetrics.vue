<script setup lang="ts">
interface Counters {
	users: number;
	forms: number;
	submissions: number;
	uptime: number;
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
						{{ counters.users.toLocaleString() }}+
					</div>
					<div class="mt-1 text-sm text-blue-200">משתמשים פעילים</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-extrabold text-white sm:text-4xl">
						{{ counters.forms.toLocaleString() }}+
					</div>
					<div class="mt-1 text-sm text-blue-200">טפסים נוצרו</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-extrabold text-white sm:text-4xl">
						{{ counters.submissions.toLocaleString() }}+
					</div>
					<div class="mt-1 text-sm text-blue-200">תשובות נאספו</div>
				</div>
				<div class="text-center">
					<div class="text-3xl font-extrabold text-white sm:text-4xl">
						{{ counters.uptime }}%
					</div>
					<div class="mt-1 text-sm text-blue-200">זמינות</div>
				</div>
			</div>
		</div>
	</section>
</template>
