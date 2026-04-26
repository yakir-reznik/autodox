declare module "vue-router" {
	interface RouteMeta {
		removePadding?: boolean;
		breadcrumbs?: { label: string; to?: string }[];
		heading?: string;
	}
}

export {};
