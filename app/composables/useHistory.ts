import type { HistoryEntry } from '~/types/form-builder';

const MAX_HISTORY_SIZE = 50;

export function useHistory() {
	const past = ref<HistoryEntry[]>([]);
	const future = ref<HistoryEntry[]>([]);

	const canUndo = computed(() => past.value.length > 0);
	const canRedo = computed(() => future.value.length > 0);

	function record(snapshot: HistoryEntry) {
		past.value.push(snapshot);

		if (past.value.length > MAX_HISTORY_SIZE) {
			past.value = past.value.slice(-MAX_HISTORY_SIZE);
		}

		// Clear future on new action
		future.value = [];
	}

	function undo(currentSnapshot: HistoryEntry): HistoryEntry | null {
		if (past.value.length === 0) return null;

		future.value.push(currentSnapshot);
		return past.value.pop()!;
	}

	function redo(currentSnapshot: HistoryEntry): HistoryEntry | null {
		if (future.value.length === 0) return null;

		past.value.push(currentSnapshot);
		return future.value.pop()!;
	}

	function clear() {
		past.value = [];
		future.value = [];
	}

	return {
		canUndo,
		canRedo,
		record,
		undo,
		redo,
		clear,
	};
}
