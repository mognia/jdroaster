import React from 'react'

function Footer() {
    const year = new Date().getFullYear();
    return (
        <footer className="border-t border-zinc-800 bg-zinc-950">
            <div className="mx-auto flex flex-col md:flex-row justify-between gap-4 w-full max-w-5xl px-6 py-8 text-xs font-mono text-zinc-500 uppercase tracking-tight">
                <div className="space-y-2">
                    <p className="flex items-center gap-2 text-zinc-400">
                        <span className="text-orange-600 font-bold">#</span>
                        Deterministic JD analysis // No AI Hallucinations
                    </p>
                    <p>
                        © {year} Built for engineers by{" "}
                        <a href="https://mognia.dev" target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-orange-500 underline decoration-zinc-700 underline-offset-4">
                            Mognia
                        </a>
                    </p>
                </div>

                <div className="flex flex-col md:items-end gap-2">
                    <p>Build: v1.0.4-stable</p>
                    <p className="text-[10px]">0% AI GPT-Fluff Detection Active</p>
                </div>
            </div>
        </footer>
    )
}

export default Footer