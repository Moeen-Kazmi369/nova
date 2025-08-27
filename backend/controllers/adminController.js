const User = require("../models/User");
const AIModel = require("../models/AIModel");
const multer = require("multer");
const { parsePDF, parseTxtCsvJson } = require("../utils/fileParsers");
const { chunkText } = require("../utils/textChunker");
const { getImageDescription } = require("../utils/imageDescription.js"); // similar to admin
const supabase = require("../config/supabase");
const openaiClient = require("../config/openai");
const openai = require("openai");
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
        const chunks = chunkText(fullTextContent); // Utility to split into smaller chunks

        for (const chunk of chunks) {
          // Create embedding with OpenAI
          const embeddingResponse = await openaiClient.embeddings.create({
            model: "text-embedding-3-large", // replace with your embedding model
            input: chunk,
          });
          const embedding = embeddingResponse.data[0].embedding;

          try {
            // Save chunk + embedding to Supabase vector table:
            const res = await supabase
              .from("documents") // your vector DB table name
              .insert({
                content: chunk,
                embedding,
                metadata: { aiModelId: newModel._id.toString(), filename: "" },
              });
            console.log(res);
          } catch (error) {
            console.log(error);
          }
        }
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

        // Delete existing vectors for this model's RAG table before inserting updated chunks
        await supabase
          .from(model.ragTableName || "documents")
          .delete()
          .eq("metadata->>aiModelId", model._id.toString());

        for (const chunk of chunks) {
          // Generate embedding using OpenAI embeddings API
          const embeddingResponse = await openaiClient.embeddings.create({
            model: "text-embedding-3-large",
            input: chunk,
          });
          const embedding = embeddingResponse.data[0].embedding;

          // Insert the chunk + embedding into Supabase vector DB
          await supabase.from("documents").insert({
            content: chunk,
            embedding,
            metadata: { aiModelId: model._id.toString(), filename: "" },
          });
        }
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
      .eq("metadata->>aiModelId", model._id.toString());

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
      if (!prompt || !modelId)
        return res
          .status(400)
          .json({ message: "Prompt and modelId are required" });

      // Fetch AI Model details
      const model = await AIModel.findById(modelId);
      if (!model)
        return res.status(404).json({ message: "AI Model not found" });

      // Use OpenAI client with model apiKey or default from backend env
      const openaiApiKey =
        model.apiConfig?.apiKey || process.env.OPENAI_API_KEY;
      if (!openaiApiKey)
        return res
          .status(400)
          .json({ message: "OpenAI API key not configured" });

      const openaiClient = new openai.OpenAI({ apiKey: openaiApiKey });

      // Placeholder for additional prompt context (from files or uploaded files)
      let ragContext = "";

      // Process uploaded files if any, extract text or image descriptions and append
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          let content = "";
          if (file.mimetype === "application/pdf") {
            content = await parsePDF(file.buffer);
          } else if (
            ["text/plain", "text/csv", "application/json"].includes(
              file.mimetype
            )
          ) {
            content = await parseTxtCsvJson(file.buffer);
          } else if (
            ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
          ) {
            content = await getImageDescription(openaiClient, file.buffer);
          }
          ragContext += "\n" + content;
        }
      }

      // If model has RAG contents stored on MongoDB side, use them
      if (model.fullTextContent) {
        ragContext += "\n" + model.fullTextContent;
      }

      // If ragContext exists, perform semantic search in Supabase vector DB to get relevant text chunks
      let relatedChunks = [];
      if (model.files.length > 0 && model.fullTextContent) {
        const embeddingResponse = await openaiClient.embeddings.create({
          model: "text-embedding-3-large",
          input: prompt,
        });
        const queryEmbedding = embeddingResponse.data[0].embedding;

        const { data, error } = await supabase.rpc("match_documents", {
          query_embedding: queryEmbedding,
          match_count: 5,
        });

        if (error) {
          console.error("Supabase RAG query error:", error);
        } else {
          relatedChunks = data.map((item) => item.content);
        }
      }

      // Assemble system prompt and user messages for OpenAI chat completion
      const systemPrompt =
        model.apiConfig?.systemPrompt || "You are a helpful assistant.";
      const temperature = model.apiConfig?.temperature || 0.7;
      const maxTokens = model.apiConfig?.maxTokens || 1000;

      let messages = [{ role: "system", content: systemPrompt }];

      if (relatedChunks.length > 0) {
        messages.push({
          role: "system",
          content: `Relevant context from documents:\n${relatedChunks.join(
            "\n\n"
          )}`,
        });
      }

      if (ragContext.trim()) {
        messages.push({
          role: "system",
          content: `Additional document input:\n${ragContext}`,
        });
      }

      messages.push({ role: "user", content: prompt });

      // Generate response from OpenAI chat completion
      const completion = await openaiClient.chat.completions.create({
        model: model.apiConfig?.chatModel || "gpt-4o-mini",
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      const reply =
        completion.choices[0].message?.content || "No response generated";

      res.json({ reply });
    } catch (err) {
      console.error("adminPlaygroundTextChat error:", err);
      res
        .status(500)
        .json({ message: "Failed to process chat", error: err.message });
    }
  });
};
