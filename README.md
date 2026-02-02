# jdRoaster

jdRoaster is a deterministic job description analyzer that flags risks and signals in job ads using explicit, rule-based logic with sentence-level evidence (“receipts”).

This is not an AI app.

## What problem it solves

Job descriptions often hide important details behind vague language:
- On-call expectations
- Missing compensation info
- Scope creep
- Experience gatekeeping
- Ambiguous responsibilities

jdRoaster surfaces these signals clearly and shows exactly where they appear in the text.

## Why deterministic rules (not AI)

- Results are explainable and repeatable
- Every insight maps to a known rule
- Every rule points to exact sentences
- No hallucinations, no probabilistic guesses

If jdRoaster flags something, you can see the sentence that triggered it.

## How sentence-level evidence works

1. The job description is normalized
2. It is split into sentence units with stable start/end indices
3. Rules match phrases or patterns against those sentences
4. Matched sentences are highlighted using index ranges, not fuzzy matching

All highlighting is index-based and deterministic.

## What jdRoaster does NOT do (by design)

- No web scraping
- No URL ingestion
- No user accounts
- No persistence beyond sessionStorage
- No sharing links
- No diff mode
- No AI-generated analysis

This is a focused demo, not a production product.

## Known limitations

- Rules are only as good as the catalog
- Ambiguous wording can still evade detection
- Scoring is heuristic, not absolute truth
- Results are session-local and not saved

## Tech stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

## Status

M2 complete. Project frozen.
