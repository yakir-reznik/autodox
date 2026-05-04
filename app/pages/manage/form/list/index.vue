<script setup lang="ts">
	useHead({
		title: "Forms List - Autodox",
	});

	definePageMeta({
		layout: "management-panel",
		heading: "ניהול טפסים - תצוגת רשימה",
		breadcrumbs: [
			{ label: "דף הבית", to: "/" },
			{ label: "ניהול טפסים", to: "/manage" },
			{ label: "תצוגת רשימה" },
		],
	});
</script>

<template>
	<FormListManageFormsListView />
</template>
