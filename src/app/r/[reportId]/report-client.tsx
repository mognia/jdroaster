"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { loadLastReportId, loadReport } from "@/lib/report-storage";

import { FindingsList } from "@/components/report/findings-list";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {AnalyzerReportV1} from "@/lib/types/report.types";
import {ReceiptsText} from "@/components/report/receipts-text";
import {byPriorityDesc} from "@/lib/report-utils";
import {ScoreMetricsCard} from "@/components/report/score-metrics-card";

function EmptyState() {
    return (
        <div className="space-y-3">
            <h1 className="text-xl font-semibold">No report found</h1>
            <p className="text-sm text-muted-foreground">
                Run an analysis from the Paste Text tab first.
            </p>
            <Button asChild>
                <Link href="/">Go to analyzer</Link>
            </Button>
        </div>
    );
}

export default function ReportClient({ reportId }: { reportId: string }) {
    const router = useRouter();

    const [report, setReport] = React.useState<AnalyzerReportV1 | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [activeSentenceId, setActiveSentenceId] = React.useState<string | null>(null);

    // store DOM id, not ruleId
    const [activeFindingDomId, setActiveFindingDomId] = React.useState<string | null>(null);

    React.useEffect(() => {
        function onDocClick(e: MouseEvent) {
            const el = e.target as HTMLElement | null;
            if (!el) return;
            if (el.closest('[data-jdx-scope="findings"]')) return;
            if (el.closest('[data-jdx-scope="receipts"]')) return;
            setActiveFindingDomId(null);
        }
        document.addEventListener("click", onDocClick);
        return () => document.removeEventListener("click", onDocClick);
    }, []);

    React.useEffect(() => {
        setError(null);

        const loaded = loadReport(reportId);
        if (loaded) {
            setReport(loaded);
            return;
        }

        const last = loadLastReportId();
        if (last && last !== reportId) {
            router.replace(`/r/${last}`);
            return;
        }

        setReport(null);
    }, [reportId, router]);

    const allFindingsSorted = React.useMemo(() => {
        if (!report) return [];
        return [...report.insights, ...report.greenFlags].sort(byPriorityDesc);
    }, [report]);

    if (!report && !error) return <EmptyState />;

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!report) return <EmptyState />;

    return (
        <div className="space-y-6">
            <header className="space-y-2">
                <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Report</h1>
                        <p className="text-sm text-muted-foreground">
                            Deterministic analysis, sentence-level receipts.
                        </p>
                    </div>

                    <div className="hidden sm:flex flex-col items-end gap-1">
                        <div className="text-xs text-muted-foreground">Report ID</div>
                        <div className="font-mono text-xs rounded-md border px-2 py-1 bg-muted/30">
                            {reportId}
                        </div>
                    </div>
                </div>
            </header>

            <ScoreMetricsCard scores={report.scores} />

            <div data-jdx-scope="findings">
                <FindingsList
                    scopeKey="insights"
                    title="Insights"
                    items={report.insights}
                    report={report}
                    emptyText="No issues flagged by the current rule catalog."
                    onGoToEvidence={(sid) => {
                        setActiveSentenceId(sid);
                        setActiveFindingDomId(null);
                    }}
                    activeFindingDomId={activeFindingDomId}
                    onFindingActivate={(domId) => setActiveFindingDomId(domId)}
                />
            </div>

            <div data-jdx-scope="findings">
                <FindingsList
                    scopeKey="green"
                    title="Green flags"
                    items={report.greenFlags}
                    report={report}
                    emptyText="No green flags detected."
                    onGoToEvidence={(sid) => {
                        setActiveSentenceId(sid);
                        setActiveFindingDomId(null);
                    }}
                    activeFindingDomId={activeFindingDomId}
                    onFindingActivate={(domId) => setActiveFindingDomId(domId)}
                />
            </div>

            <div data-jdx-scope="receipts">
                <ReceiptsText
                    report={report}
                    allFindingsSorted={allFindingsSorted}
                    activeSentenceId={activeSentenceId}
                    onActiveSentenceChange={setActiveSentenceId}
                    onFindingNavigate={(findingDomId) => setActiveFindingDomId(findingDomId)}
                />
            </div>
        </div>
    );
}
