<script setup lang="ts">
	useHead({
		title: "Shared Forms - Autodox",
	});

	definePageMeta({
		layout: "management-panel",
		heading: "טפסים ששותפו איתי",
		breadcrumbs: [{ label: "דף הבית", to: "/" }, { label: "טפסים ששותפו איתי" }],
	});
</script>

<template>
	<FormListManageFormsView shared-with-me-only />
</template>
