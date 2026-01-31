import React from 'react'
import Link from "next/link";
import {Button} from "@/components/ui/button";

function Header() {
    return (
        <header className="border-b">
            <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
                <Link href="/" className="font-semibold tracking-tight">
                    JD X-Ray
                </Link>

                <nav className="flex items-center gap-2">
                    <Button variant="ghost" asChild>
                        <Link href="/">Home</Link>
                    </Button>
                </nav>
            </div>
        </header>    )
}

export default Header
