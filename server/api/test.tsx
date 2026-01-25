// Run this file by running "bun /Users/yakir_reznik/dev/autodox/server/api/test.tsx" in the terminal
// This actuall works and generates a PDF with Hebrew text correctly rendered.
// I'm not sure how i would pass data to this... for rendering actual data from the app.
// Also if we want the pdf to look like the actual form the user saw we probably need to use a different library like puppeteer

// import React from "react";
import ReactPDF from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet, Font } from "@react-pdf/renderer";

// Register font that supports Hebrew characters
Font.register({
	family: "Noto_Sans_Hebrew",
	src: "/Users/yakir_reznik/dev/autodox/fonts/Noto_Sans_Hebrew/NotoSansHebrew-Regular.ttf",
});

// Create styles
const styles = StyleSheet.create({
	page: {
		flexDirection: "row",
		backgroundColor: "#E4E4E4",
	},
	section: {
		margin: 10,
		padding: 10,
		flexGrow: 1,
	},
	paragraph: {
		margin: 10,
		fontSize: 12,
		fontFamily: "Noto_Sans_Hebrew",
		textAlign: "right",
		direction: "rtl",
	},
});

// Create Document Component
const MyDocument = () => {
	const hebrewOnlyText = "לורם איפסום 123 דולר סיט אמת";
	const englishOnlyText = "Lorem ipsum 123 dolor sit amet";
	const mixedText = "לורם איפסום 123 דולר sit amet סיט אמת more english 876";
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<View style={styles.section}>
					<Text>Section #1</Text>
					<Text style={styles.paragraph}>{hebrewOnlyText}</Text>
					<Text>Section #2</Text>
					<Text style={styles.paragraph}>{englishOnlyText}</Text>
					<Text>Section #3</Text>
					<Text style={styles.paragraph}>{mixedText}</Text>
				</View>
			</Page>
		</Document>
	);
};

ReactPDF.render(<MyDocument />, `/Users/yakir_reznik/dev/autodox/test.pdf`);
