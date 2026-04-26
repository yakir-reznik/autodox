declare module 'vue-router' {
	interface RouteMeta {
		breadcrumbs?: { label: string; to?: string }[]
		heading?: string
	}
}

export {}
