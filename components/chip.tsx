import React from "react";
import { cn } from "@/lib/utils-client";

type ChipVariant = "default" | "blue" | "red" | "orange" | "green" | "yellow";

interface ChipProps {
	value: string | null;
	variant?: ChipVariant;
	className?: string;
}

const Chip = ({ value, variant = "default", className }: ChipProps) => {
	const variantClasses = {
		default: "border-slate-600 bg-slate-200 text-slate-600",
		blue: "bg-blue-200 border-blue-600 text-blue-600",
		orange: "bg-orange-200 border-orange-600 text-orange-600",
		red: "bg-red-200 border-red-600 text-red-600",
		green: "bg-green-200 border-green-600 text-green-600",
		yellow: "bg-yellow-200 border-yellow-600 text-yellow-600",
	};

	const chipClasses = cn(
		"inline-flex items-center select-none justify-center rounded-xs border p-1 text-sm leading-2.5 font-mono tracking-tighter font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden uppercase",
		variantClasses[variant],
		className
	);

	return <p className={chipClasses}>{value}</p>;
};

export default Chip;
