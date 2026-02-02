import {Scores} from "@/lib/types/types";

export const REPORT_VERSION = 1 as const;

export type ReportVersion = typeof REPORT_VERSION;

export type Sentence = {
    id: string;          // stable within a report (string to avoid numeric/UUID assumptions)
    start: number;       // index into normalizedText (inclusive)
    end: number;         // index into normalizedText (exclusive)
    text: string;        // optional convenience, must match normalizedText.slice(start, end)
};

export type Finding = {
    title: string;
    ruleId: string;
    ruleTitle: string;        // human readable rule name
    explanation: string;      // short explanation for UI
    priority: number;         // for sorting (high → low)
    evidenceSentenceIds: string[];
};

export type AnalyzerReportV1 = {
    version: ReportVersion;
    createdAt: string;        // ISO
    normalizedText: string;
    scores: Scores;            // single numeric overall score
    sentences: Sentence[];

    insights: Finding[];      // problems
    greenFlags: Finding[];    // positives
};
