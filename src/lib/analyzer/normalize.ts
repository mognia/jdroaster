export function normalizeText(input: string): string {
    // deterministic, minimal normalization, preserve indices reasonably well
    return input
        .replace(/\r\n/g, "\n")
        .replace(/\t/g, " ")
        .replace(/[ ]{2,}/g, " ")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}
