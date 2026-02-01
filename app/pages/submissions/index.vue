<script setup lang="ts">
	const { user } = useUserSession();

	if (user.value?.id) {
		navigateTo(`/submissions/user/${user.value.id}`, { replace: true });
	}
</script>

<template>
	<div class="flex min-h-screen items-center justify-center">
		<Icon name="svg-spinners:ring-resize" class="h-8 w-8 text-blue-500" />
	</div>
</template>
