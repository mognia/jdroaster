'use client'
import React from 'react'
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {usePathname} from "next/navigation";

function Header() {
    const pathname = usePathname();
    const isReportPage = pathname !== "/";
    return (
        <header className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md sticky top-0 z-50">
            <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="bg-orange-600 px-1.5 py-0.5 rounded text-black font-bold text-xs">JD</div>
                    <span className="font-mono text-lg font-bold tracking-tighter group-hover:text-orange-500 transition-colors">
                        roaster<span className="text-orange-600">_</span>
                    </span>
                </Link>

                <nav className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">System: Operational</span>
                    </div>
                    <Button variant="ghost" size="sm" className="font-mono text-xs hover:bg-zinc-900" asChild>
                        {isReportPage &&
                            <Link href="/">[ BACK_TO_HOME ]</Link>
                        }
                    </Button>
                </nav>
            </div>
        </header>
    )
}

export default Header