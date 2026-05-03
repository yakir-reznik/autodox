// shared/types/auth.d.ts
import type { UserRole } from "~~/db/schema";

declare module "#auth-utils" {
	interface User {
		id: number;
		name: string;
		email: string;
		roles: UserRole[];
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
