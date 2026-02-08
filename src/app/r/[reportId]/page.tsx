import ReportClient from "./report-client";

export default async function ReportPage({
                                             params,
                                         }: {
    params: Promise<{ reportId: string }>;
}) {
    const { reportId } = await params;

    return (
        <div className="mx-auto w-full max-w-7xl px-6 py-6 md:py-12">
            <ReportClient reportId={reportId} />
        </div>
    )
}