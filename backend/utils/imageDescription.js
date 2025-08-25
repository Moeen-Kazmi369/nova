


// Helper to get image description via OpenAI
async function getImageDescription(openaiClient, buffer) {
    // Using OpenAI's image analysis (DALL·E captioning or GPT-based) - here demo placeholder
    const base64Image = buffer.toString("base64");
    // Compose prompt for description (simplified example)
    const prompt = `Describe this image in concise summary:\n\n[data:image;base64,${base64Image}]`;
    const response = await openaiClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 60,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
}
  
module.exports = { getImageDescription };