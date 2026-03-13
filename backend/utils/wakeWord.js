/**
 * wakeWord.js — Shared wake-word detection utility for NOVA 1000
 * Works in both Node.js (require) and browser (ES module import)
 */

function detectWakeWord(transcript) {
  if (!transcript || typeof transcript !== "string") {
    return { triggered: false, question: "", prefix: "" };
  }

  // Normalize: lowercase, collapse whitespace, trim
  const normalized = transcript.toLowerCase().trim().replace(/\s+/g, " ");

  // Pattern: handle "nova", "novo", "nora", "no va" + 1000 or one thousand
  // Captures: prefix [1], wake phrase [2], and question [3]
  const pattern = /^(.*?)((?:nova|novo|nora|no\s+va)\s+(?:1000|one\s+thousand))[,.]?\s*(.*)$/i;

  const match = normalized.match(pattern);
  if (!match) return { triggered: false, question: "", prefix: "" };

  return {
    triggered: true,
    prefix: match[1].trim(),
    question: match[3].trim()
  };
}

// Node.js export
module.exports = { detectWakeWord };
