import React from "react";
import { cn } from "@/lib/utils-client";

type ButtonVariant =
	| "default"
	| "outline"
	| "danger"
	| "secondary"
	| "ghost"
	| "success"
	| "destructive";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	variant?: ButtonVariant;
	className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ variant = "default", className, children, disabled, ...props }, ref) => {
		const baseStyles =
			"px-4 py-2 rounded font-semibold transition duration-200 flex items-center justify-center gap-2 cursor-pointer h-fit";

		const variantStyles: Record<ButtonVariant, string> = {
			default: "bg-foreground text-white box shadow-inner",
			outline: "border shadow-inner",
			danger: "bg-red-500 text-white shadow-inner",
			secondary: "bg-gray-100 text-gray-800 border shadow-inner",
			ghost: "bg-transparent shadow-inner",
			success: "bg-emerald-500 shadow-inner",
			destructive:
				"bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
		};

		const disabledStyles = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";

		return (
			<button
				ref={ref} // Forward ref to button
				className={cn(baseStyles, variantStyles[variant], disabledStyles, className)}
				disabled={disabled}
				{...props} // Spread remaining props
			>
				{children}
			</button>
		);
	}
);

Button.displayName = "Button"; // This helps with debugging and ensures proper display name in React dev tools

export default Button;
