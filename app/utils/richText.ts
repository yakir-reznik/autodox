import type { BuilderElement } from "~/types/form-builder";
import { interpolateFieldValues } from "~/utils/interpolate";

const allowedTags = new Set([
	"a",
	"br",
	"div",
	"em",
	"i",
	"li",
	"ol",
	"p",
	"strong",
	"b",
	"u",
	"ul",
]);

const voidTags = new Set(["br"]);

function getSafeHref(attrs: string): string | null {
	const match = attrs.match(/\shref=(["'])(.*?)\1/i);
	if (!match?.[2]) return null;

	const href = match[2].trim();
	if (/^(https?:|mailto:|tel:)/i.test(href)) return href;
	return null;
}

function escapeAttribute(value: string): string {
	return value
		.replace(/&/g, "&amp;")
		.replace(/"/g, "&quot;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;");
}

export function sanitizeRichTextHtml(html: string): string {
	return html
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
		.replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, "")
		.replace(/<(\/?)([a-zA-Z0-9]+)([^>]*)>/g, (match, closing, rawTag, attrs) => {
			const tag = rawTag.toLowerCase();
			if (!allowedTags.has(tag)) return "";

			if (closing) {
				return voidTags.has(tag) ? "" : `</${tag === "b" ? "strong" : tag === "i" ? "em" : tag}>`;
			}

			if (tag === "a") {
				const href = getSafeHref(attrs);
				if (!href) return "<a>";
				return `<a href="${escapeAttribute(href)}" target="_blank" rel="noopener noreferrer" class="text-primary underline">`;
			}

			const normalizedTag = tag === "b" ? "strong" : tag === "i" ? "em" : tag;
			return voidTags.has(normalizedTag) ? `<${normalizedTag}>` : `<${normalizedTag}>`;
		})
		.trim();
}

export function interpolateRichTextHtml(
	html: string,
	elements: BuilderElement[],
	formData: Record<string, any>,
	prefillData: Record<string, any> = {},
): string {
	return sanitizeRichTextHtml(interpolateFieldValues(html, elements, formData, prefillData));
}
