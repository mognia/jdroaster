import type { GreenFlagType, InsightSeverity, InsightType, Scores } from "./types";

export type RuleKind = "insight" | "greenFlag";

export type PhraseMatch = {
    phrases: string[];
    caseInsensitive?: boolean;
    wordBoundary?: boolean;
};

export type RegexMatch = {
    patterns: string[];
    flags?: string; // "i", "ig", etc.
};

export type ComboMatch = {
    mustInclude: Array<
        | { mode: "phrase"; phrases: string[]; caseInsensitive?: boolean; wordBoundary?: boolean }
        | { mode: "regex"; patterns: string[]; flags?: string }
    >;
};

export type RuleCatalogRule = {
    id: string;
    group: string;

    kind?: RuleKind; // default "insight"
    type: InsightType | GreenFlagType;

    title: string;
    explanation: string;

    severity?: InsightSeverity; // required for insights
    scoreDelta?: Partial<Scores>;
    maxEvidence?: number;
    priority?: number; // higher first
    exclude?: {
        phrases?: string[];
        patterns?: string[];
        flags?: string;
    };
    excludeScope?: "sentence" | "document" | "window";
    excludeWindow?: number; // used only for window scope
    mode: "phrase" | "regex" | "combo";
    match: PhraseMatch | RegexMatch | ComboMatch;
};

export type RuleCatalog = {
    rules: RuleCatalogRule[];
};
