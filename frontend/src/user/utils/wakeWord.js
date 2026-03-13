/**
 * wakeWord.js — Shared wake-word detection utility for NOVA 1000
 * ES module for browser/frontend use
 */

export function detectWakeWord(transcript) {
  if (!transcript || typeof transcript !== "string") {
    return { triggered: false, question: "" };
  }

  // Normalize: lowercase, collapse whitespace, trim
  const normalized = transcript.toLowerCase().trim().replace(/\s+/g, " ");

  // Pattern: handle "nova", "novo", "nora", "no va" + optional space + "1000" OR "one thousand"
  const pattern = /(?:^|\s)((?:nova|novo|nora|no\s+va)\s+(?:1000|one\s+thousand))[,.]?\s*(.*)/i;

  const match = normalized.match(pattern);
  if (!match) return { triggered: false, question: "" };

  return { triggered: true, question: match[2].trim() };
}
