<script setup lang="ts">
	import Fill from "~/components/form-fill/FormFill.vue";

	const route = useRoute();
	const formId = computed(() => Number(route.params.id));

	// Validate form ID
	if (isNaN(formId.value)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	// Page title will be set by FormFill component after loading
	useHead({
		title: "Fill Form - Autodox",
	});
</script>

<template>
	<div dir="rtl">
		<Fill :form-id="formId" />
	</div>
</template>
