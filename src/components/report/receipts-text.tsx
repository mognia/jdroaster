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

    return (
        <Card className="overflow-hidden border-muted/60 shadow-sm">
            <CardHeader >
                <div className='border-b border-dashed pb-4'>

                    <CardTitle>Original job description</CardTitle>
                </div>
            </CardHeader>

            <CardContent>
                <div className="rounded-xl border-dashed ">
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                        {pieces.map((p, idx) => {
                            if (p.t === "text") return <React.Fragment key={`t-${idx}`}>{p.value}</React.Fragment>;

                            const isClickable = p.kind !== "none";
                            const isActive = activeSentenceId === p.id;

                            const base =
                                "scroll-mt-24 rounded-sm px-0.5 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
                            const marker =
                                p.kind === "insight"
                                    ? "bg-gradient-to-r from-rose-500/30 to-rose-500/10 border-b border-rose-500/50"
                                    : p.kind === "green"
                                        ? "bg-gradient-to-r from-emerald-500/30 to-emerald-500/10 border-b border-emerald-500/50"
                                        : "";
                            const active = isActive ? "ring-2 ring-sky-500/80 ring-offset-2 bg-sky-500/10" : "";
                            const cls = [base, marker, active].filter(Boolean).join(" ");

                            return (
                                <span
                                    key={`s-${p.id}-${idx}`}
                                    id={evidenceDomId(p.id)}
                                    tabIndex={-1}
                                    className={cls}
                                    role={isClickable ? "button" : undefined}
                                    onClick={() => {
                                        if (!isClickable) return;

                                        onActiveSentenceChange(p.id);

                                        // Decide which section to scroll to
                                        const insightTarget = findingForSentenceIn(report.insights, p.id);
                                        const greenTarget = findingForSentenceIn(report.greenFlags, p.id);

                                        const target = insightTarget ?? greenTarget;
                                        if (!target) return;

                                        const scopeKey = insightTarget ? "insights" : "green";
                                        const findingDomId = `f-${scopeKey}-${target.ruleId}`;

                                        onFindingNavigate(findingDomId);

                                        // scroll immediately, retry next frame if needed
                                        scrollToId(findingDomId);
                                        requestAnimationFrame(() => scrollToId(findingDomId));
                                    }}
                                >
                  {p.value}
                </span>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                    Highlighting is based on sentence indices from the analyzer output.
                </div>
            </CardContent>
        </Card>
    );
}

