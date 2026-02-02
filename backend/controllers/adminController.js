const User = require("../models/User");
const AIModel = require("../models/AIModel");
const multer = require("multer");
const { parsePDF, parseTxtCsvJson } = require("../utils/fileParsers");
const { chunkText } = require("../utils/textChunker");
const { getImageDescription } = require("../utils/imageDescription.js"); // similar to admin
const supabase = require("../config/supabase");
const openaiClient = require("../config/openai");
const openai = require("openai");
const { performWebSearch } = require("../utils/webSearch");
// Setup multer for file uploads - max 3 files
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size each
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/json",
    ];
    cb(null, allowedMimeTypes.includes(file.mimetype));
  },
}).array("files", 3);

const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536-dim

exports.createAIModel = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const { name, description, apiConfig } = req.body;
      const ownerAdmin = req.user.id;

      let filesData = [];
      let fullTextContent = "";

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          let textContent = "";
          if (file.mimetype === "application/pdf") {
            textContent = await parsePDF(file.buffer);
          } else {
            textContent = await parseTxtCsvJson(file.buffer);
          }
          fullTextContent += textContent + "\n";

          filesData.push({
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            textContent,
          });
        }
      }

      const newModel = new AIModel({
        name,
        description,
        ownerAdmin,
        apiConfig: JSON.parse(apiConfig || "{}"),
        files: filesData,
        fullTextContent,
      });

      await newModel.save();

      // Now chunk the fullTextContent and store chunks with embeddings
      if (fullTextContent) {
        const chunks = chunkText(fullTextContent);
        console.log("chunks length:", chunks.length);
        console.log(
          "first item type/len:",
          typeof chunks[0],
          chunks[0]?.length
        );

        // after you compute `chunks = chunkText(fullTextContent)`
        const cleanChunks = (chunks || [])
          .map((c) => (typeof c === "string" ? c : String(c ?? "")))
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        // BATCH to avoid oversized request errors
        const BATCH_SIZE = 100; // 64–128 is also fine
        const rows = [];

        for (let i = 0; i < cleanChunks.length; i += BATCH_SIZE) {
          const batch = cleanChunks.slice(i, i + BATCH_SIZE);

          const embRes = await openaiClient.embeddings.create({
            model: EMBEDDING_MODEL, // e.g., "text-embedding-3-large"
            input: batch, // array of strings (v4 OK)
          });

          if (!embRes?.data || embRes.data.length !== batch.length) {
            throw new Error("Embedding response size mismatch.");
          }

          batch.forEach((chunk, j) => {
            rows.push({
              ai_model_id: newModel._id.toString(), // <-- FIX: use `model`, not `newModel`
              content: chunk,
              embedding: embRes.data[j].embedding,
              metadata: {
                filename: null,
                chunk_index: i + j,
                created_at: new Date().toISOString(),
              },
            });
          });
        }

        // Single insert to Supabase:
        const { error } = await supabase.from("documents").insert(rows);
        if (error) console.error("Supabase insert error:", error);
      }

      res.status(201).json(newModel);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to create AI model", error: error.message });
    }
  });
};

