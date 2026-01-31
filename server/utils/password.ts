import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
	const salt = randomBytes(16).toString("hex");
	const hash = (await scryptAsync(password, salt, 64)) as Buffer;
	return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(storedPassword: string, suppliedPassword: string): Promise<boolean> {
	const parts = storedPassword.split(":");
	if (parts.length !== 2) {
		return false;
	}
	const [salt, hash] = parts;
	if (!salt || !hash) {
		return false;
	}
	const hashBuffer = Buffer.from(hash, "hex");
	const suppliedHashBuffer = (await scryptAsync(suppliedPassword, salt, 64)) as Buffer;
	return timingSafeEqual(hashBuffer, suppliedHashBuffer);
}
