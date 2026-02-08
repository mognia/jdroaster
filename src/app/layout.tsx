import "./globals.css";
import { Metadata } from "next";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import React from "react";

export const metadata: Metadata = {
    title: 'jdRoaster // JD Linter',
    description: 'Deterministic job description linter with receipts.',
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
        <body className="bg-zinc-950 text-zinc-50 antialiased selection:bg-orange-500/30">
        {/* Subtle grid background for the "Technical" feel */}
        <div className="fixed inset-0 z-[-1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

        <div className='min-h-dvh flex flex-col relative'>
            <Header />
            <main className={'flex-1'}>
                <div className={'mx-auto w-full max-w-7xl px-6 py-12'}>
                    {children}
                </div>
            </main>
            <Footer />
        </div>
        </body>
        </html>
    );
}