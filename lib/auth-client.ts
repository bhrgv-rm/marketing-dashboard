"use client";

import { createAuthClient } from "better-auth/client";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string,
});

export const { signIn, signUp, signOut, useSession, getSession } = authClient;

export const signInWithGoogle = async () => {
	try {
		return await signIn.social({
			provider: "google",
		});
	} catch (err) {
		console.error("Google sign-in failed:", err);
		throw err;
	}
};

// export const signUpWithEmail = async (email: string, password: string, name: string) => {
// 	try {
// 		return await signUp.email({
// 			email,
// 			password,
// 			name,
// 			callbackURL: "/dashboard",
// 		});
// 	} catch (err) {
// 		console.error("Email sign-up failed:", err);
// 		throw err;
// 	}
// };

// export const signInWithEmail = async (email: string, password: string) => {
// 	try {
// 		return await signIn.email({
// 			email,
// 			password,
// 		});
// 	} catch (err) {
// 		console.error("Email sign-in failed:", err);
// 		throw err;
// 	}
// };

export const handleSignOut = async () => {
	try {
		await signOut();
		console.log("Signed out successfully");
	} catch (err) {
		console.error("Sign-out failed:", err);
	}
};
