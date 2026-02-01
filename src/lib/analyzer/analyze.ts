import { normalizeText } from "./normalize";
import { splitIntoSentences } from "./sentences";
import { runRules } from "./rules";
import type { Report, RoleBreakdown } from "../types/types";

function makeReportId() {
    // deterministic-ish local ID, good enough until DB step
    return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function roleBreakdownStub(): RoleBreakdown {
    // placeholder
    return {
        frontend: 20,
        backend: 20,
        devops: 20,
        product: 20,
        supportOnCall: 20,
    };
}

export function analyzeText(rawText: string): Report {
    const normalizedText = normalizeText(rawText);
    const sentences = splitIntoSentences(normalizedText);
    const { scores, insights, greenFlags } = runRules(sentences);

    return {
        id: makeReportId(),
        createdAt: new Date().toISOString(),
        normalizedText,
        sentences,
        scores,
        insights,
        greenFlags,
        roleBreakdown: roleBreakdownStub(),
    };
}
