<template>
	<div>
		<slot />
	</div>
</template>

<script setup lang="ts">
	// Indicate that we are in print view
	isPrintView.value = true;
</script>

<style lang="sass" scoped></style>
