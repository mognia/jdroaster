import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { clampScore, scoreLabel } from "@/lib/report-utils";

export function ScoreCard({ score }: { score: number }) {
    const s = clampScore(score);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Overall score</CardTitle>
            </CardHeader>
            <CardContent className="flex items-baseline justify-between gap-4">
                <div className="text-4xl font-semibold tabular-nums">{s}</div>
                <div className="text-sm text-muted-foreground">{scoreLabel(s)}</div>
            </CardContent>
        </Card>
    );
}
