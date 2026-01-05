import type { Toast } from '~/types/Toast'

export const useToasts = defineStore('toasts', () => {
	const toasts = ref<Toast[]>([])

	const add = (toast: Partial<Toast>) => {
		const parsedToast: Toast = applyDefaults(toast)
		toasts.value.push(parsedToast)

		if (parsedToast.duration) {
			setTimeout(() => {
				remove(parsedToast.id as number)
			}, parsedToast.duration)
		}

		// Return remove callable handler function
		return () => {
			remove(parsedToast.id as number)
		}
	}

	const applyDefaults = (toast: Partial<Toast>): Toast => {
		const defaults = {
			id: new Date().valueOf(), // unique id based on timestamp
			title: '',
			dismissable: true,
			duration: 6000,
			theme: 'notice' as const,
		}
		const parsedToast: Toast = { ...defaults, ...toast }
		// apply defaults for 'loading' theme...
		if (parsedToast.theme === 'loading') {
			parsedToast.subtitle = parsedToast.subtitle || 'Loading...'
			parsedToast.duration = toast.duration || undefined
		}
		return parsedToast
	}

	const remove = (toastId: number) => {
		const foundIndex = toasts.value.findIndex((toast) => toast.id === toastId)
		if (foundIndex !== -1) {
			toasts.value.splice(foundIndex, 1)
		}
	}

	return { toasts, add, remove }
})
