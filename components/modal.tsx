"use client";

import type React from "react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/utils-client";

interface ModalProps {
	onCloseExternal?: () => void;
	isModalOpen?: boolean;
	title?: string;
	className?: string;
	trigger?: React.ReactNode;
	children: React.ReactNode;
}

function ModalRoot({
	onCloseExternal,
	isModalOpen,
	title,
	className,
	trigger,
	children,
}: ModalProps) {
	const [isOpenState, setIsOpenState] = useState(false);
	const modalRef = useRef<HTMLDivElement>(null);
	const previousFocusRef = useRef<HTMLElement | null>(null);

	const isControlled = typeof isModalOpen === "boolean";
	const open = isControlled ? isModalOpen : isOpenState;

	const onClose = () => {
		if (isControlled) {
			onCloseExternal?.();
		} else {
			setIsOpenState(false);
		}
	};

	useEffect(() => {
		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape" && open) {
				onClose();
			}
		};

		if (open) {
			document.addEventListener("keydown", handleEscape);
			previousFocusRef.current = document.activeElement as HTMLElement;
			document.body.classList.add("overflow-hidden");
			document.body.classList.add("pr-4");

			setTimeout(() => {
				modalRef.current?.focus();
			}, 0);
		} else {
			document.body.classList.remove("overflow-hidden");
			document.body.classList.remove("pr-4");
		}

		return () => {
			document.removeEventListener("keydown", handleEscape);
			document.body.classList.remove("overflow-hidden");
			document.body.classList.remove("pr-4");
			if (previousFocusRef.current) {
				previousFocusRef.current.focus();
			}
		};
	}, [open]);

	const handleBackdropClick = (event: React.MouseEvent<HTMLDivElement>) => {
		if (event.target === event.currentTarget) {
			onClose();
		}
	};

	if (!open) {
		return trigger ? <div onClick={() => setIsOpenState(true)}>{trigger}</div> : null;
	}

	const modalContent = (
		<div
			className="fixed inset-0 z-50 flex items-center justify-center p-4 text-white bg-black/75 backdrop-blur-sm"
			onClick={handleBackdropClick}
			role="dialog"
			aria-modal="true"
			aria-labelledby={title ? "modal-title" : undefined}>
			<div
				ref={modalRef}
				className={cn(
					"relative w-full max-w-md max-h-[90vh] overflow-hidden bg-card rounded-lg shadow-lg border animate-in fade-in-0 zoom-in-95 duration-200",
					"sm:max-w-xl md:max-w-2xl lg:max-w-3xl",
					className
				)}
				onClick={(e) => e.stopPropagation()}
				tabIndex={-1}>
				{/* Header */}
				<div className="flex items-center justify-between px-6 py-4 border-b">
					{title && (
						<h2 id="modal-title" className="text-lg font-semibold text-foreground">
							{title}
						</h2>
					)}
					<XMarkIcon
						onClick={onClose}
						className="size-10 text-foreground font-black ml-auto p-1 cursor-pointer transition-all"
						aria-label="Close modal"
					/>
				</div>

				{/* Children (Body + Footer are slotted here) */}
				{children}
			</div>
		</div>
	);

	return createPortal(modalContent, document.body);
}

// Compound subcomponents
function ModalBody({ children }: { children: React.ReactNode }) {
	return <div className="p-6 text-foreground overflow-y-auto max-h-[60vh]">{children}</div>;
}

function ModalFooter({ children }: { children: React.ReactNode }) {
	return (
		<div className="sticky bottom-0 left-0 right-0 flex flex-col-reverse sm:gap-0 gap-2 sm:flex-row sm:justify-end sm:space-x-2 p-2 border-t-2 border bg-muted/50 backdrop-blur supports-backdrop-blur:bg-muted/30">
			{children}
		</div>
	);
}

// Attach subcomponents
export const Modal = Object.assign(ModalRoot, {
	Body: ModalBody,
	Footer: ModalFooter,
});

export function useModal() {
	const [isOpen, setIsOpen] = useState(false);

	return {
		isOpen,
		open: () => setIsOpen(true),
		close: () => setIsOpen(false),
		toggle: () => setIsOpen((prev) => !prev),
	};
}