exports.updateAIModel = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    try {
      const { id } = req.params;
      const updates = req.body;
      updates.updatedAt = new Date();

      let filesData = [];
      let fullTextContent = "";

      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          let textContent = "";
          if (file.mimetype === "application/pdf") {
            textContent = await parsePDF(file.buffer);
          } else {
            textContent = await parseTxtCsvJson(file.buffer);
          }
          fullTextContent += textContent + "\n";

          filesData.push({
            filename: file.originalname,
            mimetype: file.mimetype,
            size: file.size,
            textContent,
          });
        }
        updates.files = filesData;
        updates.fullTextContent = fullTextContent;
      }

      if (updates.apiConfig) {
        updates.apiConfig = JSON.parse(updates.apiConfig);
      }

      // Update AIModel in MongoDB
      const model = await AIModel.findByIdAndUpdate(id, updates, { new: true });
      if (!model) return res.status(404).json({ message: "Model not found" });

      // If fullTextContent updated, re-chunk and update Supabase vector DB
      if (fullTextContent) {
        const chunks = chunkText(fullTextContent);
        console.log("chunks length:", chunks.length);
        console.log(
          "first item type/len:",
          typeof chunks[0],
          chunks[0]?.length
        );

        // Delete existing vectors for this model's RAG table before inserting updated chunks
        await supabase
          .from("documents")
          .delete()
          .eq("ai_model_id", model._id.toString());

        // after you compute `chunks = chunkText(fullTextContent)`
        const cleanChunks = (chunks || [])
          .map((c) => (typeof c === "string" ? c : String(c ?? "")))
          .map((c) => c.trim())
          .filter((c) => c.length > 0);

        // BATCH to avoid oversized request errors
        const BATCH_SIZE = 100; // 64–128 is also fine
        const rows = [];

        for (let i = 0; i < cleanChunks.length; i += BATCH_SIZE) {
          const batch = cleanChunks.slice(i, i + BATCH_SIZE);

          const embRes = await openaiClient.embeddings.create({
            model: EMBEDDING_MODEL, // e.g., "text-embedding-3-large"
            input: batch, // array of strings (v4 OK)
          });

          if (!embRes?.data || embRes.data.length !== batch.length) {
            throw new Error("Embedding response size mismatch.");
          }

          batch.forEach((chunk, j) => {
            rows.push({
              ai_model_id: model._id.toString(), // <-- FIX: use `model`, not `newModel`
              content: chunk,
              embedding: embRes.data[j].embedding,
              metadata: {
                filename: null,
                chunk_index: i + j,
                created_at: new Date().toISOString(),
              },
            });
          });
        }

        // Single insert to Supabase:
        const { error } = await supabase.from("documents").insert(rows);
        if (error) console.error("Supabase insert error:", error);
      }

      res.json(model);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to update AI model", error: error.message });
    }
  });
};

exports.deleteAIModel = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the AI Model first to get ragTableName
    const model = await AIModel.findById(id);
    if (!model) return res.status(404).json({ message: "AI Model not found" });

    // Delete vectors related to this AI Model from Supabase vector DB
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("ai_model_id", model._id.toString());

    if (error) {
      console.error("Supabase delete error:", error);
      return res
        .status(500)
        .json({ message: "Failed to delete RAG vector data" });
    }

    // Delete AI Model document in MongoDB
    await AIModel.findByIdAndDelete(id);

    res.json({ message: "AI Model deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete AI model", error: error.message });
  }
};

// Get all AI Models
exports.getAllAIModelsForAdmin = async (req, res) => {
  try {
    const models = await AIModel.find({ ownerAdmin: req.user.id });
    res.json(models);
  } catch (error) {
    res.status(500).json({ message: "Failed to get AI models" });
  }
};

// Delete a user by ID (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    await User.findByIdAndDelete(userId);
    res.json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete user" });
  }
};

// List all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to get users" });
  }
};

// Setup Multer for optional file uploads: max 3 files, including images & text formats
const playgroundUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = [
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/json",
      "image/jpeg",
      "image/png",
      "image/webp",
    ];
    cb(null, allowedMimeTypes.includes(file.mimetype));
  },
}).array("files", 3);

