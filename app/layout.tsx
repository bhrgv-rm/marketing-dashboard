import type { Metadata } from "next";
import { Instrument_Sans, Bricolage_Grotesque, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/context/SessionContext";
import { ToastProvider } from "@/components/toaster";
import SidebarLayout from "@/components/sidebar-layout";

const instrument_sans = Instrument_Sans({
	subsets: ["latin"],
	weight: ["500"],
	variable: "--text-family",
});
const bricolage = Bricolage_Grotesque({
	variable: "--font-bricolage-grotesque",
	subsets: ["latin"],
	weight: ["400", "700"],
});
const geistMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Vivetha Dashboard",
	description: "Management Portal for Vivetha Business Consultancy",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${bricolage.variable} ${instrument_sans.variable} ${geistMono.variable} antialiased`}>
				<SessionProvider>
					<SidebarLayout>
						<ToastProvider>{children}</ToastProvider>
					</SidebarLayout>
				</SessionProvider>
			</body>
		</html>
	);
}
