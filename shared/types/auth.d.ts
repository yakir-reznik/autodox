// shared/types/auth.d.ts
import type { UserRole } from "../../server/db/schema"

declare module "#auth-utils" {
	interface User {
		id: number;
		name: string;
		email: string;
		role: UserRole;
		apiKey: string;
	}

	interface UserSession {
		// Add your own fields
	}

	interface SecureSessionData {
		// Add your own fields
	}
}

export {};
