"use client";

import React, { useEffect, useState, useMemo } from "react";
import Button from "@/components/button";
import Input from "@/components/input";
import InfoTooltip from "@/components/info-tooltip";
import {
	ExclamationTriangleIcon,
	InformationCircleIcon,
	XMarkIcon,
} from "@heroicons/react/24/outline";
import { useSession } from "@/context/SessionContext";
import { useRouter } from "next/navigation";

import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import Callout from "@/components/callout";

export default function CreateWorkspacePage() {
	const router = useRouter();

	const [workspaceName, setWorkspaceName] = useState("");
	const [workspaceImage, setWorkspaceImage] = useState("");

	const [allUsers, setAllUsers] = useState<any[]>([]);
	const [loadingUsers, setLoadingUsers] = useState(false);

	// Role lists
	const [admins, setAdmins] = useState<string[]>([]);
	const [managers, setManagers] = useState<string[]>([]);
	const [contentHeads, setContentHeads] = useState<string[]>([]);
	const [assignees, setAssignees] = useState<string[]>([]);
	const [clients, setClients] = useState<string[]>([]);
	const { user, token, loading: sessionLoading } = useSession();

	// Fetch all users
	const fetchUsers = async () => {
		try {
			setLoadingUsers(true);

			const sessionToken = token;
			if (!sessionToken) throw new Error("Missing session token");

			const res = await fetch("/api/user/get", {
				method: "GET",
				headers: { sessionToken },
			});

			const response = await res.json();
			setAllUsers(response || []);
		} catch (err) {
			console.log("Error fetching users:", err);
		} finally {
			setLoadingUsers(false);
		}
	};

	useEffect(() => {
		fetchUsers();
	}, []);

	// Who is already used anywhere?
	const usedUsers = useMemo(() => {
		return new Set([...admins, ...managers, ...contentHeads, ...assignees, ...clients]);
	}, [admins, managers, contentHeads, assignees, clients]);

	// Filter users for each dropdown
	const availableFor = (roleList: string[]) => {
		return allUsers.filter(
			(u) =>
				(!usedUsers.has(u.id) && u.id !== user?.id) || // exclude current user
				roleList.includes(u.id)
		);
	};

	// Reusable select
	const UserSelect = ({
		label,
		value,
		onSelect,
		options,
	}: {
		label: string;
		value: string;
		onSelect: (v: string) => void;
		options: any[];
	}) => (
		<div>
			<label className="text-sm font-semibold">{label}</label>
			<Select value={value} onValueChange={onSelect}>
				<SelectTrigger className="w-full mt-1">
					<SelectValue placeholder={loadingUsers ? "Loading..." : "Select People"} />
				</SelectTrigger>

				<SelectContent className="max-h-64">
					{options.map((u: any) => (
						<SelectItem key={u.id} value={u.id}>
							<div className="flex items-center gap-4">
								<img src={u.image} className="size-10 rounded-full border" alt="" />
								<div className="flex flex-col">
									<p className="font-bold">{u.name}</p>
									<p className="text-sm">{u.email}</p>
								</div>
							</div>
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);

	const renderChips = (ids: string[], setter: any) => (
		<div className="mt-2 flex flex-wrap gap-2">
			{ids.map((id) => {
				const u = allUsers.find((x) => x.id === id);
				return (
					<div
						key={id}
						className="flex items-center gap-2 pr-3 pl-1 py-1 border border-foreground bg-sidebar-accent rounded-full text-sm">
						<img src={u.image} className="w-6 rounded-full" alt="" />
						<span>{u?.name}</span>
						<button onClick={() => setter((prev: string[]) => prev.filter((x) => x !== id))}>
							<XMarkIcon className="size-4 cursor-pointer" />
						</button>
					</div>
				);
			})}
		</div>
	);

	// Submit API
	const handleCreateWorkspace = async () => {
		try {
			if (!token) throw new Error("Missing session token");

			const res = await fetch("/api/ws/create", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
					sessionToken: token,
				},
				body: JSON.stringify({
					name: workspaceName,
					image: workspaceImage,
					roles: {
						admins,
						managers,
						contentHeads,
						assignees,
						clients,
					},
				}),
			});

			const result = await res.json();
			console.log("Workspace API result:", result);

			if (!res.ok) {
				console.error("Failed to create workspace:", result);
				return;
			}

			router.push(`/ws/${result.workspaceId}`);
		} catch (err) {
			console.error("Error creating workspace:", err);
		}
	};

	return (
		<>
			<div className="max-w-240 mx-auto mt-12 px-4">
				<div className="flex justify-between items-center">
					<h1 className="text-2xl font-black mb-4">Create a New Workspace</h1>
					<InfoTooltip icon={<InformationCircleIcon className="size-6" />}>
						A user must log in at least once before they can be added to a workspace. The roles
						assigned here apply only to this workspace and may differ in other workspaces.
					</InfoTooltip>
				</div>

				<div className="flex flex-col gap-4 w-full">
					<Input
						label="Workspace Name"
						placeholder="workspace name"
						value={workspaceName}
						onChange={(e) => setWorkspaceName(e.target.value)}
					/>

					<Input
						label="Workspace Image"
						placeholder="workspace thumbnail"
						value={workspaceImage}
						onChange={(e) => setWorkspaceImage(e.target.value)}
					/>

					<Callout icon={<ExclamationTriangleIcon className="w-5 h-5" />}>
						<p className="text-chart-1">
							The person creating the workspace will automatically be assigned as ADMIN to that
							workspace.
						</p>
					</Callout>

					<div>
						<UserSelect
							label="Admins"
							value=""
							onSelect={(id) => setAdmins((prev) => (prev.includes(id) ? prev : [...prev, id]))}
							options={availableFor(admins)}
						/>
						{renderChips(admins, setAdmins)}
					</div>

					<div>
						<UserSelect
							label="Managers"
							value=""
							onSelect={(id) => setManagers((prev) => (prev.includes(id) ? prev : [...prev, id]))}
							options={availableFor(managers)}
						/>
						{renderChips(managers, setManagers)}
					</div>

					<div>
						<UserSelect
							label="Content Heads"
							value=""
							onSelect={(id) =>
								setContentHeads((prev) => (prev.includes(id) ? prev : [...prev, id]))
							}
							options={availableFor(contentHeads)}
						/>
						{renderChips(contentHeads, setContentHeads)}
					</div>

					<div>
						<UserSelect
							label="Assignees"
							value=""
							onSelect={(id) => setAssignees((prev) => (prev.includes(id) ? prev : [...prev, id]))}
							options={availableFor(assignees)}
						/>
						{renderChips(assignees, setAssignees)}
					</div>

					<div>
						<UserSelect
							label="Clients"
							value=""
							onSelect={(id) => setClients((prev) => (prev.includes(id) ? prev : [...prev, id]))}
							options={availableFor(clients)}
						/>
						{renderChips(clients, setClients)}
					</div>

					<Button onClick={handleCreateWorkspace} className="mb-8">
						Create Workspace
					</Button>
				</div>
			</div>
		</>
	);
}
