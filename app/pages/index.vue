<script setup lang="ts">
	useHead({
		title: "Autodox - Form Builder",
	});
</script>

<template>
	<div class="p-24">
		<UiButton>primary large</UiButton>
		<button class="bg-primary">Actual HTML button</button>
	</div>

	<div dir="rtl" class="flex min-h-screen flex-col items-center justify-center bg-gray-100">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900">Autodox</h1>
			<p class="mt-2 text-lg text-gray-600">Build and manage your forms</p>
			<div class="mt-8 flex gap-4 justify-center">
				<NuxtLink to="/forms">
					<BaseButton variant="primary" size="lg">
						<Icon name="heroicons:document-text" class="h-5 w-5" />
						View Forms
					</BaseButton>
				</NuxtLink>
				<NuxtLink to="/forms/new">
					<BaseButton variant="secondary" size="lg">
						<Icon name="heroicons:plus" class="h-5 w-5" />
						Create New Form
					</BaseButton>
				</NuxtLink>
			</div>
		</div>
	</div>
</template>
