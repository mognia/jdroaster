import type { GreenFlag, Insight, Scores, Sentence } from "../types/types";
import type { RuleCatalog, RuleCatalogRule } from "../types/rule-catalog.types";
import catalogJson from "./rule-catalog.json";

/**
 * JD Roaster — runRules (refactored)
 *
 * - Per-bucket scoring with severity weights, diminishing returns, and cluster multipliers
 * - Contradiction and imbalance detection (catalog-agnostic defaults)
 * - Richer receipts: evidenceSummary and bucketScore included (kept as `any` to avoid strict type drift)
 * - Backwards-compatible with existing rule-catalog.json structure
 *
 * Drop-in replacement for the previous runRules implementation.
 */

/* ----------------------------- Basic utilities ---------------------------- */

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

/* ----------------------------- Matching helpers --------------------------- */

/**
 * Phrase matching helper
 * - ci: case-insensitive
 * - wordBoundary: require word boundaries around phrase
 */
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

/* ----------------------------- Catalog helpers ---------------------------- */

function loadCatalog(): RuleCatalog {
    return catalogJson as unknown as RuleCatalog;
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

/* --------------------------- Scoring building blocks ---------------------- */

/**
 * Map severity to a weight used in bucket scoring.
 * Tunable: info=0.5, warn=1, high=2
 */
function severityWeight(sev: Insight["severity"]) {
    if (sev === "high") return 2;
    if (sev === "warn") return 1;
    return 0.5;
}

/**
 * Diminishing returns for evidence count.
 * Uses 1 - exp(-n / tau) so the first hits matter most.
 */
function evidenceDiminishingWeight(n: number, tau = 2) {
    if (n <= 0) return 0;
    return 1 - Math.exp(-n / tau);
}

/**
 * Small cluster multiplier when evidence items are adjacent or near each other.
 * - windowDistance: how many sentence gaps count as "same cluster" (default 2)
 * - returns >= 1
 */
function clusterMultiplier(sentenceIds: string[], sentenceIndexById: Map<string, number>, windowDistance = 2) {
    if (sentenceIds.length <= 1) return 1;
    const idxs = sentenceIds.map((id) => sentenceIndexById.get(id) ?? 0).sort((a, b) => a - b);
    let clusters = 1;
    for (let i = 1; i < idxs.length; i++) {
        if (idxs[i] - idxs[i - 1] > windowDistance) clusters++;
    }
    const avgClusterSize = sentenceIds.length / clusters;
    // small boost per extra evidence in cluster; tuned to be modest
    return 1 + 0.2 * Math.max(0, avgClusterSize - 1);
}

/**
 * Compute per-bucket delta from rule.scoreDelta (backwards-compatible).
 * - Uses severity, evidence diminishing weight, cluster multiplier
 * - Caps per-rule absolute impact to maxPerRuleImpact (default 25)
 */
function computeBucketDelta(
    rule: RuleCatalogRule,
    evidenceCount: number,
    sentenceIds: string[],
    sentenceIndexById: Map<string, number>
) {
    const base = (rule.scoreDelta ?? {}) as Partial<Scores>;
    const sev = (rule.severity ?? "info") as Insight["severity"];
    const w_s = severityWeight(sev);
    const tau = (rule as any).tau ?? 2;
    const w_n = evidenceDiminishingWeight(evidenceCount, tau);
    const cm = clusterMultiplier(sentenceIds, sentenceIndexById, (rule as any).clusterWindow ?? 2);
    const bucketScore = Math.min(3, w_s * w_n * cm); // cap to avoid runaway
    const maxPerRuleImpact = (rule as any).maxPerRuleImpact ?? 25;

    const delta: Partial<Scores> = {};
    for (const k of Object.keys(base) as (keyof Scores)[]) {
        const full = base[k] ?? 0;
        // scale the base delta by bucketScore and cap absolute effect
        const raw = Math.round(full * bucketScore);
        const capped = Math.max(-maxPerRuleImpact, Math.min(maxPerRuleImpact, raw));
        delta[k] = capped;
    }

    return { delta, bucketScore };
}

/* --------------------------- runRules (main) ------------------------------ */

export function runRules(sentences: Sentence[]) {
    const catalog = loadCatalog();

    // Precompute excludes per rule (by sentence index)
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

    // Build buckets of evidence per rule
    const buckets = new Map<string, Bucket>();

    for (const rule of catalog.rules) {
        const excludeIdx = excludeIndexByRuleId.get(rule.id) ?? new Set<number>();
        const scope = rule.excludeScope ?? "sentence";
        const win = Math.max(0, rule.excludeWindow ?? 2);

        // document-scope exclude: if any exclude match exists anywhere, skip rule entirely
        if (scope === "document" && excludeIdx.size > 0) continue;

        for (let i = 0; i < sentences.length; i++) {
            const s = sentences[i];

            // sentence-scope exclude: skip this sentence entirely if it contains exclude
            if (scope === "sentence" && excludeIdx.has(i)) continue;

            const res = ruleMatchesSentence(rule, s.text);
            if (!res.matched) continue;

            // window-scope exclude: block match if any exclude occurs nearby
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

    // Prepare outputs
    const scores = baseScores();
    const insights: Insight[] = [];
    const greenFlags: GreenFlag[] = [];

    // Order buckets by priority then id for stable processing
    const orderedBuckets = Array.from(buckets.values()).sort((a, b) => {
        const ap = a.rule.priority ?? 0;
        const bp = b.rule.priority ?? 0;
        if (bp !== ap) return bp - ap;
        return a.rule.id.localeCompare(b.rule.id);
    });

    // Apply per-bucket scoring
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

        const evidenceCount = evidenceSentenceIds.length;
        const { delta: bucketDelta, bucketScore } = computeBucketDelta(rule, evidenceCount, evidenceSentenceIds, sentenceIndexById);

        // Apply computed delta (backwards-compatible)
        applyDeltas(scores, bucketDelta);

        const kind = rule.kind ?? "insight";

        // Build evidence summary for receipts
        const evidenceSummary = {
            count: evidenceCount,
            clustered: clusterMultiplier(evidenceSentenceIds, sentenceIndexById) > 1,
            strongest: evidenceSentenceIds[0] ?? null,
        };

        if (kind === "greenFlag") {
            // attach bucketScore and evidenceSummary as extra fields (cast to any to avoid type mismatch)
            greenFlags.push({
                id: `gf_${rule.id}`,
                type: rule.type as never,
                title: rule.title,
                explanation: rule.explanation,
                evidenceSentenceIds,
                // extras for UI/receipts
                ...( { bucketScore, evidenceSummary } as any ),
            } as GreenFlag);
        } else {
            insights.push({
                id: `in_${rule.id}`,
                type: rule.type as never,
                title: rule.title,
                severity: rule.severity ?? "info",
                explanation: rule.explanation,
                evidenceSentenceIds,
                ...( { bucketScore, evidenceSummary } as any ),
            } as Insight);
        }
    }

    /* ---------------------- Post-pass: contradictions & imbalance ---------------------- */

    // Contradiction detection using optional `contradicts` arrays in rules
    for (const b of buckets.values()) {
        const rule = b.rule as any;
        if (!rule.contradicts || !Array.isArray(rule.contradicts)) continue;
        for (const otherId of rule.contradicts) {
            if (!buckets.has(otherId)) continue;
            // both rules present -> small penalty proportional to lower severity
            const otherBucket = buckets.get(otherId)!;
            const sevA = severityWeight(rule.severity ?? "info");
            const sevB = severityWeight((otherBucket.rule as any).severity ?? "info");
            const penalty = -Math.round(5 * Math.min(sevA, sevB)); // tuned small penalty
            applyDeltas(scores, { clarity: penalty, scopeCreep: Math.min(-2, penalty) });
            // add a combined insight for contradiction
            insights.push({
                id: `in_contradiction_${rule.id}_${otherId}`,
                type: "contradiction" as never,
                title: `Contradictory statements detected: ${rule.id} vs ${otherId}`,
                severity: "warn",
                explanation: `This job description contains statements that conflict with each other.`,
                evidenceSentenceIds: Array.from(new Set([...b.sentenceIds, ...otherBucket.sentenceIds])).slice(0, 6),
            } as Insight);
        }
    }

    // Imbalance detection (catalog-agnostic heuristic)
    // - Count responsibility-like hits and support-like hits
    const responsibilityBucketCount = Array.from(buckets.values()).reduce((acc, b) => {
        const id = b.rule.id.toLowerCase();
        const t = (b.rule.type ?? "").toString().toLowerCase();
        if (id.includes("responsib") || t.includes("responsib") || id.includes("responsibilities")) return acc + b.sentenceIds.size;
        return acc;
    }, 0);

    const supportBucketCount = Array.from(buckets.values()).reduce((acc, b) => {
        const id = b.rule.id.toLowerCase();
        const t = (b.rule.type ?? "").toString().toLowerCase();
        if (id.includes("team") || id.includes("support") || t.includes("team") || t.includes("support")) return acc + b.sentenceIds.size;
        return acc;
    }, 0);

    if (responsibilityBucketCount >= 6 && supportBucketCount === 0) {
        applyDeltas(scores, { scopeCreep: -10, clarity: -5 });
        insights.push({
            id: "in_imbalance_responsibilities",
            type: "scope" as never,
            title: "Many responsibilities listed with no support or resources",
            severity: "warn",
            explanation: "The role lists many responsibilities but provides no signals about team size, reporting, or support.",
            evidenceSentenceIds: Array.from(buckets.values())
                .filter((b) => {
                    const id = b.rule.id.toLowerCase();
                    const t = (b.rule.type ?? "").toString().toLowerCase();
                    return id.includes("responsib") || t.includes("responsib") || id.includes("responsibilities");
                })
                .flatMap((b) => Array.from(b.sentenceIds))
                .slice(0, 8),
        } as Insight);
    }

    /* ---------------------- Fallback: compensation missing ---------------------- */

    const hasSalary = greenFlags.some((g) => g.type === "salary_range_present");
    if (!hasSalary) {
        insights.push({
            id: "in_comp_missing",
            type: "compensation" as never,
            title: "Compensation not clearly stated",
            severity: "warn",
            explanation:
                "No obvious salary range or compensation details were detected. This often increases negotiation ambiguity.",
            evidenceSentenceIds: [],
            ...( { bucketScore: 1, evidenceSummary: { count: 0, clustered: false, strongest: null } } as any ),
        } as Insight);
        // reduce compensationClarity but respect existing computed deltas
        scores.compensationClarity = Math.min(scores.compensationClarity, 30);
    }

    /* ---------------------- Final ordering and stable output ---------------------- */

    function severityRank(s: Insight["severity"]) {
        if (s === "high") return 3;
        if (s === "warn") return 2;
        return 1;
    }

    insights.sort((a, b) => {
        const sr = severityRank(b.severity) - severityRank(a.severity);
        if (sr !== 0) return sr;
        return a.id.localeCompare(b.id);
    });

    // Ensure scores are clamped 0..100
    for (const k of Object.keys(scores) as (keyof Scores)[]) {
        scores[k] = clamp0to100(scores[k]);
    }

    return { scores, insights, greenFlags };
}
