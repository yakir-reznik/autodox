<script setup lang="ts">
	useHead({
		title: "Forms - Autodox",
	});

	definePageMeta({
		layout: "management-panel",
		heading: "ניהול טפסים",
		breadcrumbs: [{ label: "דף הבית", to: "/" }, { label: "ניהול טפסים" }],
	});
</script>

<template>
	<FormListManageFormsView />
</template>
