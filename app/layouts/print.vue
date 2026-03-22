<template>
	<div>
		<slot />
	</div>
</template>

<script setup lang="ts">
	import "~/assets/css/main.css";

	// Indicate that we are in print view
	isPrintView.value = true;
</script>

<style lang="sass" scoped></style>
