import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
	return date.toISOString().split("T")[0];
}

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

export const getChipVariant = (dateString: string | null, clientStatus: string | null) => {
	if (!dateString) return "default";

	const date = stripTime(new Date(dateString));
	const today = stripTime(new Date());

	// Today
	if (date.getTime() === today.getTime()) return "yellow";

	// Past
	if (date < today) return "red";

	// Approved
	if (clientStatus?.toUpperCase() === "APPROVED") return "green";

	return "default";
};
