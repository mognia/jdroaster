import {Finding, Sentence} from "@/lib/types/report.types";

export function byPriorityDesc(a: Finding, b: Finding): number {
    return b.priority - a.priority;
}

export function sentenceByIdMap(sentences: Sentence[]): Map<string, Sentence> {
    const m = new Map<string, Sentence>();
    for (const s of sentences) m.set(s.id, s);
    return m;
}

export function clampScore(score: number): number {
    if (!Number.isFinite(score)) return 0;
    if (score < 0) return 0;
    if (score > 100) return 100;
    return Math.round(score);
}

export function evidenceDomId(sentenceId: string): string {
    return `s-${sentenceId}`;
}
