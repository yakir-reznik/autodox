const urlPattern = /((https?:\/\/)[^\s<]+)/g;

export function linkifyText(text: string): string {
	const escaped = text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");

	return escaped.replace(urlPattern, '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary underline">$1</a>');
}
