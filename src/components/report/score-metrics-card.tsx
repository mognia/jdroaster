import { Card, CardContent } from "@/components/ui/card";
import { clampScore, displayScore, invertScore, scoreLabel, scoreToneClass } from "@/lib/score-ui";
import { Scores } from "@/lib/types/types";

type MetricDef = {
    key: keyof Scores;
    label: string;
    // if true: higher raw score = worse, so invert for display/label
    isRisk: boolean;
};

const METRICS: MetricDef[] = [
    { key: "clarity", label: "Clarity", isRisk: false },
    { key: "vagueness", label: "Specificity", isRisk: true },
    { key: "scopeCreep", label: "Focused scope", isRisk: true },
    { key: "compensationClarity", label: "Compensation clarity", isRisk: false },
];

export function ScoreMetricsCard({ scores }: { scores: Scores }) {
    return (
        <Card className="border-muted/60">
            <CardContent className="p-5 md:p-6 space-y-4">
                <div className="space-y-1">
                    <div className="text-sm font-medium">Scores</div>
                    <div className="text-xs text-muted-foreground">
                        Dimension scores from deterministic rules, 0–100, higher is better.
                    </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {METRICS.map((m) => {
                        // engine already provides 0..100
                        const raw100 = clampScore(Number(scores[m.key] ?? 0));

                        // show "quality" everywhere so "higher is better" is always true
                        const quality100 = m.isRisk ? invertScore(raw100) : raw100;

                        const shown = displayScore(quality100);
                        const label = scoreLabel(quality100);
                        const tone = scoreToneClass(label);

                        return (
                            <div
                                key={String(m.key)}
                                className="rounded-lg border border-muted/60 p-4 flex items-center justify-between"
                            >
                                <div className="space-y-1">
                                    <div className="text-sm font-medium">{m.label}</div>
                                    <div className="text-xs text-muted-foreground">higher is better</div>
                                </div>

                                <div className="flex flex-col items-end gap-2">
                                    <div className="text-2xl font-semibold tabular-nums">{shown} / 100</div>
                                    <span className={`px-2 py-1 rounded-md text-xs font-medium ${tone}`}>
                    {label}
                  </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
