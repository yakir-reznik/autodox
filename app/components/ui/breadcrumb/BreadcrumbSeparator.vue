<script lang="ts" setup>
	import type { HTMLAttributes } from "vue";

	import { cn } from "@/lib/utils";

	const props = defineProps<{
		class?: HTMLAttributes["class"];
	}>();
</script>

<template>
	<li
		data-slot="breadcrumb-separator"
		role="presentation"
		aria-hidden="true"
		:class="cn('text-base translate-y-0.5', props.class)"
	>
		<slot>
			<Icon name="heroicons:chevron-left" />
		</slot>
	</li>
</template>
