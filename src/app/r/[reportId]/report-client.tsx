"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { loadLastReportId, loadReport } from "@/lib/report-storage";
import { FindingsList } from "@/components/report/findings-list";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AnalyzerReportV1 } from "@/lib/types/report.types";
import { ReceiptsText } from "@/components/report/receipts-text";
import { byPriorityDesc } from "@/lib/report-utils";
import { ScoreMetricsCard } from "@/components/report/score-metrics-card";
import { Terminal, AlertTriangle, ChevronLeft, ShieldCheck } from "lucide-react";

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-zinc-800 rounded-xl bg-zinc-900/20 text-center">
            <Terminal className="h-12 w-12 text-zinc-700 mb-4" />
            <h1 className="text-xl font-mono font-bold text-zinc-200 uppercase tracking-tight">No Report Found</h1>
            <p className="text-sm text-zinc-500 mb-6 max-w-xs">
                The analysis engine found nothing at this address. Run a scan to generate receipts.
            </p>
            <Button variant="outline" className="font-mono text-xs border-zinc-700 hover:bg-orange-600 hover:text-white transition-colors" asChild>
                <Link href="/">[ EXECUTE_NEW_SCAN ]</Link>
            </Button>
        </div>
    );
}

export default function ReportClient({ reportId }: { reportId: string }) {
    const router = useRouter();
    const [report, setReport] = React.useState<AnalyzerReportV1 | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [activeSentenceId, setActiveSentenceId] = React.useState<string | null>(null);
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
            <Alert variant="destructive" className="bg-red-950/20 border-red-900 text-red-400 font-mono">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold uppercase tracking-widest text-xs">Runtime Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        );
    }

    if (!report) return <EmptyState />;

    return (
        <div className="space-y-10 animate-in fade-in duration-500">
            {/* --- HEADER SECTION --- */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-zinc-800">
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase tracking-widest">
                        <Link href="/" className="hover:text-orange-500 transition-colors flex items-center gap-1">
                            <ChevronLeft className="h-3 w-3" /> Dashboard
                        </Link>
                        <span>/</span>
                        <span className="text-zinc-300">Analysis_Report</span>
                    </div>
                    <h1 className="text-4xl font-black tracking-tighter uppercase italic text-zinc-100">
                        The Roast<span className="text-orange-600">.</span>
                    </h1>
                </div>

                <div className="flex flex-col items-end gap-1.5 font-mono">
                    <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Checksum / ID</span>
                    <div className="text-[11px] rounded bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-zinc-400 shadow-inner">
                        {reportId}
                    </div>
                </div>
            </header>

            {/* --- TOP METRICS GRID --- */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-4 static lg:sticky lg:top-24">
                <ScoreMetricsCard scores={report.scores} />
                    <div className="mt-4 p-4 rounded-lg bg-zinc-900/40 border border-zinc-800/50">
                        <h4 className="text-[10px] font-mono font-bold text-zinc-500 uppercase mb-2 tracking-widest">Linter Notes</h4>
                        <p className="text-xs leading-relaxed text-zinc-400">
                            Scoring is deterministic based on the current rule catalog. Red flags indicate high-probability "hiring fluff" or vague requirements.
                        </p>
                    </div>
                </div>

                {/* --- DIAGNOSTICS COLUMN --- */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Red Flags / Insights */}
                    <div data-jdx-scope="findings" className="relative">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-zinc-300">Red Flags Identified</h2>
                        </div>
                        <FindingsList
                            scopeKey="insights"
                            title="" // Removed redundant title
                            items={report.insights}
                            report={report}
                            emptyText="No issues flagged. This JD is surprisingly clean."
                            onGoToEvidence={(sid) => {
                                setActiveSentenceId(sid);
                                setActiveFindingDomId(null);
                            }}
                            activeFindingDomId={activeFindingDomId}
                            onFindingActivate={(domId) => setActiveFindingDomId(domId)}
                        />
                    </div>

                    {/* Green Flags */}
                    <div data-jdx-scope="findings">
                        <div className="flex items-center gap-2 mb-4">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            <h2 className="font-mono text-sm font-bold uppercase tracking-widest text-zinc-300">Green Flags / Green Signals</h2>
                        </div>
                        <FindingsList
                            scopeKey="green"
                            title=""
                            items={report.greenFlags}
                            report={report}
                            emptyText="No green flags detected. Proceed with extreme caution."
                            onGoToEvidence={(sid) => {
                                setActiveSentenceId(sid);
                                setActiveFindingDomId(null);
                            }}
                            activeFindingDomId={activeFindingDomId}
                            onFindingActivate={(domId) => setActiveFindingDomId(domId)}
                        />
                    </div>
                </div>
            </section>

            {/* --- SOURCE CODE / RECEIPTS (Full Width) --- */}
            <section data-jdx-scope="receipts" className="pt-10 border-t border-zinc-800">
                <div className="flex items-center justify-between mb-6">
                    <div className="space-y-1">
                        <h2 className="font-mono text-lg font-bold uppercase tracking-tighter text-zinc-100">The Receipts</h2>
                        <p className="text-xs text-zinc-500 font-mono italic underline decoration-zinc-800 underline-offset-4">Click highlighted text to view diagnostic details.</p>
                    </div>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 overflow-hidden shadow-2xl shadow-black/50">
                    <ReceiptsText
                        report={report}
                        allFindingsSorted={allFindingsSorted}
                        activeSentenceId={activeSentenceId}
                        onActiveSentenceChange={setActiveSentenceId}
                        onFindingNavigate={(findingDomId) => setActiveFindingDomId(findingDomId)}
                    />
                </div>
            </section>
        </div>
    );
}