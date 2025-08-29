// Improved text splitter: chunk by sentences/paragraphs with overlap
function chunkText(text, maxChunkSize = 1000, overlap = 200) {
  const chunks = [];
  const sentences = text.split(/(?<=[.?!])\s+/); // split on sentence boundaries
  let currentChunk = "";

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxChunkSize) {
      chunks.push(currentChunk.trim());
      // Add overlap (last X chars of previous chunk)
      currentChunk = currentChunk.slice(-overlap) + " " + sentence;
    } else {
      currentChunk += " " + sentence;
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

module.exports = { chunkText };
