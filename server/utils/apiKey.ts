import { randomBytes } from "crypto";

export function generateApiKey() {
	return randomBytes(32).toString("hex");
}
