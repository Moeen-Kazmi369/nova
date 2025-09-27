


// Helper to get image description via OpenAI (updated for vision API)
async function getImageDescription(openaiClient, buffer) {
  // Validate buffer size early (e.g., <10MB to be safe; adjust as needed)
  const maxSizeMB = 10;
  if (buffer.length > maxSizeMB * 1024 * 1024) {
    throw new Error(`Image too large: ${buffer.length / (1024 * 1024).toFixed(2)}MB exceeds ${maxSizeMB}MB limit`);
  }

  const base64Image = buffer.toString("base64");
  const mimeType = "image/jpeg"; // Detect/adjust based on file.mimetype (e.g., jpeg, png, webp); fallback to jpeg for simplicity

  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini", // Supports vision; could swap to gpt-4o for better quality if needed
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Describe this image in a concise summary (2-3 sentences max, focus on key subjects, actions, and setting).",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
            },
          },
        ],
      },
    ],
    max_tokens: 100, // Increased slightly for better descriptions; adjust based on needs
    temperature: 0.7,
  });

  return response.choices[0].message.content.trim();
}
  
module.exports = { getImageDescription };