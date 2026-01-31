import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type HighlightedTextProps = {
    text: string;
};

export default function HighlightedText({ text }: HighlightedTextProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-base">Original text</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="whitespace-pre-wrap rounded-md border bg-muted/30 p-3 font-mono text-sm leading-relaxed">
                    {text}
                </div>
            </CardContent>
        </Card>
    );
}
