import type { Metadata } from "next";
import { UserProvider } from '@auth0/nextjs-auth0/client';
import Navbar from '@/components/Navbar';
import "./globals.css";

export const metadata: Metadata = {
    title: "Photo Dist App",
    description: "Share photos securely",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <UserProvider>
                <body className="antialiased font-sans min-h-screen flex flex-col">
                    <Navbar />
                    <main className="flex-grow">
                        {children}
                    </main>
                </body>
            </UserProvider>
        </html>
    );
}