exports.adminPlaygroundTextChat = async (req, res) => {
  playgroundUpload(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ message: uploadErr.message });

    try {
      const { prompt, modelId } = req.body;
      if (!prompt || !modelId) {
        return res
          .status(400)
          .json({ message: "Prompt and modelId are required" });
      }

      const model = await AIModel.findById(modelId);
      if (!model)
        return res.status(404).json({ message: "AI Model not found" });

      const openaiApiKey =
        model.apiConfig?.apiKey || process.env.OPENAI_API_KEY;
      if (!openaiApiKey)
        return res
          .status(400)
          .json({ message: "OpenAI API key not configured" });
      const openaiClient = new openai.OpenAI({ apiKey: openaiApiKey });

      // 1) Optional ad-hoc context from uploads
      let ragContext = "";
      if (req.files?.length) {
        for (const file of req.files) {
          let content = "";
          if (file.mimetype === "application/pdf")
            content = await parsePDF(file.buffer);
          else if (
            ["text/plain", "text/csv", "application/json"].includes(
              file.mimetype
            )
          )
            content = await parseTxtCsvJson(file.buffer);
          else if (
            ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
          )
            content = await getImageDescription(openaiClient, file.buffer);
          ragContext += "\n" + content;
        }
      }

      // 2) Always try retrieval from Supabase (don’t gate on Mongo text)
      let relatedChunks = [];
      try {
        const emb = await openaiClient.embeddings.create({
          model: EMBEDDING_MODEL,
          input: prompt,
        });
        const queryEmbedding = emb.data[0].embedding;

        const { data, error } = await supabase.rpc("match_documents", {
          query_embedding: queryEmbedding,
          p_ai_model_id: model._id.toString(),
          match_count: 5,
        });
        if (!error && data?.length) {
          // Optionally trim each chunk to keep tokens low
          relatedChunks = data.map((x) => x.content.substring(0, 800));
        }
      } catch (e) {
        console.error("Playground RAG retrieval error:", e);
      }

      // 3) Build messages: system → context blocks → (optional) history → user
      const systemPrompt =
        model.apiConfig?.systemPrompt ||
        "You are a careful assistant. Use the CONTEXT if relevant; if not, say you don't know.";
      const temperature = model.apiConfig?.temperature ?? 0.2;
      const maxTokens = model.apiConfig?.maxTokens ?? 1000;

      const messages = [{ role: "system", content: systemPrompt }];

      if (relatedChunks.length) {
        messages.push({
          role: "assistant",
          content: [
            "CONTEXT (top matches from knowledge base):",
            "----",
            ...relatedChunks.map((c, i) => `[${i + 1}] ${c}`),
            "----",
            "If a part of the user's question is not covered above, say so.",
          ].join("\n"),
        });
      }

      if (ragContext.trim()) {
        messages.push({
          role: "assistant",
          content: `ADDITIONAL USER DOCUMENTS:\n----\n${ragContext}\n----`,
        });
      }

      // (Optional) include a bit of synthetic history here if you have it (not shown)

      messages.push({ role: "user", content: prompt });

      let requestPayload = {
        model: model.apiConfig?.chatModel || "gpt-4o-mini",
        messages,
        max_tokens: maxTokens,
        temperature,
      };

      let useWebSearch = req.body.webSearch === 'true' || req.body.webSearch === true;

      // Custom Web Search Tool Definition
      const tools = [
        {
          type: "function",
          function: {
            name: "perform_web_search",
            description: "Search the web for real-time information, news, prices, etc.",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "The search query",
                },
              },
              required: ["query"],
            },
          },
        },
      ];

      if (useWebSearch) {
        requestPayload.tools = tools;
        requestPayload.tool_choice = "auto";
      }

      console.log(`[AdminPlayground] Calling OpenAI with Web Search: ${useWebSearch}`);

      let completion = await openaiClient.chat.completions.create(requestPayload);
      let message = completion.choices[0].message;

      // Handle function tool calls
      if (message.tool_calls && message.tool_calls.length > 0) {
        const toolCall = message.tool_calls[0];
        if (toolCall.function.name === "perform_web_search") {
          const { query } = JSON.parse(toolCall.function.arguments);
          console.log(`[AdminPlayground] Triggered search for: ${query}`);
          
          const searchResults = await performWebSearch(query);
          
          // Append assistant's tool call and the tool output to messages
          messages.push(message);
          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: searchResults,
          });

          // Call OpenAI again with the search results
          const secondResponse = await openaiClient.chat.completions.create({
            model: requestPayload.model,
            messages,
            max_tokens: maxTokens,
            temperature,
          });
          
          message = secondResponse.choices[0].message;
        }
      }

      const reply = message.content || "No response generated";
      res.json({ reply });
    } catch (err) {
      console.error("adminPlaygroundTextChat error:", err);
      res
        .status(500)
        .json({ message: "Failed to process chat", error: err.message });
    }
  });
};

