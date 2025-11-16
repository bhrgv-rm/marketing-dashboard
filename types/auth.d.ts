import "better-auth";

declare module "better-auth" {
	interface User {
		role: "USER" | "ADMIN" | "SUPER ADMIN";
	}

	interface SessionUser {
		role: "USER" | "ADMIN" | "SUPER ADMIN";
	}
}
