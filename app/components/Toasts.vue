<template>
	<div class="fixed bottom-0 right-0 z-[60] w-full p-8 md:bottom-8 md:p-2 pointer-events-none">
		<div class="flex flex-col items-start justify-start gap-4">
			<TransitionGroup name="toast">
				<div
					v-for="toast in toasts"
					:key="toast.id"
					class="toast-item pointer-events-auto"
					:class="mergedClasses(toast, 'container')"
				>
					<div class="flex items-start gap-4 w-full">
						<div class="shrink-0 mt-0.5">
							<Icon
								:name="getIconName(toast.theme)"
								:class="mergedClasses(toast, 'icon')"
							/>
						</div>
						<div class="flex-1 min-w-0">
							<h3 :class="mergedClasses(toast, 'title')">{{ toast.title }}</h3>
							<p v-if="toast.subtitle" :class="mergedClasses(toast, 'text')">
								{{ toast.subtitle }}
							</p>
						</div>
						<button
							v-if="toast.dismissable"
							@click="removeToast(toast.id)"
							class="shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none transition-colors"
						>
							<Icon name="heroicons:x-mark" class="h-5 w-5" />
						</button>
					</div>
					<div
						v-if="toast.duration"
						:class="mergedClasses(toast, 'progress')"
						:style="`animation-duration: ${animationDuration(toast)}ms`"
					></div>
				</div>
			</TransitionGroup>
		</div>
	</div>
</template>

<script setup lang="ts">
	import type { Toast, ToastDOMElement, ToastThemes, ToastTheme } from "~/types/Toast";

	const toastsStore = useToasts();
	const { toasts } = storeToRefs(toastsStore);

	const animationDuration = (toast: Toast) => {
		return (toast.duration as number) + 500;
	};

	const themes: ToastThemes = {
		notice: {
			containerClasses:
				"bg-blue-50 text-blue-900 border border-blue-200 rounded-lg shadow-lg p-4 max-w-md",
			icon: "notice",
			progressClasses: "bg-blue-400/40",
		},
		success: {
			containerClasses:
				"bg-green-50 text-green-900 border border-green-200 rounded-lg shadow-lg p-4 max-w-md",
			icon: "success",
			progressClasses: "bg-green-400/40",
		},
		warning: {
			containerClasses:
				"bg-amber-50 text-amber-900 border border-amber-200 rounded-lg shadow-lg p-4 max-w-md",
			icon: "warning",
			progressClasses: "bg-amber-400/40",
		},
		error: {
			containerClasses:
				"bg-red-50 text-red-900 border border-red-200 rounded-lg shadow-lg p-4 max-w-md",
			icon: "error",
			progressClasses: "bg-red-400/40",
		},
		loading: {
			containerClasses:
				"bg-gray-50 text-gray-900 border border-gray-200 rounded-lg shadow-lg p-4 max-w-md",
			progressClasses: "bg-gray-400/40",
		},
	};

	const iconMap: Record<ToastTheme, string> = {
		notice: "heroicons:information-circle",
		success: "heroicons:check-circle",
		warning: "heroicons:exclamation-triangle",
		error: "heroicons:x-circle",
		loading: "svg-spinners:ring-resize",
	};

	const getIconName = (theme: ToastTheme): string => {
		return iconMap[theme] || iconMap.notice;
	};

	const mergedClasses = (toast: Toast, el: ToastDOMElement): string => {
		const baseClasses: Record<ToastDOMElement, string> = {
			container:
				"relative inline-flex items-start gap-3 rounded-lg border shadow-lg p-4 max-w-md",
			title: "font-semibold text-sm",
			text: "text-sm opacity-75 mt-1",
			icon: "h-5 w-5 shrink-0",
			progress:
				"progress-bar absolute bottom-0 right-0 h-1 w-full rounded-bl-lg origin-right",
		};

		const base = baseClasses[el] || "";
		const themeConfig = themes[toast.theme];
		const themeClass =
			el === "container"
				? themeConfig?.containerClasses
				: el === "icon"
					? themeConfig?.iconClasses
					: el === "title"
						? themeConfig?.titleClasses
						: el === "text"
							? themeConfig?.textClasses
							: el === "progress"
								? themeConfig?.progressClasses
								: "";

		const passedClass =
			el === "container"
				? toast.containerClasses
				: el === "icon"
					? toast.iconClasses
					: el === "title"
						? toast.titleClasses
						: el === "text"
							? toast.textClasses
							: el === "progress"
								? toast.progressClasses
								: "";

		return [base, themeClass, passedClass].filter(Boolean).join(" ");
	};

	const removeToast = (id: number) => {
		toastsStore.remove(id);
	};
</script>

<style scoped>
	.toast-enter-from,
	.toast-leave-to {
		opacity: 0;
		transform: translateX(2rem);
	}

	.toast-item {
		transition:
			opacity 0.3s ease,
			transform 0.3s ease-out;
	}

	@keyframes progress {
		0% {
			transform: scaleX(1);
		}
		100% {
			transform: scaleX(0);
		}
	}

	.progress-bar {
		animation: progress 0s forwards;
	}
</style>
