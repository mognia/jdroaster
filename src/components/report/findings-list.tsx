"use client";

import * as React from "react";
import { byPriorityDesc, evidenceDomId, sentenceByIdMap } from "@/lib/report-utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { AnalyzerReportV1, Finding } from "@/lib/types/report.types";

function scrollToElementById(id: string) {
    const el = document.getElementById(id);
    if (!el) return false;

    // Helps when you have sticky headers or just want nicer alignment.
    // Also requires the target element to have scroll-mt-* class applied.
    el.scrollIntoView({ block: "start", behavior: "auto" });
    el.focus?.();
    return true;
}

export function FindingsList({
                                 scopeKey,
                                 title,
                                 items,
                                 report,
                                 emptyText,
                                 onGoToEvidence,
                                 activeFindingDomId,
                                 onFindingActivate,
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

    function scrollToSentence(sentenceId: string, ruleId?: string) {
        onGoToEvidence(sentenceId);

        if (ruleId) {
            const domId = `f-${scopeKey}-${ruleId}`;
            onFindingActivate?.(domId);
        }

        const targetId = evidenceDomId(sentenceId);

        if (scrollToElementById(targetId)) return;

        requestAnimationFrame(() => {
            scrollToElementById(targetId);
        });
    }

    const isGreen = scopeKey === "green";
    const stripe = isGreen ? "bg-emerald-500" : "bg-rose-500";
    const sub = isGreen
        ? "Positive signals, each with receipts."
        : "Risks and unclear signals, each with receipts.";

    return (
        <Card className="border-muted/60 shadow-sm">
            <CardHeader className="space-y-0 pb-3">
                <div className="flex items-center justify-between gap-3">
                    <CardTitle>{title}</CardTitle>
                    <span className="text-s rounded-full border border-red-400 border-2 border-dashed  px-3 py-1 bg-muted/30">{items.length}</span>
                </div>
                <div className="text-sm text-muted-foreground">{sub}</div>
            </CardHeader>

            <CardContent className="space-y-4">
                {sorted.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{emptyText}</div>
                ) : (
                    sorted.map((f) => {
                        const findingDomId = `f-${scopeKey}-${f.ruleId}`;
                        const isActive = activeFindingDomId === findingDomId;

                        return (
                            <div
                                key={f.ruleId}
                                id={findingDomId}
                                tabIndex={-1}
                                className={[
                                    "relative overflow-hidden rounded-xl border bg-card p-4 space-y-3",
                                    "scroll-mt-24",
                                    isActive ? "ring-2 ring-sky-500/80 ring-offset-2 bg-sky-500/5" : "",
                                ].join(" ")}
                            >
                                <div className={`absolute left-0 top-0 h-full w-1.5 ${stripe}`} />

                                <div className="pl-2 space-y-2">
                                    <div className="flex flex-col gap-1">
                                        <div className="text-base font-semibold leading-snug">{f.title}</div>
                                        <div className="text-sm text-muted-foreground leading-relaxed">{f.explanation}</div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="text-sm font-medium">Receipts</div>

                                        <ul className="space-y-2">
                                            {f.evidenceSentenceIds.map((sid) => {
                                                const s = sentenceMap.get(sid);
                                                const preview = s ? s.text.trim() : "(missing sentence)";

                                                return (
                                                    <li key={sid} className="flex flex-col gap-1">
                                                        <Button
                                                            type="button"
                                                            variant="link"
                                                            className="h-auto justify-start p-0 text-left"
                                                            onClick={() => scrollToSentence(sid, f.ruleId)}
                                                        >
                                                            Go to evidence
                                                        </Button>
                                                        <div className="text-sm text-muted-foreground">{preview}</div>
                                                    </li>
                                                );
                                            })}
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </CardContent>
        </Card>
    );
}

