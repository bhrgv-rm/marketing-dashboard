"use client";
import React, { createContext, useContext, useState, useCallback } from "react";
import {
	CheckCircleIcon,
	ExclamationCircleIcon,
	InformationCircleIcon,
	XCircleIcon,
} from "@heroicons/react/24/outline";
export enum TOAST_TYPES {
	INFO = "info",
	SUCCESS = "success",
	ERROR = "error",
	WARNING = "warning",
}

type ToastType = TOAST_TYPES;
type Toast = {
	id: string;
	message: string;
	type: ToastType;
	visible: boolean;
};

type ToastContextType = {
	addToast: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast Provider
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const addToast = useCallback((message: string, type: ToastType = TOAST_TYPES.INFO) => {
		const id = Date.now().toString();
		const newToast: Toast = {
			id,
			message: typeof message === "string" ? message : JSON.stringify(message),
			type,
			visible: true,
		};

		setToasts((prev) => [...prev, newToast]);

		setTimeout(() => {
			// Start fade-out
			setToasts((prev) =>
				prev.map((toast) => (toast.id === id ? { ...toast, visible: false } : toast))
			);
		}, 4500);
		setTimeout(() => {
			setToasts((prev) => prev.filter((toast) => toast.id !== id));
		}, 5000);
	}, []);

	return (
		<ToastContext.Provider value={{ addToast }}>
			{children}
			<Toaster toasts={toasts} />
		</ToastContext.Provider>
	);
};

// Hook to use the toast context
export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) throw new Error("useToast must be used within a ToastProvider");
	return context;
};
const Toaster: React.FC<{ toasts: Toast[] }> = ({ toasts }) => {
	return (
		<div className="fixed bottom-4 right-4 space-y-2 z-100">
			{toasts.map((toast) => {
				let icon;
				let bgColor = "";
				let textColor = "text-white";

				switch (toast.type) {
					case TOAST_TYPES.SUCCESS:
						icon = <CheckCircleIcon className="size-6 mr-2 " />;
						bgColor = "bg-emerald-400/70 border-emerald-400";
						break;
					case TOAST_TYPES.ERROR:
						icon = <XCircleIcon className="size-6 mr-2" />;
						bgColor = "bg-red-400/70 border-red-400";
						break;
					case TOAST_TYPES.WARNING:
						icon = <ExclamationCircleIcon className="size-6 mr-2" />;
						bgColor = "bg-yellow-400/70 border-yellow-400";
						textColor = "text-black";
						break;
					case TOAST_TYPES.INFO:
					default:
						icon = <InformationCircleIcon className="size-6 mr-2" />;
						bgColor = "bg-sky-400/70 border-sky-400";
						break;
				}

				return (
					<div
						key={toast.id}
						className={`flex items-center pr-2 p-2 rounded-lg w-72 shadow transition-all duration-500 transform
							${bgColor} ${textColor} border-2 
							${toast.visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"}
						`}>
						<span className="text-foreground">{icon}</span>
						<span className="text-foreground">{toast.message}</span>
					</div>
				);
			})}
		</div>
	);
};
