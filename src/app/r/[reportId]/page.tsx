import ReportClient from "./report-client";

export default async function ReportPage({
                                             params,
                                         }: {
    params: Promise<{ reportId: string }>;
}) {
    const { reportId } = await params;

    return(
        <div className="mx-auto w-full max-w-4xl px-4 py-6 md:py-10 space-y-6">
            <ReportClient reportId={reportId} />
        </div>
    )
}
