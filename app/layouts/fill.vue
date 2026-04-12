<template>
	<div>
		<div class="p-4 lg:p-6">
			<FormFillOptionMenu />
		</div>
		<div class="fill-page-content">
			<slot />
		</div>
	</div>
</template>

<script setup lang="ts">
	import "~/assets/css/main.css";
</script>
