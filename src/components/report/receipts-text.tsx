"use client";

import * as React from "react";
import { evidenceDomId } from "@/lib/report-utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AnalyzerReportV1, Finding } from "@/lib/types/report.types";

type SentenceKind = "insight" | "green" | "none";

function buildSentenceKindMap(report: AnalyzerReportV1): Map<string, SentenceKind> {
    const kind = new Map<string, SentenceKind>();

    // green first, then insights override if overlap
    for (const f of report.greenFlags) {
        for (const sid of f.evidenceSentenceIds) kind.set(sid, "green");
    }
    for (const f of report.insights) {
        for (const sid of f.evidenceSentenceIds) kind.set(sid, "insight");
    }

    return kind;
}


function scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "auto" });
    el.focus?.();
}

export function ReceiptsText({
                                 report,
                                 allFindingsSorted,
                                 activeSentenceId,
                                 onActiveSentenceChange,
                                 onFindingNavigate,
                             }: {
    report: AnalyzerReportV1;
    allFindingsSorted: Finding[];
    activeSentenceId: string | null;
    onActiveSentenceChange: (id: string | null) => void;
    onFindingNavigate: (findingDomId: string) => void;
}) {

    const kindMap = React.useMemo(() => buildSentenceKindMap(report), [report]);

    const pieces = React.useMemo(() => {
        const text = report.normalizedText;
        const out: Array<
            | { t: "text"; value: string }
            | { t: "sentence"; id: string; value: string; kind: SentenceKind }
        > = [];

        let cursor = 0;

        for (const s of report.sentences) {
            const start = s.start;
            const end = s.end;

            if (start > cursor) out.push({ t: "text", value: text.slice(cursor, start) });

            const value = text.slice(start, end);
            const kind = kindMap.get(s.id) ?? "none";
            out.push({ t: "sentence", id: s.id, value, kind });

            cursor = end;
        }

        if (cursor < text.length) out.push({ t: "text", value: text.slice(cursor) });

        return out;
    }, [report.normalizedText, report.sentences, kindMap]);

    function findingForSentenceIn(list: Finding[], sentenceId: string): Finding | null {
        for (const f of list) {
            if (f.evidenceSentenceIds.includes(sentenceId)) return f;
        }
        return null;
    }

    const lineCount = React.useMemo(() => {
        return report.normalizedText.split('\n').length + 5; // +5 for padding
    }, [report.normalizedText]);

    function getFindingKey(f: Finding) {
        return (f as any).ruleId ?? (f as any).id ?? null;
    }

    return (
        <div className="relative font-mono text-[13px] leading-[24px] bg-zinc-950 rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
            {/* FIX: Dynamic Gutter */}
            <div className="absolute left-0 top-0 bottom-0 w-12 bg-zinc-900/50 border-r border-zinc-800 flex flex-col items-center pt-6 text-[10px] text-zinc-600 select-none">
                {Array.from({ length: lineCount }).map((_, i) => (
                    <span key={i} className="h-[24px]">{i + 1}</span>
                ))}
            </div>

            <div className="pl-16 pr-6 py-6 overflow-x-auto min-h-[400px]">
                <div className="max-w-none whitespace-pre-wrap text-zinc-300">
                    {pieces.map((p, idx) => {
                        if (p.t === "text") return <span key={`t-${idx}`} className="text-zinc-500 opacity-60">{p.value}</span>;

                        const isClickable = p.kind !== "none";
                        const isActive = activeSentenceId === p.id;

                        const marker = p.kind === "insight"
                            ? "border-b border-orange-500/60 bg-orange-500/10 hover:bg-orange-500/20"
                            : p.kind === "green"
                                ? "border-b border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20"
                                : "";

                        const activeRing =
                            isActive && p.kind === "green"
                                ? "bg-emerald-500/25 ring-1 ring-emerald-500 rounded-sm"
                                : isActive && p.kind === "insight"
                                    ? "bg-orange-500/30 ring-1 ring-orange-500 rounded-sm"
                                    : "";
                        return (
                            <span
                                key={`s-${p.id}-${idx}`}
                                id={evidenceDomId(p.id)}
                                className={[
                                    "inline-block",          // IMPORTANT: stable scroll box
                                    "transition-all",
                                    "scroll-mt-40",          // used with block:'start'
                                    isClickable ? "cursor-pointer" : "",
                                    marker,
                                    activeRing,
                                    "py-0.5",
                                ].join(" ")}
                                onClick={() => {
                                    if (!isClickable) return;

                                    onActiveSentenceChange(p.id);

                                    const insightTarget = findingForSentenceIn(report.insights, p.id);
                                    const greenTarget = findingForSentenceIn(report.greenFlags, p.id);
                                    const target = insightTarget ?? greenTarget;
                                    if (!target) return;

                                    const scopeKey = insightTarget ? "insights" : "green";
                                    const findingKey = getFindingKey(target);
                                    if (!findingKey) return; // if this hits, your finding objects are missing identifiers

                                    const findingDomId = `f-${scopeKey}-${findingKey}`;
                                    onFindingNavigate(findingDomId);

                                    document.getElementById(findingDomId)?.scrollIntoView({
                                        behavior: "smooth",
                                        block: "center",
                                    });
                                }}
                            >
          {p.value}
        </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

