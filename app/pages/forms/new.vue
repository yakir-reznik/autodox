<script setup lang="ts">
// Create a new form and redirect to the editor
const { data, error } = await useFetch("/api/forms", {
	method: "POST",
	body: {
		title: "Untitled Form",
		createdBy: 1, // TODO: Get from auth
	},
});

if (error.value) {
	throw createError({
		statusCode: 500,
		message: "Failed to create form",
	});
}

// Redirect to the form editor
await navigateTo(`/edit/${data.value?.id}`, { replace: true });
</script>

<template>
	<div class="flex min-h-screen items-center justify-center bg-gray-100">
		<div class="text-center">
			<Icon name="svg-spinners:ring-resize" class="mx-auto h-8 w-8 text-blue-500" />
			<p class="mt-4 text-gray-600">Creating form...</p>
		</div>
	</div>
</template>
