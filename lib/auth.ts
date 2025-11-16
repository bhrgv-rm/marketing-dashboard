import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import * as schema from "@/db/schema/schema";
import { db } from "@/db";

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET,

	session: {
		expiresIn: 60 * 60 * 24 * 3,
	},

	database: drizzleAdapter(db, {
		provider: "pg",
		schema,
	}),

	socialProviders: {
		google: {
			prompt: "select_account",
			clientId: process.env.GOOGLE_CLIENT_ID as string,
			clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
		},
	},
});
