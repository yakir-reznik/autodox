<template>
	<!-- Header -->
	<header class="bg-white shadow">
		<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-4">
					<NuxtLink to="/forms">
						<BaseButton variant="secondary" size="sm">
							<Icon name="heroicons:arrow-left" class="h-5 w-5" />
						</BaseButton>
					</NuxtLink>
					<div>
						<h1 class="text-2xl font-bold text-gray-900">Submission Details</h1>
						<p class="text-sm text-gray-600">Token: {{ token }}</p>
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
</template>

<script setup lang="ts">
	const { user, loggedIn } = useUserSession();

	const props = defineProps<{
		token: string;
	}>();
</script>

<style lang="sass" scoped></style>
