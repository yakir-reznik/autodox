// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: "2025-07-15",
	devtools: { enabled: true },
	modules: ["@nuxt/fonts", "@nuxt/icon", "@nuxtjs/tailwindcss"],
	css: ["~/assets/css/main.css"],
	app: {
		head: {
			title: "Autodox",
			htmlAttrs: { lang: "he", dir: "rtl" },
			meta: [{ name: "description", content: "Some sort of app description for SEO" }],
		},
	},
	ssr: false,
});
