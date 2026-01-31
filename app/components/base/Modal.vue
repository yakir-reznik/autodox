<script setup lang="ts">
interface Props {
	modelValue: boolean;
	title?: string;
	size?: "sm" | "md" | "lg" | "xl";
}

const props = withDefaults(defineProps<Props>(), {
	size: "md",
});

const emit = defineEmits<{
	"update:modelValue": [value: boolean];
}>();

const close = () => {
	emit("update:modelValue", false);
};

const sizeClasses = {
	sm: "max-w-sm",
	md: "max-w-md",
	lg: "max-w-lg",
	xl: "max-w-xl",
};
</script>

<template>
	<Teleport to="body">
		<Transition
			enter-active-class="transition-opacity duration-200"
			enter-from-class="opacity-0"
			enter-to-class="opacity-100"
			leave-active-class="transition-opacity duration-200"
			leave-from-class="opacity-100"
			leave-to-class="opacity-0"
		>
			<div
				v-if="modelValue"
				class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
				@click.self="close"
			>
				<Transition
					enter-active-class="transition-all duration-200"
					enter-from-class="scale-95 opacity-0"
					enter-to-class="scale-100 opacity-100"
					leave-active-class="transition-all duration-200"
					leave-from-class="scale-100 opacity-100"
					leave-to-class="scale-95 opacity-0"
				>
					<div
						v-if="modelValue"
						class="w-full rounded-lg bg-white shadow-xl"
						:class="sizeClasses[size]"
					>
						<!-- Header -->
						<div
							v-if="title || $slots.header"
							class="flex items-center justify-between border-b border-gray-200 px-6 py-4"
						>
							<h2 class="text-lg font-semibold text-gray-900">
								<slot name="header">
									{{ title }}
								</slot>
							</h2>
							<button
								type="button"
								class="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
								@click="close"
							>
								<Icon name="mdi:close" class="h-5 w-5" />
							</button>
						</div>

						<!-- Content -->
						<div class="px-6 py-4">
							<slot />
						</div>

						<!-- Footer -->
						<div
							v-if="$slots.footer"
							class="flex items-center justify-end gap-2 border-t border-gray-200 px-6 py-4"
						>
							<slot name="footer" />
						</div>
					</div>
				</Transition>
			</div>
		</Transition>
	</Teleport>
</template>
