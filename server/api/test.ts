import puppeteer from "puppeteer";

export default defineEventHandler(async (event) => {
	const browser = await puppeteer.launch({
		headless: true,
	});

	const url = `http://localhost:3000/fill/3?token=8adcc6c3c24015f272b093aa08d6132a`;

	try {
		const page = await browser.newPage();
		await page.goto(url, {
			waitUntil: "networkidle0",
		});

		const pdfBuffer = await page.pdf({
			format: "A4",
			printBackground: true,
		});

		setHeader(event, "Content-Type", "application/pdf");
		setHeader(event, "Content-Disposition", 'inline; filename="webra.pdf"');

		return pdfBuffer;
	} finally {
		await browser.close();
	}
});
