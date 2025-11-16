"use client";

import React from "react";
import { signInWithGoogle } from "@/lib/auth-client";
import Button from "./button";
import Image from "next/image";
import { useSession } from "@/context/SessionContext";

interface LoginProps {
	className?: string;
	isOpen: boolean;
}

const Login = ({ className, isOpen }: LoginProps) => {
	const { user, loading, refresh } = useSession();

	const handleLogin = async () => {
		await signInWithGoogle();
		await refresh();
	};

	if (loading) {
		return (
			<div className={`flex items-center justify-center ${className}`}>
				<span className="text-sm text-gray-500">Loading...</span>
			</div>
		);
	}

	// User logged in
	if (user) {
		return (
			<div className={`flex items-center gap-2 ${className}`}>
				<Image
					src={user.image || "/default-avatar.png"}
					alt="User Avatar"
					width={40}
					height={40}
					className="rounded-full"
				/>

				{/* show name only when open */}
				{isOpen && <span className="text-sm font-medium">{user.name}</span>}
			</div>
		);
	}

	// User not logged in
	if (!user) {
		return (
			<Button variant="secondary" className={className} onClick={handleLogin}>
				<img src="/google.svg" alt="Google" className="w-5 h-5" />

				{/* show "Login" only when open */}
				{isOpen && <span>Login</span>}
			</Button>
		);
	}
};

export default Login;
