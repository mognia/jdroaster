import ReportClient from "./report-client";

export default async function ReportPage({
                                             params,
                                         }: {
    params: Promise<{ reportId: string }>;
}) {
    const { reportId } = await params;

    return <ReportClient reportId={reportId} />;
}
