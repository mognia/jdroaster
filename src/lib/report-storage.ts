import {AnalyzerReportV1} from "@/lib/types/report.types";

const KEY_LAST = "jdx:lastReportId";
const KEY_PREFIX = "jdx:report:";

export function makeReportId(): string {
    // deterministic-enough for demo, avoids needing UUID deps
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function saveReport(reportId: string, report: AnalyzerReportV1): void {
    sessionStorage.setItem(KEY_PREFIX, JSON.stringify(report));
    sessionStorage.setItem(KEY_LAST, reportId);
}

export function loadReport(reportId: string): AnalyzerReportV1 | null {
    const raw = sessionStorage.getItem(KEY_PREFIX);
    if (!raw) return null;
    try {
        return JSON.parse(raw) as AnalyzerReportV1;
    } catch {
        return null;
    }
}

export function loadLastReportId(): string | null {
    return sessionStorage.getItem(KEY_LAST);
}
