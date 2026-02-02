export function useEdgeScroll(container: Ref<HTMLElement | null>) {
	const EDGE_THRESHOLD = 80
	const MAX_SPEED = 20

	let animationFrameId: number | null = null
	let scrollSpeed = 0

	function handleDragOver(e: DragEvent) {
		const el = container.value
		if (!el) return

		const y = e.clientY
		const viewportHeight = window.innerHeight

		if (y < EDGE_THRESHOLD) {
			scrollSpeed = -MAX_SPEED * (1 - y / EDGE_THRESHOLD)
		} else if (y > viewportHeight - EDGE_THRESHOLD) {
			scrollSpeed = MAX_SPEED * (1 - (viewportHeight - y) / EDGE_THRESHOLD)
		} else {
			scrollSpeed = 0
		}

		if (scrollSpeed !== 0 && animationFrameId === null) {
			startScrollLoop()
		}
	}

	function startScrollLoop() {
		const el = container.value
		if (!el || scrollSpeed === 0) {
			animationFrameId = null
			return
		}

		el.scrollTop += scrollSpeed
		animationFrameId = requestAnimationFrame(startScrollLoop)
	}

	function stopScrolling() {
		scrollSpeed = 0
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId)
			animationFrameId = null
		}
	}

	onMounted(() => {
		document.addEventListener("dragover", handleDragOver)
		document.addEventListener("dragend", stopScrolling)
		document.addEventListener("drop", stopScrolling)
	})

	onUnmounted(() => {
		stopScrolling()
		document.removeEventListener("dragover", handleDragOver)
		document.removeEventListener("dragend", stopScrolling)
		document.removeEventListener("drop", stopScrolling)
	})
}
