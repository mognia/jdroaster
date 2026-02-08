"use client";
import * as React from "react";
import { byPriorityDesc, evidenceDomId, sentenceByIdMap } from "@/lib/report-utils";
import { Button } from "@/components/ui/button";
import type { AnalyzerReportV1, Finding } from "@/lib/types/report.types";
import { Hash, SearchCode } from "lucide-react";

export function FindingsList({
                                 scopeKey, title, items, report, emptyText, onGoToEvidence, activeFindingDomId, onFindingActivate,
                             }: {
    scopeKey: "insights" | "green";
    title: string;
    items: Finding[];
    report: AnalyzerReportV1;
    emptyText: string;
    onGoToEvidence: (sentenceId: string) => void;
    activeFindingDomId: string | null;
    onFindingActivate?: (findingDomId: string | null) => void;
}) {
    const sorted = React.useMemo(() => [...items].sort(byPriorityDesc), [items]);
    const sentenceMap = React.useMemo(() => sentenceByIdMap(report.sentences), [report.sentences]);

    const isGreen = scopeKey === "green";
    const accentColor = isGreen ? "border-emerald-500/50 text-emerald-400" : "border-orange-500/50 text-orange-400";
    const stripeColor = isGreen ? "bg-emerald-500" : "bg-orange-600";

    function getFindingKey(f: Finding, idx: number) {
        // Prefer ruleId, fallback to id (if your Finding has it), last resort to index.
        return (f as any).ruleId ?? (f as any).id ?? String(idx);
    }
    function scrollToSentence(sentenceId: string, findingKey?: string) {
        onGoToEvidence(sentenceId);

        if (findingKey) {
            const domId = `f-${scopeKey}-${findingKey}`;
            onFindingActivate?.(domId);
        }

        const targetId = evidenceDomId(sentenceId);

        // Wait for React paint/layout, then scroll.
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                const el = document.getElementById(targetId);
                if (!el) return;

                el.scrollIntoView({
                    behavior: "smooth",
                    block: "start", // IMPORTANT: lets scroll-mt-* work
                });

                // Visual ping (match group color)
                const ring = isGreen ? "ring-emerald-500" : "ring-orange-500";
                el.classList.add("ring-2", ring);
                setTimeout(() => el.classList.remove("ring-2", ring), 900);
            });
        });
    }
    return (
        <div className="space-y-4">
            {sorted.length === 0 ? (
                <div className="p-8 border border-dashed border-zinc-800 rounded-lg text-center text-zinc-500 font-mono text-sm">
                    {emptyText}
                </div>
            ) : (
                sorted.map((f, idx) => {
                    const findingKey = getFindingKey(f, idx);
                    const findingDomId = `f-${scopeKey}-${findingKey}`;
                    const isActive = activeFindingDomId === findingDomId;

                    return (
                        <div
                            key={findingDomId}
                            id={findingDomId}
                            className={`group relative overflow-hidden border transition-all duration-200 ${
                                isActive
                                    ? "border-zinc-400 bg-zinc-900 ring-1 ring-zinc-400"
                                    : "border-zinc-800 bg-zinc-950/50 hover:border-zinc-700"
                            }`}
                        >
                            {/* Diagnostic Stripe */}
                            <div className={`absolute left-0 top-0 h-full w-1 ${stripeColor} ${isActive ? "opacity-100" : "opacity-40"}`} />

                            <div className="p-4 pl-5 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="text-sm font-bold font-mono uppercase tracking-tight text-zinc-100">{f.title}</h3>
                                        <p className="text-xs text-zinc-400 leading-relaxed font-sans">{f.explanation}</p>
                                    </div>
                                    <div className={`px-2 py-0.5 rounded border font-mono text-[10px] uppercase font-bold shrink-0 ${accentColor}`}>
                                        {isGreen ? "Flag: Clear" : "Flag: Risk"}
                                    </div>
                                </div>

                                <div className="space-y-2 pt-2 border-t border-zinc-800/50">
                                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest font-bold">
                                        <Hash className="h-3 w-3" /> Source Evidence
                                    </div>

                                    <div className="grid gap-2">

                                        {f.evidenceSentenceIds.map((sid) => {
                                            const s = sentenceMap.get(sid);
                                            const preview = s ? s.text.trim() : "(missing sentence)";

                                            return (
                                                <div key={sid} className="group/item flex flex-col gap-1.5 p-2 bg-zinc-900/50 border border-zinc-800 rounded">
                                                    <p className="text-xs italic text-zinc-400 line-clamp-2 leading-normal font-serif">
                                                        {preview}
                                                    </p>
                                                    <button
                                                        onClick={() => scrollToSentence(sid, findingKey)}
                                                        className="flex items-center gap-1 text-[10px] font-mono text-zinc-500 hover:text-orange-500 transition-colors uppercase font-bold"
                                                    >
                                                        <SearchCode className="h-3 w-3" /> [ LOCATE_SOURCE ]
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );
}