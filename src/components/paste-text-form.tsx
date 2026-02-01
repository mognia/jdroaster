"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { makeReportId, saveReport } from "@/lib/report-storage";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {Alert, AlertDescription, AlertTitle} from "@/components/ui/alert";
import {AnalyzerReportV1} from "@/lib/types/report.types";

type AnalyzeTextResponse = AnalyzerReportV1;

export function PasteTextForm() {
    const router = useRouter();

    const [text, setText] = React.useState<string>("");
    const [loading, setLoading] = React.useState<boolean>(false);
    const [error, setError] = React.useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        const trimmed = text.trim();
        if (!trimmed) {
            setError("Paste a job description first.");
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
                setError("Analysis failed. Try again.");
                return;
            }

            const data: AnalyzeTextResponse = await res.json();
            console.log(data)
            // Hard guard: version must match expected
            if (data.version !== 1) {
                setError("Unsupported report version.");
                return;
            }

            const reportId = makeReportId();
            console.log(reportId)
            saveReport(reportId, data);
            router.push(`/r/${reportId}`);
        } catch {
            setError("Network error. Try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-3">
            <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the full job description here…"
                className="min-h-[240px]"
            />

            {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex items-center gap-3">
                <Button type="submit" disabled={loading}>
                    {loading ? "Analyzing…" : "Analyze"}
                </Button>
                <div className="text-sm text-muted-foreground">
                    Runs server-side only, results stored in this browser session.
                </div>
            </div>
        </form>
    );
}
