export type Sentence = {
    id: string;
    text: string;
    start: number;
    end: number;
}
export type ScoreKey =
    | "clarity"
    | "vagueness"
    | "scopeCreep"
    | "onCallInDisguise"
    | "compensationClarity";
export type Scores = Record<ScoreKey, number>;
export type InsightSeverity = "info" | "warn" | "high";
export type InsightType =
    | "vague_language"
    | "scope_creep"
    | "on_call"
    | "compensation"
    | "other";
export type Insight = {
    id: string;
    type: InsightType;
    title: string;
    severity: InsightSeverity;
    explanation: string;
    evidenceSentenceIds: string[];
};
export type GreenFlagType =
    | "salary_range_present"
    | "explicit_oncall_policy"
    | "clear_boundaries"
    | "focused_scope";

export type GreenFlag = {
    id: string;
    type: GreenFlagType;
    title: string;
    explanation: string;
    evidenceSentenceIds: string[];
};

export type RoleBreakdown = {
    frontend: number; // 0..100
    backend: number;
    devops: number;
    product: number;
    supportOnCall: number;
};

export type Report = {
    id: string;
    createdAt: string; // ISO
    normalizedText: string;
    sentences: Sentence[];
    scores: Scores;
    insights: Insight[];
    greenFlags: GreenFlag[];
    // roleBreakdown: RoleBreakdown;
};