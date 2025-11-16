"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { getSession } from "@/lib/auth-client";

interface SessionContextType {
	user: any | null;
	token: string | null;
	loading: boolean;
	refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType>({
	user: null,
	token: null,
	loading: true,
	refresh: async () => {},
});

export const SessionProvider = ({ children }: { children: React.ReactNode }) => {
	const [user, setUser] = useState<any | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const refresh = async () => {
		setLoading(true);
		try {
			const { data } = await getSession();
			setUser(data?.user || null);
			setToken(data?.session?.token || null);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		refresh();
	}, []);

	return (
		<SessionContext.Provider value={{ user, token, loading, refresh }}>
			{children}
		</SessionContext.Provider>
	);
};

export const useSession = () => useContext(SessionContext);
