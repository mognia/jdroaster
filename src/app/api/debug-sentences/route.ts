import { NextResponse } from "next/server";
import { normalizeText } from "@/lib/analyzer/normalize";
import { splitIntoSentences } from "@/lib/analyzer/sentences";

export const runtime = "nodejs";

export async function POST(req: Request) {
    const body = (await req.json()) as { rawText?: string };
    const normalizedText = normalizeText(body.rawText ?? "");
    const sentences = splitIntoSentences(normalizedText);
    return NextResponse.json({ ok: true, normalizedText, sentences });
}
