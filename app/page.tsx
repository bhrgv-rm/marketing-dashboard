"use client";

import React, { ChangeEvent, useEffect, useState } from "react";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
import Empties from "@/components/empties";
import Login from "@/components/login";
import { getSession } from "@/lib/auth-client";
import Chip from "@/components/chip";

type GreetingProps = {
	name: string;
};

const Page = () => {
	const Greeting: React.FC<GreetingProps> = ({ name }) => {
		const hours = new Date().getHours();
		let greeting = hours < 12 ? "Good morning" : hours < 18 ? "Good afternoon" : "Good evening";
		return (
			<h1 className="text-3xl font-black mb-6 capitalize">
				{greeting}, {name}
			</h1>
		);
	};

	const [user, setUser] = useState<any | null>(null);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchUser = async () => {
			try {
				const { data } = await getSession();
				setUser(data?.user || null);
			} catch (err) {
				setUser(null);
			} finally {
				setLoading(false);
			}
		};
		fetchUser();
	}, []);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center text-gray-500">
				Loading user info...
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4">
				<p className="text-gray-700">You are not logged in.</p>
				<Login />
			</div>
		);
	}

	return (
		<>
			<div className="max-w-5xl mx-auto mt-12 px-4">
				<Greeting name={user.name} />

				<Empties
					title="You are not assigned to any projects yet."
					description="Please contact the administrator for further information."
					icon={<BriefcaseIcon className="size-12" />}
				/>
			</div>
		</>
	);
};

export default Page;
