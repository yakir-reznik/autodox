// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	modules: ["@nuxt/fonts", "@nuxt/icon", "@nuxtjs/tailwindcss", "nuxt-auth-utils", "@pinia/nuxt"],
	css: ["~/assets/css/main.css"],
	app: {
		head: {
			title: "Autodox",
			htmlAttrs: { lang: "he", dir: "rtl" },
			meta: [
				{ name: "description", content: "Some sort of app description for SEO" },
				{ name: "apple-mobile-web-app-title", content: "Autodox" },
			],
			link: [
				{ rel: "icon", type: "image/png", href: "/favicon/favicon-96x96.png", sizes: "96x96" },
				{ rel: "icon", type: "image/svg+xml", href: "/favicon/favicon.svg" },
				{ rel: "shortcut icon", href: "/favicon/favicon.ico" },
				{ rel: "apple-touch-icon", sizes: "180x180", href: "/favicon/apple-touch-icon.png" },
				{ rel: "manifest", href: "/favicon/site.webmanifest" },
			],
		},
	},
	runtimeConfig: {
		databaseUrl: process.env.DATABASE_URL,
		session: {
			cookie: {
				sameSite: "lax",
			},
		},
	},
	ssr: false,
});
