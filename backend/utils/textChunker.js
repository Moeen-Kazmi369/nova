// Simple splitter to chunk text into ~1000 character chunks with overlap
function chunkText(text, maxChunkSize = 1000, overlap = 200) {
  const chunks = [];
  let start = 0;
  while (start < text.length) {
    let end = start + maxChunkSize;
    if (end > text.length) end = text.length;

    const chunk = text.substring(start, end);
    chunks.push(chunk);

    start += maxChunkSize - overlap;
  }
  return chunks;
}

module.exports = { chunkText };
