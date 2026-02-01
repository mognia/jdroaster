"use client";

import * as React from "react";
import { byPriorityDesc, evidenceDomId, sentenceByIdMap } from "@/lib/report-utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {AnalyzerReportV1, Finding} from "@/lib/types/report.types";

function scrollToSentence(sentenceId: string) {
    const el = document.getElementById(evidenceDomId(sentenceId));
    if (!el) return;
    el.scrollIntoView({ block: "center", behavior: "auto" }); // no animations
    // tiny accessibility hint, optional but useful
    el.focus?.();
}

export function FindingsList({
                                 title,
                                 items,
                                 report,
                                 emptyText,
                             }: {
    title: string;
    items: Finding[];
    report: AnalyzerReportV1;
    emptyText: string;
}) {
    const sorted = React.useMemo(() => [...items].sort(byPriorityDesc), [items]);
    const sentenceMap = React.useMemo(() => sentenceByIdMap(report.sentences), [report.sentences]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {sorted.length === 0 ? (
                    <div className="text-sm text-muted-foreground">{emptyText}</div>
                ) : (
                    sorted.map((f) => (
                        <div key={f.ruleId}   id={`f-${f.ruleId}`} tabIndex={-1} className="space-y-2 rounded-lg border p-3">
                            <div className="flex flex-col gap-1">
                                <div className="text-sm text-muted-foreground">
                                    Rule, {f.ruleTitle}, priority {f.priority}
                                </div>
                                <div className="font-medium">{f.title}</div>
                                <div className="text-sm text-muted-foreground">{f.explanation}</div>
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
                                                    onClick={() => scrollToSentence(sid)}
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
                    ))
                )}
            </CardContent>
        </Card>
    );
}
