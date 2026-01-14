<template>
	<div class="rounded-lg border-2 border-dashed border-gray-300 bg-white p-12 text-center">
		<Icon name="heroicons:document-plus" class="mx-auto h-12 w-12 text-gray-400" />
		<h3 class="mt-4 text-lg font-medium text-gray-900">אין טפסים</h3>
		<p class="mt-2 text-gray-500">התחל ליצור את הטופס הראשון שלך.</p>
		<NuxtLink to="/forms/new" class="mt-6 inline-block">
			<UiButton variant="primary">
				<Icon name="heroicons:plus" class="h-5 w-5" />
				יצירת טופס
			</UiButton>
		</NuxtLink>
	</div>
</template>

<script setup lang="ts"></script>

<style lang="sass" scoped></style>
