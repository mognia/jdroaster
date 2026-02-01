import type { Sentence } from "../types/types";

function makeId(i: number) {
    return `s_${i.toString(36)}`;
}

function isWs(ch: string) {
    return ch === " " || ch === "\n" || ch === "\t" || ch === "\r";
}

function trimSpan(text: string, start: number, end: number) {
    let s = start;
    let e = end;

    while (s < e && isWs(text[s])) s++;
    while (e > s && isWs(text[e - 1])) e--;

    return { s, e };
}

function isBulletLine(line: string) {
    const t = line.trimStart();
    return (
        t.startsWith("- ") ||
        t.startsWith("* ") ||
        t.startsWith("• ") ||
        /^\d{1,2}[.)]\s+/.test(t) ||
        /^\([a-zA-Z]\)\s+/.test(t)
    );
}

function isHeadingLine(line: string) {
    const t = line.trim();
    // headings like "Responsibilities:" or "Requirements:" or "Nice to have:"
    if (t.length >= 3 && t.length <= 60 && t.endsWith(":")) return true;
    // headings in ALL CAPS (common JDs)
    if (t.length >= 3 && t.length <= 60 && /^[A-Z0-9\s/&-]+$/.test(t)) return true;
    return false;
}

function hasIntlSegmenter(): boolean {
    return typeof Intl !== "undefined" && typeof (Intl as any).Segmenter === "function";
}

function segmentSentencesIntl(text: string): Array<{ start: number; end: number }> {
    const seg = new (Intl as any).Segmenter("en", { granularity: "sentence" });
    const out: Array<{ start: number; end: number }> = [];
    for (const part of seg.segment(text)) {
        // part.index is start
        const start = part.index as number;
        const end = start + (part.segment as string).length;
        out.push({ start, end });
    }
    return out;
}

function segmentSentencesFallback(text: string): Array<{ start: number; end: number }> {
    // basic but okay fallback if Intl.Segmenter isn't present
    const spans: Array<{ start: number; end: number }> = [];
    let start = 0;

    for (let i = 0; i < text.length - 1; i++) {
        const ch = text[i];
        const next = text[i + 1];

        const endPunct = ch === "." || ch === "!" || ch === "?";
        const nextWs = isWs(next);

        if (endPunct && nextWs) {
            spans.push({ start, end: i + 1 });
            start = i + 1;
        }
    }

    if (start < text.length) spans.push({ start, end: text.length });
    return spans;
}

type Unit = { start: number; end: number; kind: "bullet" | "heading" | "text" };

function buildUnits(normalizedText: string): Unit[] {
    // Create units by scanning lines, treating bullets/headings as separate units,
    // and grouping normal lines into paragraphs.
    const text = normalizedText;
    const units: Unit[] = [];

    let i = 0;
    let paraStart: number | null = null;

    const flushPara = (endIdx: number) => {
        if (paraStart === null) return;
        if (endIdx > paraStart) units.push({ start: paraStart, end: endIdx, kind: "text" });
        paraStart = null;
    };

    const nextLine = (from: number) => {
        const nl = text.indexOf("\n", from);
        if (nl === -1) return { lineStart: from, lineEnd: text.length };
        return { lineStart: from, lineEnd: nl };
    };

    while (i < text.length) {
        const { lineStart, lineEnd } = nextLine(i);
        const lineRaw = text.slice(lineStart, lineEnd);
        const lineTrim = lineRaw.trim();

        const isBlank = lineTrim.length === 0;
        const bullet = !isBlank && isBulletLine(lineRaw);
        const heading = !isBlank && isHeadingLine(lineRaw);

        if (isBlank) {
            flushPara(lineStart);
            i = lineEnd + 1;
            continue;
        }

        if (heading) {
            flushPara(lineStart);
            units.push({ start: lineStart, end: lineEnd, kind: "heading" });
            i = lineEnd + 1;
            continue;
        }

        if (bullet) {
            flushPara(lineStart);
            units.push({ start: lineStart, end: lineEnd, kind: "bullet" });
            i = lineEnd + 1;
            continue;
        }

        // normal text line, start or continue paragraph
        if (paraStart === null) paraStart = lineStart;

        // if next line is blank, paragraph ends at this lineEnd
        const nextIdx = lineEnd + 1;
        if (nextIdx >= text.length) {
            flushPara(text.length);
            break;
        }
        const nextNl = text.indexOf("\n", nextIdx);
        const nextLineEnd = nextNl === -1 ? text.length : nextNl;
        const nextLineRaw = text.slice(nextIdx, nextLineEnd);
        if (nextLineRaw.trim().length === 0) {
            flushPara(lineEnd);
        }

        i = lineEnd + 1;
    }

    // if paragraph open at end
    if (paraStart !== null) flushPara(text.length);

    return units;
}

export function splitIntoSentences(normalizedText: string): Sentence[] {
    const text = normalizedText;
    const units = buildUnits(text);

    const useIntl = hasIntlSegmenter();
    const sentences: Sentence[] = [];
    let idx = 0;

    for (const u of units) {
        const { s, e } = trimSpan(text, u.start, u.end);
        if (e <= s) continue;

        const unitSlice = text.slice(s, e);

        // headings and bullets are already “atomic” units
        if (u.kind === "heading" || u.kind === "bullet") {
            // For bullets, strip the leading bullet marker in displayed text, but keep indices accurate.
            // We keep indices accurate by trimming only whitespace, not removing characters.
            const cleaned = unitSlice.length ? unitSlice : "";
            if (cleaned.trim().length < 2) continue;

            sentences.push({
                id: makeId(idx++),
                text: cleaned,
                start: s,
                end: e,
            });
            continue;
        }

        // For text units, sentence-segment the slice.
        const localSpans = useIntl ? segmentSentencesIntl(unitSlice) : segmentSentencesFallback(unitSlice);

        for (const sp of localSpans) {
            const absStart = s + sp.start;
            const absEnd = s + sp.end;

            const trimmed = trimSpan(text, absStart, absEnd);
            if (trimmed.e <= trimmed.s) continue;

            const segText = text.slice(trimmed.s, trimmed.e);
            // skip microscopic fragments
            if (segText.trim().length < 2) continue;

            sentences.push({
                id: makeId(idx++),
                text: segText,
                start: trimmed.s,
                end: trimmed.e,
            });
        }
    }

    return sentences;
}
