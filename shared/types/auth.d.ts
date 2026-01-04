// shared/types/auth.d.ts
declare module "#auth-utils" {
	interface User {
		id: number;
		name: string;
		email: string;
		role: "admin" | "user";
		// Add your own fields
	}

	interface UserSession {
		// Add your own fields
	}

	interface SecureSessionData {
		// Add your own fields
	}
}

export {};
