"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {Terminal, ShieldAlert, Zap, Code2, AlertCircle, History, ExternalLink, FileSearch} from "lucide-react";
import { makeReportId, saveReport } from "@/lib/report-storage"; // Adjust imports to your path

export default function HomePage() {
    const [text, setText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [recentScans, setRecentScans] = useState<any[]>([]);
    const router = useRouter();

    // Load history on mount
    // useEffect(() => {
    //     const history = getRecentReports(); // Assuming this helper exists
    //     setRecentScans(history || []);
    // }, []);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const trimmed = text.trim();
        if (!trimmed) {
            setError("EMPTY_INPUT_BUFFER: Paste a job description first.");
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/analyze-text", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ rawText: trimmed }),
            });

            if (!res.ok) {
                setError("CRITICAL_FAILURE: Analysis engine failed to respond.");
                return;
            }

            const data = await res.json();

            if (data.version !== 1) {
                setError("VERSION_MISMATCH: Unsupported report format detected.");
                return;
            }

            const reportId = makeReportId();
            saveReport(reportId, data);
            router.push(`/r/${reportId}`);
        } catch {
            setError("NETWORK_TIMEOUT: Check your connection and retry.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-16 pb-20">
            {/* --- HERO --- */}
            <section className="text-center space-y-6 pt-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-orange-500/30 bg-orange-500/5 text-orange-500 text-[10px] font-mono uppercase tracking-[0.2em] animate-pulse">
                    <ShieldAlert className="h-3 w-3" /> System Status: Ready to Roast
                </div>

                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic">
                    Stop applying to <br />
                    <span className="text-orange-600 bg-orange-600/10 px-2">Bullshit Jobs.</span>
                </h1>

                <p className="max-w-2xl mx-auto text-zinc-400 font-mono text-sm md:text-base leading-relaxed">
                    JD Roaster is a deterministic linter for job descriptions.
                    We strip away the HR marketing to find the red flags,
                    unpaid on-call shifts, and "wear many hats" traps.
                </p>
            </section>

            {/* --- INPUT AREA --- */}
            <section className="max-w-4xl mx-auto px-4">
                <form onSubmit={onSubmit} className="relative group">
                    {/* Header/Status Bar */}
                    <div className="flex items-center justify-between px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-t-lg border-b-0">
                        <div className="flex gap-2">
                            <div className="h-2 w-2 rounded-full bg-red-500/50" />
                            <div className="h-2 w-2 rounded-full bg-orange-500/50" />
                            <div className="h-2 w-2 rounded-full bg-green-500/50" />
                        </div>
                        <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <Code2 className="h-3 w-3" /> JD_INPUT_STREAM
                        </div>
                    </div>

                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        disabled={loading}
                        placeholder="// Paste the raw job description text here..."
                        className="w-full h-[350px] bg-zinc-950 border border-zinc-800 rounded-b-lg p-6 font-mono text-sm text-zinc-300 focus:ring-1 focus:ring-orange-600/50 focus:border-orange-600 outline-none transition-all placeholder:text-zinc-800 resize-none shadow-2xl"
                    />

                    {/* Error Console - Only shows when error exists */}
                    {error && (
                        <div className="absolute left-6 bottom-24 right-6 p-3 bg-red-950/20 border border-red-900/50 rounded flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
                            <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                            <span className="font-mono text-[11px] text-red-400 uppercase font-bold">{error}</span>
                        </div>
                    )}

                    {/* Action Button */}
                    <div className="absolute bottom-6 right-6">
                        <Button
                            type="submit"
                            disabled={!text.trim() || loading}
                            className="h-12 px-6 cursor-pointer bg-orange-600 hover:bg-orange-500 text-black font-black uppercase italic tracking-tighter shadow-[4px_4px_0px_0px_rgba(255,255,255,0.1)] active:translate-y-1 active:shadow-none transition-all"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                  <Zap className="h-4 w-4 animate-spin text-black" /> ANALYZING_SOURCE...
                </span>
                            ) : (
                                "Execute Roast"
                            )}
                        </Button>
                    </div>
                </form>

                <div className="mt-4 flex justify-between text-[12px] font-mono text-zinc-600 uppercase">
                    <span>{text.length} characters loaded</span>
                    <span>Buffer: {loading ? "Busy" : <span className={'text-emerald-500'}>Ready</span> }</span>
                </div>
            </section>

            {/* Technical Footer Decoration */}
            <div className="mt-4 flex justify-between text-[11px] font-mono text-zinc-600 uppercase">
                <span>Encoding: UTF-8</span>
                <span>Buffer: {text.length} chars</span>
                <span>Status: Awaiting Input</span>
            </div>

    {/* --- FEATURES GRID --- */}
    <section className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <FeatureCard
            icon={<FileSearch className="text-orange-500" />}
            title="Sentence Extraction"
            desc="We break every JD into atomic sentences. No vague vibes, just pure data points."
        />
        <FeatureCard
            icon={<Zap className="text-emerald-500" />}
            title="No AI Fluff"
            desc="Deterministic rule checking. We don't guess intent; we identify high-probability red flags."
        />
        <FeatureCard
            icon={<Terminal className="text-blue-500" />}
            title="The Receipts"
            desc="Every score is tied to a specific sentence in the text. We show you exactly where the BS is."
        />
    </section>

    {/* --- PERSONA QUOTE --- */}
    <section className="max-w-3xl mx-auto border-y border-zinc-900 py-12 text-center">
        <blockquote className="text-xl font-medium italic text-zinc-300">
            "If a company can't write a job description like an adult,
            don't expect them to treat you like one."
        </blockquote>
        <div className="mt-4 text-xs font-mono text-zinc-500 uppercase">— Senior Engineer, Probably</div>
    </section>
</div>
);
}
function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
    return (
        <div
            className="p-6 bg-zinc-900/30 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors group">
            <div
                className="mb-4 h-10 w-10 flex items-center justify-center bg-zinc-950 border border-zinc-800 rounded-lg group-hover:scale-110 transition-transform">
                {icon}
            </div>
            <h3 className="font-mono font-bold text-zinc-100 uppercase text-xs mb-2 tracking-widest">{title}</h3>
            <p className="text-sm text-zinc-500 leading-relaxed italic">
                {desc}
            </p>
        </div>
    );
}