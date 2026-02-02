export type ScoreLabel = "Good" | "Mixed" | "Risky" | "High risk";

/**
 * Clamp to [0..100]. Keeps decimals, do NOT round here.
 * Round only for display, otherwise your thresholds get distorted.
 */
export function clampScore(score: number): number {
    if (!Number.isFinite(score)) return 0;
    return Math.min(100, Math.max(0, score));
}

/** Use this anywhere you render a score number in the UI. */
export function displayScore(score: number): number {
    return Math.round(clampScore(score));
}

/**
 * Label thresholds tuned so "Good" is earned, not handed out.
 * If you later change your scoring distribution, adjust these first.
 */
export function scoreLabel(score: number): ScoreLabel {
    const s = clampScore(score);
    if (s >= 75) return "Good";
    if (s >= 50) return "Mixed";
    if (s >= 30) return "Risky";
    return "High risk";
}

/**
 * Normalize any accumulated metric (can be negative or exceed max) into [0..100].
 * Use this before inverting or labeling risk buckets.
 */
export function normalizeTo100(value: number, maxAbsOrMax: number): number {
    if (!Number.isFinite(value) || !Number.isFinite(maxAbsOrMax) || maxAbsOrMax <= 0) return 0;
    const scaled = (value / maxAbsOrMax) * 100;
    return clampScore(scaled);
}

/**
 * For “risk metrics” where higher = worse.
 * IMPORTANT: pass the metric's max (or expected max) so the inversion is meaningful.
 *
 * Example:
 *   invertRisk(report.scores.onCallInDisguise, 40)
 *   invertRisk(report.scores.scopeCreep, 50)
 */
export function invertRisk(riskValue: number, riskMax: number): number {
    const normalized = normalizeTo100(riskValue, riskMax);
    return 100 - normalized;
}

/**
 * Backward compatible helper.
 * Only safe when the input is already a normalized [0..100] score.
 */
export function invertScore(score: number): number {
    const s = clampScore(score);
    return 100 - s;
}

// Tailwind-ish classes (shadcn-friendly)
export function scoreToneClass(label: ScoreLabel): string {
    switch (label) {
        case "Good":
            return "bg-emerald-500/15 text-emerald-700 ring-1 ring-emerald-600/30 dark:text-emerald-300";
        case "Mixed":
            return "bg-yellow-500/15 text-yellow-800 ring-1 ring-yellow-600/30 dark:text-yellow-300";
        case "Risky":
            return "bg-orange-500/15 text-orange-800 ring-1 ring-orange-600/30 dark:text-orange-300";
        case "High risk":
        default:
            return "bg-red-500/15 text-red-800 ring-1 ring-red-600/30 dark:text-red-300";
    }
}

/**
 * Convenience, common usage in UI:
 * const s = displayScore(overall)
 * const label = scoreLabel(overall)
 * const tone = scoreToneClass(label)
 */
export function scoreUi(overallScore: number): { score: number; label: ScoreLabel; toneClass: string } {
    const score = displayScore(overallScore);
    const label = scoreLabel(score);
    const toneClass = scoreToneClass(label);
    return { score, label, toneClass };
}
