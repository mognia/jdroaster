import type { GreenFlag, Insight, Scores, Sentence } from "../types/types";
import type { RuleCatalog, RuleCatalogRule } from "../types/rule-catalog.types";
import catalogJson from "./rule-catalog.json";

type Bucket = {
    rule: RuleCatalogRule;
    sentenceIds: Set<string>;
    why: Map<string, string[]>; // sentenceId -> matched tokens/patterns (optional)
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
        compensationClarity: 50,
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
            if (t.includes(p)) return { matched: true, token: raw };
            continue;
        }
        const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`\\b${escaped}\\b`, ci ? "i" : undefined);
        if (re.test(text)) return { matched: true, token: raw };
    }
    return { matched: false as const };
}

function regexMatches(text: string, patterns: string[], flags?: string) {
    for (const p of patterns) {
        const re = new RegExp(p, flags ?? "");
        if (re.test(text)) return { matched: true, token: p };
    }
    return { matched: false as const };
}

function matchesExclude(rule: RuleCatalogRule, text: string) {
    if (!rule.exclude) return false;

    const ex = rule.exclude;

    if (ex.phrases && ex.phrases.length) {
        const res = phraseMatches(text, ex.phrases, true, false);
        if (res.matched) return true;
    }

    if (ex.patterns && ex.patterns.length) {
        const res = regexMatches(text, ex.patterns, ex.flags);
        if (res.matched) return true;
    }

    return false;
}

function ruleMatchesSentence(rule: RuleCatalogRule, sentenceText: string) {

    if (rule.mode === "phrase") {
        const m: any = rule.match;
        return phraseMatches(
            sentenceText,
            m.phrases ?? [],
            Boolean(m.caseInsensitive ?? true),
            Boolean(m.wordBoundary ?? false)
        );
    }

    if (rule.mode === "regex") {
        const m: any = rule.match;
        return regexMatches(sentenceText, m.patterns ?? [], m.flags);
    }

    // combo AND
    const m: any = rule.match;
    const must: any[] = m.mustInclude ?? [];

    const tokens: string[] = [];
    for (const cond of must) {
        if (cond.mode === "phrase") {
            const res = phraseMatches(
                sentenceText,
                cond.phrases ?? [],
                Boolean(cond.caseInsensitive ?? true),
                Boolean(cond.wordBoundary ?? false)
            );
            if (!res.matched) return { matched: false as const };
            tokens.push(res.token);
            continue;
        }
        if (cond.mode === "regex") {
            const res = regexMatches(sentenceText, cond.patterns ?? [], cond.flags);
            if (!res.matched) return { matched: false as const };
            tokens.push(res.token);
            continue;
        }
        return { matched: false as const };
    }

    return { matched: true as const, token: tokens.join(" + ") };
}

function loadCatalog(): RuleCatalog {
    return catalogJson as unknown as RuleCatalog;
}

function severityRank(s: Insight["severity"]) {
    if (s === "high") return 3;
    if (s === "warn") return 2;
    return 1;
}

export function runRules(sentences: Sentence[]) {
    const catalog = loadCatalog();

    // Precompute which sentence indices match excludes per rule
    const excludeIndexByRuleId = new Map<string, Set<number>>();
    for (const rule of catalog.rules) {
        const set = new Set<number>();
        for (let i = 0; i < sentences.length; i++) {
            if (matchesExclude(rule, sentences[i].text)) set.add(i);
        }
        excludeIndexByRuleId.set(rule.id, set);
    }

    const sentenceIdSet = new Set(sentences.map((s) => s.id));
    const sentenceIndexById = new Map<string, number>();
    for (let i = 0; i < sentences.length; i++) sentenceIndexById.set(sentences[i].id, i);

    const buckets = new Map<string, Bucket>();

    for (const rule of catalog.rules) {
        const excludeIdx = excludeIndexByRuleId.get(rule.id) ?? new Set<number>();
        const scope = rule.excludeScope ?? "sentence";
        const win = Math.max(0, rule.excludeWindow ?? 2);

        // document-scope exclude, if exclude exists anywhere, skip whole rule
        if (scope === "document" && excludeIdx.size > 0) continue;

        for (let i = 0; i < sentences.length; i++) {
            const s = sentences[i];

            // sentence-scope exclude, skip this sentence entirely if it contains exclude
            if (scope === "sentence" && excludeIdx.has(i)) continue;

            const res = ruleMatchesSentence(rule, s.text);
            if (!res.matched) continue;

            // window-scope exclude, block match if any exclude occurs nearby
            if (scope === "window" && excludeIdx.size > 0) {
                const from = Math.max(0, i - win);
                const to = Math.min(sentences.length - 1, i + win);

                let blocked = false;
                for (let j = from; j <= to; j++) {
                    if (excludeIdx.has(j)) {
                        blocked = true;
                        break;
                    }
                }
                if (blocked) continue;
            }

            const b =
                buckets.get(rule.id) ??
                ({
                    rule,
                    sentenceIds: new Set<string>(),
                    why: new Map<string, string[]>(),
                } as Bucket);

            b.sentenceIds.add(s.id);

            if ("token" in res && res.token) {
                const arr = b.why.get(s.id) ?? [];
                arr.push(res.token);
                b.why.set(s.id, arr);
            }

            buckets.set(rule.id, b);
        }
    }

    // turn buckets into outputs with stable ordering
    const scores = baseScores();
    const insights: Insight[] = [];
    const greenFlags: GreenFlag[] = [];

    const orderedBuckets = Array.from(buckets.values()).sort((a, b) => {
        const ap = a.rule.priority ?? 0;
        const bp = b.rule.priority ?? 0;
        if (bp !== ap) return bp - ap;
        return a.rule.id.localeCompare(b.rule.id);
    });

    for (const b of orderedBuckets) {
        const rule = b.rule;
        const maxEvidence = rule.maxEvidence ?? 8;

        const evidenceSentenceIds = Array.from(b.sentenceIds)
            .filter((id) => sentenceIdSet.has(id))
            .sort((x, y) => {
                const xi = sentenceIndexById.get(x) ?? 0;
                const yi = sentenceIndexById.get(y) ?? 0;
                return xi - yi;
            })
            .slice(0, maxEvidence);

        applyDeltas(scores, rule.scoreDelta);

        const kind = rule.kind ?? "insight";

        if (kind === "greenFlag") {
            greenFlags.push({
                id: `gf_${rule.id}`,
                type: rule.type as never,
                title: rule.title,
                explanation: rule.explanation,
                evidenceSentenceIds,
            });
        } else {
            insights.push({
                id: `in_${rule.id}`,
                type: rule.type as never,
                title: rule.title,
                severity: rule.severity ?? "info",
                explanation: rule.explanation,
                evidenceSentenceIds,
            });
        }
    }

    // fallback compensation missing, only if salary green flag absent
    const hasSalary = greenFlags.some((g) => g.type === "salary_range_present");
    if (!hasSalary) {
        insights.push({
            id: "in_comp_missing",
            type: "compensation",
            title: "Compensation not clearly stated",
            severity: "warn",
            explanation:
                "No obvious salary range or compensation details were detected. This often increases negotiation ambiguity.",
            evidenceSentenceIds: [],
        });
        scores.compensationClarity = Math.min(scores.compensationClarity, 30);
    }

    // final stable ordering for insights
    insights.sort((a, b) => {
        const sr = severityRank(b.severity) - severityRank(a.severity);
        if (sr !== 0) return sr;
        return a.id.localeCompare(b.id);
    });

    return { scores, insights, greenFlags };
}

