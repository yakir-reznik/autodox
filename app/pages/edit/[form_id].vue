<script setup lang="ts">
const route = useRoute();
const formId = computed(() => Number(route.params.form_id));

// Validate form ID
if (isNaN(formId.value)) {
	throw createError({
		statusCode: 400,
		message: "Invalid form ID",
	});
}

// Prevent leaving with unsaved changes
onBeforeRouteLeave((to, from, next) => {
	// The FormBuilder component handles the dirty state internally
	// For now, we'll allow navigation
	next();
});

// Page title
useHead({
	title: "Form Builder - Autodox",
});
</script>

<template>
	<div dir="rtl">
		<FormBuilder :form-id="formId" />
	</div>
</template>
