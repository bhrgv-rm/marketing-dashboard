"use client";

import React, { useEffect, useState } from "react";
import Loading from "@/components/loading";
import Empties from "@/components/empties";
import { BriefcaseIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useSession } from "@/context/SessionContext";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { useRouter } from "next/navigation";
import { MagnifyingGlassIcon, XIcon } from "@phosphor-icons/react";

const Page = () => {
	const { token, loading: sessionLoading } = useSession();
	const [workspaces, setWorkspaces] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [superAdmin, setSuperAdmin] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");

	const router = useRouter();

	useEffect(() => {
		if (sessionLoading) return;
		if (!token) {
			setLoading(false);
			return;
		}

		const fetchWorkspaces = async () => {
			try {
				const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ws/getAll`, {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						sessionToken: token,
					},
				});

				const wsData = await res.json();
				const list = Array.isArray(wsData) ? wsData : wsData.workspaces || [];
				setWorkspaces(list);

				const saRes = await fetch("/api/user/checkSA", {
					method: "GET",
					headers: {
						"Content-Type": "application/json",
						sessionToken: token,
					},
				});

				const saJson = await saRes.json();
				setSuperAdmin(saJson.value);
			} catch (err) {
				console.error("Failed to fetch workspaces:", err);
			} finally {
				setLoading(false);
			}
		};

		fetchWorkspaces();
	}, [sessionLoading, token]);

	// Correct filtering
	const filtered = workspaces.filter((ws) => {
		const q = searchTerm.toLowerCase();
		return (
			ws.name.toLowerCase().includes(q) ||
			(ws.information?.industry ?? "").toLowerCase().includes(q)
		);
	});

	if (sessionLoading || loading) return <Loading />;

	return (
		<div className="max-w-5xl mx-auto mt-12 px-4">
			<div className="flex justify-between mb-6">
				<h1 className="text-2xl font-black">Assigned Workspaces</h1>

				{superAdmin && (
					<Link
						href="/ws/create"
						className="px-4 py-2 rounded font-semibold transition duration-200 flex items-center justify-center gap-2 cursor-pointer h-fit bg-gray-100 text-gray-800 border shadow-inner">
						Create New Workspace
					</Link>
				)}
			</div>

			{workspaces.length === 0 && (
				<div className="flex flex-col items-center justify-center w-full min-h-[200px]">
					<Empties
						title="You are not assigned to any workspace yet."
						description="Please contact the administrator for further information."
						icon={<BriefcaseIcon className="size-12" />}
					/>
				</div>
			)}

			{/* Search Bar */}
			<div className="relative w-full mb-4">
				<MagnifyingGlassIcon className="absolute top-2.5 left-2.5" />
				<input
					type="text"
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					placeholder="Search workspaces..."
					className="border rounded-md px-3 pl-8 py-2 text-sm focus:outline-none focus:ring w-full"
				/>
				{searchTerm !== "" && (
					<XIcon
						className="absolute top-2.5 right-2.5 cursor-pointer"
						onClick={() => setSearchTerm("")}
					/>
				)}
			</div>

			{filtered.length > 0 && (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>
								<h1 className="font-bold uppercase">Workspace</h1>
							</TableHead>
							<TableHead>
								<h1 className="font-bold uppercase">Industry</h1>
							</TableHead>
						</TableRow>
					</TableHeader>

					<TableBody>
						{filtered.map((ws) => (
							<TableRow
								key={ws.id}
								onClick={() => router.push(`/ws/${ws.id}`)}
								className="cursor-pointer hover:bg-muted/50 transition">
								<TableCell className="font-medium">{ws.name}</TableCell>
								<TableCell>{ws.information?.industry || "General"}</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</div>
	);
};

export default Page;
