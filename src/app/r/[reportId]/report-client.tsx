"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { loadLastReportId, loadReport } from "@/lib/report-storage";

import { ScoreCard } from "@/components/report/score-card";
import { FindingsList } from "@/components/report/findings-list";
import { OriginalText } from "@/components/report/original-text";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import {AnalyzerReportV1} from "@/lib/types/report.types";
import {ReceiptsText} from "@/components/report/receipts-text";
import {byPriorityDesc} from "@/lib/report-utils";

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
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Report</h1>
                <p className="text-muted-foreground">
                    Report ID, <span className="font-mono">{reportId}</span>
                </p>
            </header>

            <ScoreCard score={report.score} />

            <FindingsList
                title="Insights"
                items={report.insights}
                report={report}
                emptyText="No issues flagged by the current rule catalog."
            />

            <FindingsList
                title="Green flags"
                items={report.greenFlags}
                report={report}
                emptyText="No green flags detected."
            />

            <ReceiptsText report={report} allFindingsSorted={allFindingsSorted} />
        </div>
    );
}
