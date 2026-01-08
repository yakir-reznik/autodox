import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import * as schema from "./schema";

let _db: MySql2Database<typeof schema> | null = null;

export function getDb() {
	if (!_db) {
		const config = useRuntimeConfig();
		_db = drizzle(config.databaseUrl, {
			schema,
			mode: "default"
		});
	}
	return _db;
}

// For backwards compatibility - lazily initialized
export const db = new Proxy({} as MySql2Database<typeof schema>, {
	get(_, prop) {
		return (getDb() as any)[prop];
	}
});
