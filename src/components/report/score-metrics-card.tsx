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
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-950 flex justify-between items-center">
                <span className="text-[11px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Health Metrics</span>
                <span className="text-[10px] font-mono text-zinc-600 italic">V1.0_DETERMINISTIC</span>
            </div>

            <div className="grid grid-cols-2 gap-px bg-zinc-800">
                {METRICS.map((m) => {
                    const raw100 = clampScore(Number(scores[m.key] ?? 0));
                    const quality100 = m.isRisk ? invertScore(raw100) : raw100;
                    const shown = displayScore(quality100);
                    const label = scoreLabel(quality100);

                    return (
                        <div key={m.key} className="bg-zinc-900 p-4 space-y-3">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-tight">{m.label}</span>
                                <span className="text-xl font-black font-mono tracking-tighter text-zinc-100">{shown}%</span>
                            </div>

                            {/* Simple Progress Bar */}
                            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className={`h-full transition-all duration-1000 ${
                                        quality100 > 70 ? "bg-emerald-500" : quality100 > 40 ? "bg-orange-500" : "bg-rose-600"
                                    }`}
                                    style={{ width: `${quality100}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest">{label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
