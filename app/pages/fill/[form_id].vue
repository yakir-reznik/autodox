<script setup lang="ts">
	import Fill from "~/components/form-fill/FormFill.vue";

	const route = useRoute();
	const formId = computed(() => Number(route.params.form_id));
	const token = computed(() => {
		const param = route.query.token;
		return param ? String(param) : null;
	});

	// Validate form ID
	if (isNaN(formId.value)) {
		throw createError({
			statusCode: 400,
			message: "Invalid form ID",
		});
	}

	// Theme CSS loads immediately via server redirect — no need to wait for form data
	useHead(() => ({
		title: "Fill Form - Autodox",
		link: [
			{
				rel: "stylesheet",
				href: `/api/forms/${formId.value}/theme.css`,
			},
		],
	}));

	definePageMeta({
		layout: "fill",
	});
</script>

<template>
	<div dir="rtl">
		<Fill :form-id="formId" :token="token" />
	</div>
</template>
