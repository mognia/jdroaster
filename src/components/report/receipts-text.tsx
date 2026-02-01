"use client";

import * as React from "react";
import { evidenceDomId } from "@/lib/report-utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {AnalyzerReportV1, Finding} from "@/lib/types/report.types";

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

function firstFindingForSentence(findings: Finding[], sentenceId: string): Finding | null {
    for (const f of findings) {
        if (f.evidenceSentenceIds.includes(sentenceId)) return f;
    }
    return null;
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
                             }: {
    report: AnalyzerReportV1;
    allFindingsSorted: Finding[]; // already sorted by priority desc
}) {
    const kindMap = React.useMemo(() => buildSentenceKindMap(report), [report]);

    // Build pieces from normalizedText + sentence index ranges.
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

            // gap (if any)
            if (start > cursor) {
                out.push({ t: "text", value: text.slice(cursor, start) });
            }

            const value = text.slice(start, end);
            const kind = kindMap.get(s.id) ?? "none";

            out.push({ t: "sentence", id: s.id, value, kind });

            cursor = end;
        }

        // tail (if any)
        if (cursor < text.length) {
            out.push({ t: "text", value: text.slice(cursor) });
        }

        return out;
    }, [report.normalizedText, report.sentences, kindMap]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Original job description</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                    {pieces.map((p, idx) => {
                        if (p.t === "text") return <React.Fragment key={`t-${idx}`}>{p.value}</React.Fragment>;

                        const isClickable = p.kind !== "none";
                        const base =
                            "rounded-sm px-0.5 outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
                        const cls =
                            p.kind === "insight"
                                ? `${base} bg-destructive/15`
                                : p.kind === "green"
                                    ? `${base} bg-emerald-500/15`
                                    : "";

                        return (
                            <span
                                key={`s-${p.id}-${idx}`}
                                id={evidenceDomId(p.id)} // stable anchor for “Go to evidence”
                                tabIndex={-1}
                                className={cls}
                                role={isClickable ? "button" : undefined}
                                onClick={() => {
                                    if (!isClickable) return;
                                    const target =
                                        firstFindingForSentence(allFindingsSorted, p.id) ??
                                        firstFindingForSentence(report.insights, p.id) ??
                                        firstFindingForSentence(report.greenFlags, p.id);
                                    if (!target) return;
                                    scrollToId(`f-${target.ruleId}`);
                                }}
                            >
                {p.value}
              </span>
                        );
                    })}
                </div>

                <div className="mt-3 text-xs text-muted-foreground">
                    Highlighting is based on sentence indices from the analyzer output.
                </div>
            </CardContent>
        </Card>
    );
}
