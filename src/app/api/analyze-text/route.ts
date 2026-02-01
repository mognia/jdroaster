import { NextResponse } from "next/server";
import { analyzeText } from "@/lib/analyzer/analyze";
import {REPORT_VERSION} from "@/lib/types/report.types";

export const runtime = "nodejs";

type Body = {
    rawText?: string;
};

export async function POST(req: Request) {
    let body: Body;
    try {
        body = (await req.json()) as Body;
    } catch {
        return NextResponse.json(
            { ok: false, error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const rawText = (body.rawText ?? "").toString();

    if (rawText.trim().length < 40) {
        return NextResponse.json(
            { ok: false, error: "rawText must be at least 40 characters" },
            { status: 400 }
        );
    }

    const report = analyzeText(rawText);

    return NextResponse.json({ ok: true,   ...report,
        version: REPORT_VERSION,
        createdAt: new Date().toISOString(), });
}
