// count-lines.js
import fs from "fs/promises";
import path from "path";

const ROOT = process.argv[2] || ".";

const EXCLUDED_DIRS = new Set(["node_modules", ".git", "dist", "vendor", ".nuxt"]);

const EXCLUDED_EXTENSIONS = new Set([
	".pdf",
	".yaml",
	".yml",
	".json",
	".jpg",
	".png",
	".gif",
	".svg",
]);

const MIN_LINES = 50;

async function walk(dir: string): Promise<string[]> {
	let results: string[] = [];

	const entries = await fs.readdir(dir, { withFileTypes: true });

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			if (EXCLUDED_DIRS.has(entry.name)) continue;
			results = results.concat(await walk(fullPath));
		} else {
			const ext = path.extname(entry.name).toLowerCase();
			if (EXCLUDED_EXTENSIONS.has(ext)) continue;

			results.push(fullPath);
		}
	}

	return results;
}

async function countLines(file: string): Promise<number> {
	try {
		const content = await fs.readFile(file, "utf8");
		return content.split("\n").length;
	} catch (e) {
		return 0; // skip unreadable/binary files
	}
}

async function main() {
	const files = await walk(ROOT);

	const results: { file: string; lines: number }[] = [];

	for (const file of files) {
		const lines = await countLines(file);
		if (lines >= MIN_LINES) {
			results.push({ file, lines });
		}
	}

	results.sort((a, b) => b.lines - a.lines);

	const RED = "\x1b[31m";
	const ORANGE = "\x1b[33m";
	const RESET = "\x1b[0m";
	const DIM = "\x1b[2m";
	const BOLD = "\x1b[1m";

	const colLines = 8;
	const colFile = Math.max(...results.map((r) => r.file.length), 4);

	const hr = `├${"─".repeat(colLines)}┼${"─".repeat(colFile + 2)}┤`;
	const top = `┌${"─".repeat(colLines)}┬${"─".repeat(colFile + 2)}┐`;
	const bottom = `└${"─".repeat(colLines)}┴${"─".repeat(colFile + 2)}┘`;

	console.log(top);
	console.log(`│${BOLD}${"Lines".padStart(colLines - 1)} ${"File".padEnd(colFile + 2)}${RESET}│`);
	console.log(hr);

	for (const r of results) {
		const color = r.lines > 200 ? RED : r.lines > 100 ? ORANGE : DIM;
		const lineStr = r.lines.toString().padStart(colLines - 1);
		const fileStr = r.file.padEnd(colFile);
		console.log(`│${color}${lineStr}${RESET} │ ${color}${fileStr}${RESET} │`);
	}

	console.log(bottom);
}

main();
