export default function (dateString: string) {
	return new Date(dateString).toLocaleDateString("he-IL", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
}
