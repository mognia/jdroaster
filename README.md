# JD Roaster
**Job Description Linter with Receipts**

JD Roaster is an opinionated tool that analyzes job descriptions and highlights clarity, risk, and hiring red flags, with exact textual evidence.

Think **ESLint for job posts**, not career advice, not vibes, not AI guessing.

---

## Why This Exists

Applying for jobs is expensive, not financially, but in time, focus, and emotional energy.

Modern job descriptions often:
- Inflate responsibilities to hedge hiring risk
- Hide critical expectations behind vague language
- Omit compensation while demanding senior-level ownership
- Normalize unpaid on-call, overtime, or “flexibility”
- Read like marketing copy instead of an actual role definition

Candidates are expected to decode all of this implicitly, during interviews, after investing hours.

JD Roaster exists to **shift clarity earlier**.

It treats job descriptions as **technical artifacts**, not promises:
- If it’s written clearly, it’s rewarded
- If it’s vague, it’s flagged
- If expectations are hidden, it’s exposed
- If compensation is real, it’s acknowledged

No mind reading. No intent inference. Just text, analyzed consistently.

The goal is not to shame companies, but to help candidates **decide faster, with evidence**.

---

## What Problem It Solves

Job descriptions are often:
- Vague by design
- Overloaded with responsibilities
- Missing compensation details
- Hiding on-call or overtime expectations
- Written by marketing, not engineering

JD Roaster helps candidates **evaluate a job before applying**, using deterministic rules and transparent logic.

---

## Core Features

### 🔍 Sentence-Level Analysis
- Breaks job descriptions into structured sentence units
- Preserves original text and indices for precise highlighting

### 🚩 Red Flags (with receipts)
Detects patterns such as:
- Hidden on-call expectations
- Scope creep and “wear many hats”
- Vague responsibilities and clichés
- Senior expectations without senior clarity
- Boundary violations (hours, availability, urgency)

Each finding is linked to the **exact sentence** that triggered it.

### ✅ Green Flags
Rewards clarity, including:
- Explicit salary or compensation ranges
- Clear scope and responsibilities
- Defined work hours or expectations
- Transparent remote or location policies

### 📊 Deterministic Scoring
- Starts from a neutral baseline
- Adjusted only by rule matches
- No randomness, no ML noise
- Same input always produces the same result

### 🧾 Receipts-First UI
- Click a finding → scrolls to the exact sentence
- Click a sentence → highlights the related finding
- Full transparency, no black-box logic

---

## What JD Roaster Is **Not**

- ❌ Not an AI career coach
- ❌ Not a company ranking system
- ❌ Not resume advice
- ❌ Not scraping or guessing intent

JD Roaster performs **text analysis only**, based on what is actually written.

If it’s not in the JD, it doesn’t exist.

---

## Tech Stack

- **Next.js** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**
- Deterministic rule engine (JSON-driven)

---

## Architecture Overview

### Analyzer Pipeline
1. Normalize input text
2. Split into JD-aware sentence units
3. Run rule catalog (phrase / regex / combo)
4. Apply priorities and exclude scopes
5. Produce a deterministic report JSON

### Rule Engine
- Rules defined in JSON
- Supports:
    - Priority ordering
    - Green flags vs warnings
    - Sentence, window, and document-level excludes
- Deduplicated insights with aggregated evidence

The system is:
- Auditable
- Extendable
- Predictable

---

## Example Use Cases

- Decide whether a role is worth applying to
- Compare multiple job descriptions objectively
- Spot red flags before interviews
- Learn what well-written job descriptions look like
- Sanity-check “too good to be true” postings

---

## Philosophy

JD Roaster is intentionally opinionated:

- Clarity is good

- Vagueness is a risk

- Compensation opacity is a red flag

- Good hiring teams write clear job descriptions
---
**If a job description fails JD Roaster, it doesn’t mean the company is bad.
It means you should ask better questions before investing your time.** 
---
## Local Development

```bash
git clone https://github.com/your-org/jd-roaster
cd jd-roaster
npm install
npm dev
