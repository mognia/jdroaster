import type { GreenFlag, Insight, Scores, Sentence } from "./types";
import type { RuleCatalog, RuleCatalogRule } from "./rule-catalog.types";
import catalogJson from "./rule-catalog.json";

type HitBucket = {
    rule: RuleCatalogRule;
    sentenceIds: Set<string>;
};

function clamp0to100(n: number) {
    return Math.max(0, Math.min(100, n));
}

function baseScores(): Scores {
    return {
        clarity: 50,
        vagueness: 50,
        scopeCreep: 50,
        onCallInDisguise: 50,
        compensationClarity: 50
    };
}

function applyDeltas(scores: Scores, delta?: Partial<Scores>) {
    if (!delta) return;
    for (const k of Object.keys(delta) as (keyof Scores)[]) {
        scores[k] = clamp0to100(scores[k] + (delta[k] ?? 0));
    }
}

function phraseMatches(text: string, phrases: string[], ci: boolean, wordBoundary: boolean) {
    const t = ci ? text.toLowerCase() : text;
    for (const raw of phrases) {
        const p = ci ? raw.toLowerCase() : raw;
        if (!wordBoundary) {
            if (t.includes(p)) return true;
            continue;
        }
        // naive word boundary via regex escape + \b
        const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\b${escaped}\\b`, ci ? "i" : undefined);
        if (re.test(text)) return true;
    }
    return false;
}

function regexMatches(text: string, patterns: string[], flags?: string) {
    for (const p of patterns) {
        const re = new RegExp(p, flags ?? "");
        if (re.test(text)) return true;
    }
    return false;
}

function ruleMatchesSentence(rule: RuleCatalogRule, sentenceText: string): boolean {
    if (rule.mode === "phrase") {
        const m = rule.match as any;
        return phraseMatches(
            sentenceText,
            m.phrases ?? [],
            Boolean(m.caseInsensitive ?? true),
            Boolean(m.wordBoundary ?? false)
        );
    }

    if (rule.mode === "regex") {
        const m = rule.match as any;
        return regexMatches(sentenceText, m.patterns ?? [], m.flags);
    }

    // combo (AND)
    const m = rule.match as any;
    const must: any[] = m.mustInclude ?? [];
    return must.every((cond) => {
        if (cond.mode === "phrase") {
            return phraseMatches(
                sentenceText,
                cond.phrases ?? [],
                Boolean(cond.caseInsensitive ?? true),
                Boolean(cond.wordBoundary ?? false)
            );
        }
        if (cond.mode === "regex") {
            return regexMatches(sentenceText, cond.patterns ?? [], cond.flags);
        }
        return false;
    });
}

function loadCatalog(): RuleCatalog {
    return catalogJson as unknown as RuleCatalog;
}

export function runRules(sentences: Sentence[]) {
    const catalog = loadCatalog();

    // bucket hits by rule.id (dedupe)
    const buckets = new Map<string, HitBucket>();

    for (const rule of catalog.rules) {
        for (const s of sentences) {
            if (!ruleMatchesSentence(rule, s.text)) continue;

            const b = buckets.get(rule.id) ?? {
                rule,
                sentenceIds: new Set<string>()
            };
            b.sentenceIds.add(s.id);
            buckets.set(rule.id, b);
        }
    }

    const scores = baseScores();
    const insights: Insight[] = [];
    const greenFlags: GreenFlag[] = [];

    for (const b of buckets.values()) {
        const rule = b.rule;
        const evidence = Array.from(b.sentenceIds);
        const maxEvidence = rule.maxEvidence ?? 8;
        const evidenceSentenceIds = evidence.slice(0, maxEvidence);

        applyDeltas(scores, rule.scoreDelta);

        const kind = rule.kind ?? "insight";

        if (kind === "greenFlag") {
            greenFlags.push({
                id: `gf_${rule.id}`,
                type: rule.type as never,
                title: rule.title,
                explanation: rule.explanation,
                evidenceSentenceIds
            });
        } else {
            insights.push({
                id: `in_${rule.id}`,
                type: rule.type as never,
                title: rule.title,
                severity: rule.severity ?? "info",
                explanation: rule.explanation,
                evidenceSentenceIds
            });
        }
    }

    // Optional: add a fallback compensation-missing insight if salary_present did not trigger
    const hasSalaryGreenFlag = greenFlags.some((g) => g.type === "salary_range_present");
    if (!hasSalaryGreenFlag) {
        insights.push({
            id: "in_comp_missing",
            type: "compensation",
            title: "Compensation not clearly stated",
            severity: "warn",
            explanation:
                "No obvious salary range or compensation details were detected. This often increases negotiation ambiguity.",
            evidenceSentenceIds: []
        });
        applyDeltas(scores, { compensationClarity: -15, clarity: -5 });
    }

    return { scores, insights, greenFlags };
}
