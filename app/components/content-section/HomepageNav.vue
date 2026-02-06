<script setup lang="ts">
defineProps<{
	scrolled: boolean;
	scrollTo: (id: string) => void;
}>();
</script>

<template>
	<!-- ==================== NAVIGATION ==================== -->
	<nav
		class="fixed top-0 right-0 left-0 z-50 transition-all duration-300"
		:class="
			scrolled
				? 'bg-slate-950/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10'
				: 'bg-transparent'
		"
	>
		<div class="mx-auto max-w-7xl px-6 lg:px-8">
			<div class="flex h-16 items-center justify-between">
				<div class="flex items-center gap-2.5">
					<div
						class="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-blue-500 to-blue-700"
					>
						<Icon name="ph:stack-fill" class="h-5 w-5 text-white" />
					</div>
					<span class="text-xl font-bold text-white">Autodox</span>
				</div>

				<div class="hidden items-center gap-8 md:flex">
					<button
						@click="scrollTo('features')"
						class="cursor-pointer text-sm text-white/60 transition-colors hover:text-white"
					>
						יתרונות
					</button>
					<button
						@click="scrollTo('how-it-works')"
						class="cursor-pointer text-sm text-white/60 transition-colors hover:text-white"
					>
						איך זה עובד?
					</button>
					<NuxtLink
						to="/login"
						class="text-sm text-white/60 transition-colors hover:text-white"
					>
						התחברות
					</NuxtLink>
					<NuxtLink to="/signup">
						<BaseButton variant="primary" size="sm">התחל בחינם</BaseButton>
					</NuxtLink>
				</div>

				<div class="flex items-center gap-3 md:hidden">
					<NuxtLink
						to="/login"
						class="text-sm text-white/60 transition-colors hover:text-white"
					>
						התחברות
					</NuxtLink>
					<NuxtLink to="/signup">
						<BaseButton variant="primary" size="sm">התחל בחינם</BaseButton>
					</NuxtLink>
				</div>
			</div>
		</div>
	</nav>
</template>
