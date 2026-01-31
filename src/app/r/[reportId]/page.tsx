import ReportCard from "@/components/report/report-card";
import HighlightedText from "@/components/report/highlighted-text";

export default async function ReportPage({
                                             params,
                                         }: {
    params: Promise<{ reportId: string }>;
}) {
    const { reportId } = await params;

    return (
        <div className="space-y-6">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold tracking-tight">Report</h1>
                <p className="text-muted-foreground">
                    Report ID: <span className="font-mono">{reportId}</span>
                </p>
            </header>

            <ReportCard
                title="Placeholder report"
                description="This page will render persisted reports later."
            >
                <HighlightedText text="Receipts mode will highlight sentences here." />
            </ReportCard>
        </div>
    );
}
