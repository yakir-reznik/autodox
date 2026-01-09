import pdfmake from "pdfmake";
import path from "path";

// Define fonts - using Noto Sans Hebrew which supports both Hebrew and English
const fonts = {
	NotoSansHebrew: {
		normal: path.join(process.cwd(), "fonts", "Noto_Sans_Hebrew", "NotoSansHebrew-Regular.ttf"),
		bold: path.join(process.cwd(), "fonts", "Noto_Sans_Hebrew", "NotoSansHebrew-Bold.ttf"),
	},
};

pdfmake.addFonts(fonts);

// Document definition with Hebrew and English text
const docDefinition = {
	supportRTL: true,
	content: [
		{ text: "PDF Test Document", style: "header" },
		{ text: "מסמך בדיקה", style: "header" },
		{ text: " " },
		{ text: "This is English text." },
		{ text: "זה טקסט בעברית." },
		{ text: " " },
		{ text: "Mixed content: Hello שלום World עולם" },
	],
	defaultStyle: {
		alignment: "right",
		font: "NotoSansHebrew",
		fontSize: 12,
	},
	styles: {
		header: {
			fontSize: 22,
			bold: true,
			margin: [0, 0, 0, 10],
		},
	},
};

// Generate PDF
const pdf = pdfmake.createPdf(docDefinition as any);
const outputPath = path.join(process.cwd(), "test-output.pdf");

pdf.write(outputPath).then(
	() => {
		console.log(`PDF created successfully: ${outputPath}`);
	},
	(err: Error) => {
		console.error("Error creating PDF:", err);
	}
);
