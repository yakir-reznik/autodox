<script setup lang="ts">
	import Fill from "~/components/form-fill/FormFill.vue";
	import type { FormWithElements } from "~/types/form-builder";
	import { getThemeDefinition } from "~/composables/useThemes";

	const route = useRoute();
	const formId = computed(() => Number(route.params.id));
	const sessionId = computed(() => {
		const param = route.query.session_id;
		return param ? String(param) : null;
	});
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

	// Fetch form to get theme (include token in query if present)
	const { data: form } = await useFetch<FormWithElements>(`/api/forms/${formId.value}`, {
		query: {
			...(token.value && { token: token.value }),
		},
	});

	// Compute theme CSS file path
	const themeCssPath = computed(() => {
		const themeId = form.value?.theme || "default";
		return getThemeDefinition(themeId).cssFile;
	});

	// Dynamically inject theme CSS - use function for reactivity
	useHead(() => ({
		title: "Fill Form - Autodox",
		link: [
			{
				rel: "stylesheet",
				href: themeCssPath.value,
			},
		],
	}));
</script>

<template>
	<div dir="rtl">
		<Fill :form-id="formId" :session-id="sessionId" :token="token" />
	</div>
</template>
