export type ToastTheme = 'notice' | 'success' | 'warning' | 'error' | 'loading'
export type ToastDOMElement = 'container' | 'icon' | 'title' | 'text' | 'progress'

export interface Toast {
	id: number
	title: string
	subtitle?: string
	theme: ToastTheme
	duration?: number
	dismissable?: boolean
	containerClasses?: string
	iconClasses?: string
	titleClasses?: string
	textClasses?: string
	progressClasses?: string
}

export interface ToastThemeConfig {
	containerClasses?: string
	iconClasses?: string
	titleClasses?: string
	textClasses?: string
	progressClasses?: string
	icon?: string
}

export type ToastThemes = Record<ToastTheme, ToastThemeConfig>
