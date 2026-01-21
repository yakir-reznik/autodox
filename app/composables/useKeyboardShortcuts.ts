export function useKeyboardShortcuts(onUndo: () => void, onRedo: () => void) {
	function handleKeyDown(event: KeyboardEvent) {
		const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
		const modifierKey = isMac ? event.metaKey : event.ctrlKey;
		if (!modifierKey) return;

		// Don't intercept when focused on form inputs
		const target = event.target as HTMLElement;
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
			return;
		}

		if (event.key === 'z' && !event.shiftKey) {
			event.preventDefault();
			onUndo();
		} else if ((event.key === 'z' && event.shiftKey) || event.key === 'y') {
			event.preventDefault();
			onRedo();
		}
	}

	onMounted(() => window.addEventListener('keydown', handleKeyDown));
	onUnmounted(() => window.removeEventListener('keydown', handleKeyDown));
}
