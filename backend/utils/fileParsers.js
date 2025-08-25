const pdfParse = require("pdf-parse");
const csv = require("csvtojson");

async function parsePDF(buffer) {
  try {
    const data = await pdfParse(buffer);
    return data.text || "";
  } catch (err) {
    throw new Error("Failed to parse PDF");
  }
}

async function parseTxtCsvJson(buffer) {
  try {
    const text = buffer.toString("utf-8");

    // Try JSON parsing first
    try {
      const jsonObj = JSON.parse(text);
      return JSON.stringify(jsonObj, null, 2);
    } catch {}

    // Try CSV parsing second (detect by commas and newlines)
    if (text.includes(",") && text.includes("\n")) {
      const jsonArray = await csv().fromString(text);
      return JSON.stringify(jsonArray, null, 2);
    }

    // Fallback text/plain
    return text;
  } catch (err) {
    throw new Error("Failed to parse file");
  }
}

module.exports = {
  parsePDF,
  parseTxtCsvJson,
};
