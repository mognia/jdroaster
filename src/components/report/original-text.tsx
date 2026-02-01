"use client";

import { evidenceDomId } from "@/lib/report-utils";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {AnalyzerReportV1} from "@/lib/types/report.types";

export function OriginalText({ report }: { report: AnalyzerReportV1 }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Original job description</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                {report.sentences.map((s) => (
                    <div
                        key={s.id}
                        id={evidenceDomId(s.id)}
                        tabIndex={-1}
                        className="rounded-md border p-2 text-sm leading-relaxed"
                    >
                        {s.text}
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
