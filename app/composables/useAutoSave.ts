import type { SaveStatus } from "~/types/form-builder";

export interface AutoSaveOptions {
	debounceMs?: number;
	onSave: () => Promise<void>;
	onError?: (error: Error) => void;
}

export function useAutoSave(options: AutoSaveOptions) {
	const { debounceMs = 10000, onSave, onError } = options;

	const status = ref<SaveStatus>("idle");
	const lastSavedAt = ref<Date | null>(null);
	const pendingTimeout = ref<ReturnType<typeof setTimeout> | null>(null);

	function triggerSave() {
		// Clear existing timeout
		if (pendingTimeout.value) {
			clearTimeout(pendingTimeout.value);
		}

		status.value = "pending";

		pendingTimeout.value = setTimeout(async () => {
			status.value = "saving";
			try {
				await onSave();
				status.value = "saved";
				lastSavedAt.value = new Date();

				// Reset to idle after showing "saved" for a moment
				setTimeout(() => {
					if (status.value === "saved") {
						status.value = "idle";
					}
				}, 2000);
			} catch (error) {
				status.value = "error";
				onError?.(error as Error);
			}
		}, debounceMs);
	}

	function cancelPending() {
		if (pendingTimeout.value) {
			clearTimeout(pendingTimeout.value);
			pendingTimeout.value = null;
			status.value = "idle";
		}
	}

	async function forceSave() {
		cancelPending();
		status.value = "saving";
		try {
			await onSave();
			status.value = "saved";
			lastSavedAt.value = new Date();

			setTimeout(() => {
				if (status.value === "saved") {
					status.value = "idle";
				}
			}, 2000);
		} catch (error) {
			status.value = "error";
			onError?.(error as Error);
			throw error;
		}
	}

	onUnmounted(() => {
		cancelPending();
	});

	return {
		status,
		lastSavedAt,
		triggerSave,
		cancelPending,
		forceSave,
	};
}
