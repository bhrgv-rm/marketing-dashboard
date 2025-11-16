"use client";

import Link from "next/link";
import {
	BellIcon,
	BuildingLibraryIcon,
	Cog6ToothIcon,
	FolderOpenIcon,
	PencilSquareIcon,
} from "@heroicons/react/24/outline";
import Login from "./login";
import { useSession } from "@/context/SessionContext";
import { SidebarSimpleIcon } from "@phosphor-icons/react";
import React from "react";

interface HeaderProps {
	isOpen: boolean;
	setOpen: (value: boolean) => void;
}

interface SidebarItemProps {
	href: string;
	icon: any;
	label: string;
	isOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ isOpen, setOpen }) => {
	const { user } = useSession();

	return (
		<nav
			className={`h-screen fixed top-0 left-0 bg-chart-1 flex flex-col z-10 justify-between py-6 px-4 text-background shadow-lg transition-all duration-300
			${isOpen ? "w-56" : "w-20"}`}>
			<div>
				<div className={`flex items-center justify-between mb-10 ${!isOpen && `flex-col gap-4`}`}>
					<Link href="/" className="flex items-center gap-2">
						<BuildingLibraryIcon className="h-8 w-8" />
					</Link>

					<SidebarSimpleIcon className="cursor-pointer size-6" onClick={() => setOpen(!isOpen)} />
				</div>

				<div className="flex flex-col gap-3">
					<SidebarItem href="/ws" icon={FolderOpenIcon} label="WorkSpaces" isOpen={isOpen} />
					<SidebarItem href="/tasks" icon={PencilSquareIcon} label="Tasks" isOpen={isOpen} />
					<SidebarItem
						href="/notifications"
						icon={BellIcon}
						label="Notifications"
						isOpen={isOpen}
					/>
					<SidebarItem href="/settings" icon={Cog6ToothIcon} label="Settings" isOpen={isOpen} />
				</div>
			</div>

			<Login className="gap-3" isOpen={isOpen} />
		</nav>
	);
};

export default Header;

const SidebarItem: React.FC<SidebarItemProps> = ({ href, icon: Icon, label, isOpen }) => {
	return (
		<Link
			href={href}
			className={`flex items-center gap-3 px-2 py-2 rounded-md hover:bg-background/10 transition-colors ${
				!isOpen && `justify-center`
			}`}
			title={label}>
			<Icon className="size-6" />
			{isOpen && <span>{label}</span>}
		</Link>
	);
};
