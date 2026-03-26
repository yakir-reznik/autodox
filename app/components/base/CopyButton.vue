<script setup lang="ts">
	import { twMerge } from "tailwind-merge";

	type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";
	type ButtonSize = "sm" | "md" | "lg";

	const props = withDefaults(
		defineProps<{
			text: string;
			variant?: ButtonVariant;
			size?: ButtonSize;
			class?: string;
		}>(),
		{
			variant: "secondary",
			size: "sm",
		},
	);

	const copied = ref(false);

	async function copy() {
		await navigator.clipboard.writeText(props.text);
		copied.value = true;
		setTimeout(() => (copied.value = false), 2000);
	}
</script>

<template>
	<BaseButton
		:variant="copied ? 'primary' : variant"
		:size="size"
		:class="
			twMerge(
				copied && 'bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white',
				props.class,
			)
		"
		@click="copy"
	>
		<span class="grid">
			<span
				:class="[
					'col-start-1 row-start-1 inline-flex items-center justify-center gap-2 transition-opacity',
					copied ? 'opacity-0' : 'opacity-100',
				]"
			>
				<slot>
					העתק
					<Icon name="heroicons:clipboard" class="h-4 w-4" />
				</slot>
			</span>
			<span
				:class="[
					'col-start-1 row-start-1 inline-flex items-center justify-center gap-2 transition-opacity',
					copied ? 'opacity-100' : 'opacity-0',
				]"
			>
				<slot name="copied">
					הועתק
					<Icon name="heroicons:check" class="h-4 w-4" />
				</slot>
			</span>
		</span>
	</BaseButton>
</template>
