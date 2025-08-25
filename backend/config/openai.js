const openai = require("openai");
const openaiClient = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });


module.exports = openaiClient;