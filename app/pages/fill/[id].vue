<script setup lang="ts">
	import Fill from "~/components/form-fill/FormFill.vue";

	const route = useRoute();
	const formId = computed(() => Number(route.params.id));
	const sessionId = computed(() => {
		const param = route.query.session_id;
		return param ? String(param) : null;
	});

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
		<Debug>{{ sessionId }}</Debug>
		<Fill :form-id="formId" :session-id="sessionId" />
	</div>
</template>
