<script setup lang="ts">
interface Props {
	variant?: "primary" | "secondary" | "danger" | "ghost";
	size?: "sm" | "md" | "lg";
	disabled?: boolean;
	loading?: boolean;
	type?: "button" | "submit" | "reset";
}

const props = withDefaults(defineProps<Props>(), {
	variant: "primary",
	size: "md",
	disabled: false,
	loading: false,
	type: "button",
});

const variantClasses = {
	primary:
		"bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 disabled:bg-blue-300",
	secondary:
		"bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500 disabled:bg-gray-50 disabled:text-gray-400",
	danger:
		"bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-300",
	ghost:
		"bg-transparent text-gray-600 hover:bg-gray-100 focus:ring-gray-500 disabled:text-gray-300",
};

const sizeClasses = {
	sm: "px-3 py-1.5 text-sm",
	md: "px-4 py-2 text-sm",
	lg: "px-6 py-3 text-base",
};
</script>

<template>
	<button
		:type="type"
		:disabled="disabled || loading"
		class="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed"
		:class="[variantClasses[variant], sizeClasses[size]]"
	>
		<Icon
			v-if="loading"
			name="svg-spinners:ring-resize"
			class="h-4 w-4"
		/>
		<slot />
	</button>
</template>
