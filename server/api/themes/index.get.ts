import { getThemes } from "~~/server/utils/themes";
export default defineEventHandler(async () => (await getThemes()).map((theme) => ({
	id: theme.id, title: theme.title, description: theme.description,
	colors: [theme.colors.background, theme.colors.card, theme.colors.primary, theme.colors.secondary, theme.colors.accent],
})));
