const AIModel = require("../models/AIModel");
const Conversation = require("../models/Conversation");
const multer = require("multer");
const { parsePDF, parseTxtCsvJson } = require("../utils/fileParsers");
const { getImageDescription } = require("../utils/imageDescription.js"); // similar to admin
const { chunkText } = require("../utils/textChunker");
const supabase = require("../config/supabase");
const openaiClient = require("../config/openai");
const openai = require("openai");
const mongoose = require("mongoose");

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
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

exports.getAllAIModels = async (req, res) => {
  try {
    // Fetch active AI Models with selected fields
    const models = await AIModel.find({ status: "active" }).select(
      "name description _id"
    );
    res.json(models);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch AI Models", error: error.message });
  }
};

// Generate conversation name from first user message using OpenAI
async function generateConversationName(openaiClient, messageText) {
  const prompt = `Generate a short conversation title (5 words max) for this message: "${messageText}"`;
  const response = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 10,
    temperature: 0.5,
  });
  return response.choices[0].message.content.trim().replace(/["']/g, "");
}

exports.userTextPrompt = async (req, res) => {
  upload(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ message: uploadErr.message });
    const userId = req.user.id;
    try {
      const { conversationId, prompt, chatType, aiModelId } = req.body;

      if (!prompt || !aiModelId) {
        return res
          .status(400)
          .json({ message: "Prompt and AI Model ID are required" });
      }

      // Fetch AI Model and prepare OpenAI client
      const model = await AIModel.findById(aiModelId);
      if (!model || model.status !== "active") {
        return res
          .status(400)
          .json({ message: "Invalid or inactive AI Model" });
      }

      const openaiApiKey =
        model.apiConfig?.apiKey || process.env.OPENAI_API_KEY;
      const openaiClient = new openai.OpenAI({ apiKey: openaiApiKey });

      // Process uploaded files: extract text or image description
      let ragContext = "";
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

      // RAG context from AI Model stored fullTextContent
      if (model.fullTextContent) {
        ragContext += "\n" + model.fullTextContent;
      }

      // Semantic search in Supabase vector DB using prompt
      let relatedChunks = [];
      if (ragContext.trim() && model.ragTableName) {
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

      // Prepare messages for OpenAI chat
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
      // Add conversation history (excluding system messages we just added)
      let userMessages = [];
      if (conversationId) {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        userMessages = conversation.messages
          .filter((m) => m.sender === "user" || m.sender === "ai")
          .slice(-5) // Get the last 5 messages
          .map((m) => ({
            role: m.sender === "ai" ? "assistant" : "user",
            content: m.text,
          }));
      }
      messages = [...messages, ...userMessages];
      // Generate AI response
      const completion = await openaiClient.chat.completions.create({
        model: model.apiConfig?.chatModel || "gpt-4o-mini",
        messages,
        max_tokens: maxTokens,
        temperature,
      });

      const aiReply =
        completion.choices[0].message?.content || "No response generated";

      // Create or update conversation
      let conversation;

      if (!conversationId) {
        const promptValue = chatType === "new" ? aiReply : prompt;
        // Generate conversation name from first user message
        const conversationName = await generateConversationName(
          openaiClient,
          promptValue
        );

        conversation = new Conversation({
          userId,
          aiModelId,
          conversationName,
          messages: [
            ...(chatType !== "new"
              ? [
                  {
                    sender: "user",
                    text: prompt,
                    attachments:
                      req.files?.map((f) => ({
                        filename: f.originalname,
                        mimetype: f.mimetype,
                        size: f.size,
                      })) || [],
                  },
                ]
              : []),
            {
              sender: "ai",
              text: aiReply,
              attachments: [],
            },
          ],
        });
      } else {
        conversation = await Conversation.findById(conversationId);
        if (!conversation) {
          return res.status(404).json({ message: "Conversation not found" });
        }
        conversation.messages.push({
          sender: "user",
          text: prompt,
          attachments:
            req.files?.map((f) => ({
              filename: f.originalname,
              mimetype: f.mimetype,
              size: f.size,
            })) || [],
        });
        conversation.messages.push({
          sender: "ai",
          text: aiReply,
          attachments: [],
        });
      }

      conversation.updatedAt = new Date();
      await conversation.save();

      res.json({
        conversationId: conversation._id,
        reply: aiReply,
        conversationName: conversation.conversationName,
      });
    } catch (error) {
      console.error("userTextPrompt error:", error);
      res.status(500).json({
        message: "Failed to process user prompt",
        error: error.message,
      });
    }
  });
};

// 1. Get all conversations for logged in user (for sidebar)
exports.getUserConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await Conversation.find({
      userId: new mongoose.Types.ObjectId(userId),
    })
      .select("conversationName aiModelId updatedAt")
      .sort({ updatedAt: -1 }); // latest updated first

    res.json(conversations);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch conversations", error: error.message });
  }
};

// 2. Get messages for specific conversation by id (no sorting)
exports.getConversationMessagesById = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await Conversation.findById(conversationId).select(
      "messages"
    );
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    res.json(conversation.messages); // messages order preserved as inserted
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch conversation messages",
      error: error.message,
    });
  }
};

// 3. Delete conversation by id
exports.deleteConversationById = async (req, res) => {
  try {
    const conversationId = req.params.id;
    const conversation = await Conversation.findById(conversationId);
    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    // Optionally verify ownership before deletion
    if (conversation.userId.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Forbidden: Not your conversation" });
    }

    await Conversation.findByIdAndDelete(conversationId);
    res.json({ message: "Conversation deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete conversation", error: error.message });
  }
};

// New controller for ElevenLabs Custom LLM integration (OpenAI-compatible format)
// exports.elevenLabsLLM = async (req, res) => {
//   try {
//     // Extract OpenAI-compatible fields
//     const { elevenlabs_extra_body, messages, stream = false } = req.body;
//     const { aiModelId, conversationId, chatType, userId } =
//       elevenlabs_extra_body;
//     if (!aiModelId || !messages || !Array.isArray(messages)) {
//       return res.status(400).json({
//         error: {
//           message: "model and messages are required",
//           type: "invalid_request_error",
//         },
//       });
//     }

//     // Get the last user message for processing
//     const lastUserMessage = messages.findLast((m) => m.role === "user");
//     if (!lastUserMessage) {
//       return res.status(400).json({
//         error: {
//           message: "No user message found in messages array",
//           type: "invalid_request_error",
//         },
//       });
//     }

//     const prompt = lastUserMessage.content;

//     // Fetch AI Model and prepare OpenAI client
//     const model = await AIModel.findById(aiModelId);
//     if (!model || model.status !== "active") {
//       return res.status(400).json({
//         error: {
//           message: "Invalid or inactive AI Model",
//           type: "invalid_request_error",
//         },
//       });
//     }

//     const openaiApiKey = model.apiConfig?.apiKey || process.env.OPENAI_API_KEY;
//     const openaiClient = new openai.OpenAI({ apiKey: openaiApiKey });

//     // Process RAG context from AI Model stored fullTextContent
//     let ragContext = "";
//     if (model.fullTextContent) {
//       ragContext += "\n" + model.fullTextContent;
//     }

//     // Semantic search in Supabase vector DB using prompt
//     let relatedChunks = [];
//     if (ragContext.trim() && model.ragTableName) {
//       const embeddingResponse = await openaiClient.embeddings.create({
//         model: "text-embedding-3-large",
//         input: prompt,
//       });
//       const queryEmbedding = embeddingResponse.data[0].embedding;

//       let { data, error } = await supabase
//         .from("documents")
//         .select("content")
//         .order("embedding <-> ?", true, { params: [queryEmbedding] })
//         .limit(5);

//       if (error) console.error("Supabase RAG query error:", error);
//       else relatedChunks = data.map((item) => item.content);
//     }

//     // Prepare messages for OpenAI chat with RAG context
//     const systemPrompt =
//       model.apiConfig?.systemPrompt || "You are a helpful assistant.";

//     // Build context-aware messages array
//     let contextAwareMessages = [{ role: "system", content: systemPrompt }];

//     // Add RAG context if available
//     if (relatedChunks.length > 0) {
//       contextAwareMessages.push({
//         role: "system",
//         content: `Relevant context from documents:\n${relatedChunks.join(
//           "\n\n"
//         )}`,
//       });
//     }

//     if (ragContext.trim()) {
//       contextAwareMessages.push({
//         role: "system",
//         content: `Additional document input:\n${ragContext}`,
//       });
//     }

//     // Add conversation history (excluding system messages we just added)
//     let userMessages = [];
//     if (conversationId) {
//       const conversation = await Conversation.findById(conversationId);
//       if (!conversation) {
//         return res.status(404).json({ message: "Conversation not found" });
//       }
//       userMessages = conversation.messages
//         .filter((m) => m.sender === "user" || m.sender === "ai")
//         .slice(-5) // Get the last 5 messages
//         .map((m) => ({
//           role: m.sender === "ai" ? "assistant" : m.sender,
//           content: m.text,
//         }));
//     } else {
//       userMessages = messages
//         .filter((m) => m.role === "user" || m.role === "assistant")
//         .slice(-5); // Get the last 5 messages
//     }
//     contextAwareMessages = [...contextAwareMessages, ...userMessages];
//     // Generate AI response
//     const completion = await openaiClient.chat.completions.create({
//       model: model.apiConfig?.chatModel || "gpt-4o-mini",
//       messages: contextAwareMessages,
//       max_tokens: model.apiConfig?.maxTokens || 1000,
//       temperature: model.apiConfig?.temperature || 0.7,
//       stream: false, // ElevenLabs doesn't support streaming in this context
//     });

//     const aiReply =
//       completion.choices[0].message?.content || "No response generated";
//     // Create or update conversation
//     let conversation;

//     if (!conversationId) {
//       const promptValue = chatType === "new" ? aiReply : prompt;
//       // Generate conversation name from first user message
//       const conversationName = await generateConversationName(
//         openaiClient,
//         promptValue
//       );

//       conversation = new Conversation({
//         userId,
//         aiModelId,
//         conversationName,
//         messages: [
//           ...(chatType !== "new"
//             ? [
//                 {
//                   sender: "user",
//                   text: prompt,
//                   attachments: [],
//                 },
//               ]
//             : []),
//           {
//             sender: "ai",
//             text: aiReply,
//             attachments: [],
//           },
//         ],
//       });
//     } else {
//       conversation = await Conversation.findById(conversationId);
//       if (!conversation) {
//         return res.status(404).json({ message: "Conversation not found" });
//       }
//       conversation.messages.push({
//         sender: "user",
//         text: prompt,
//         attachments: [],
//       });
//       conversation.messages.push({
//         sender: "ai",
//         text: aiReply,
//         attachments: [],
//       });
//     }

//     conversation.updatedAt = new Date();
//     await conversation.save();
//     // Return OpenAI-compatible response
//     res.json({
//       id: `chatcmpl-${Date.now()}`,
//       object: "chat.completion",
//       created: Math.floor(Date.now() / 1000),
//       model: aiModelId,
//       choices: [
//         {
//           index: 0,
//           message: {
//             role: "assistant",
//             content: aiReply,
//           },
//           finish_reason: "stop",
//         },
//       ],
//       usage: {
//         prompt_tokens: prompt.length,
//         completion_tokens: aiReply.length,
//         total_tokens: prompt.length + aiReply.length,
//       },
//     });
//   } catch (error) {
//     console.error("elevenLabsLLM error:", error);
//     res.status(500).json({
//       error: {
//         message: "Failed to process request",
//         type: "server_error",
//         details: error.message,
//       },
//     });
//   }
// };

// Controller for ElevenLabs Custom LLM integration with streaming
exports.elevenLabsLLM = async (req, res) => {
  const request = req.body;
  console.log("elevenLabsLLM request:", JSON.stringify(request));
  const { elevenlabs_extra_body, messages } = request;
  const { aiModelId, conversationId, chatType, userId } =
    elevenlabs_extra_body || {};

  // Map user_id to user if present
  const oaiRequest = { ...request };
  if (userId) {
    oaiRequest.user = userId;
    delete oaiRequest.elevenlabs_extra_body.userId;
  }

  // Validate inputs
  if (!aiModelId || !messages || !Array.isArray(messages)) {
    return res.status(400).json({
      error: {
        message: "model and messages are required",
        type: "invalid_request_error",
      },
    });
  }

  // Get the last user message
  const lastUserMessage = messages.findLast((m) => m.role === "user");
  if (!lastUserMessage) {
    return res.status(400).json({
      error: {
        message: "No user message found in messages array",
        type: "invalid_request_error",
      },
    });
  }

  const prompt = lastUserMessage.content;

  // Set headers for streaming response
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    // Fetch AI Model and prepare OpenAI client
    const model = await AIModel.findById(aiModelId);
    if (!model || model.status !== "active") {
      throw new Error("Invalid or inactive AI Model");
    }

    const openaiApiKey = model.apiConfig?.apiKey || process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }
    const openaiClient = new openai.OpenAI({ apiKey: openaiApiKey });

    // Process RAG context
    let ragContext = "";
    if (model.fullTextContent) {
      ragContext += "\n" + model.fullTextContent;
    }

    // Semantic search in Supabase vector DB
    let relatedChunks = [];
    if (ragContext.trim() && model.ragTableName) {
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

    // Prepare messages with RAG context
    const systemPrompt =
      model.apiConfig?.systemPrompt || "You are a helpful assistant.";
    let contextAwareMessages = [{ role: "system", content: systemPrompt }];

    if (relatedChunks.length > 0) {
      contextAwareMessages.push({
        role: "system",
        content: `Relevant context from documents:\n${relatedChunks.join(
          "\n\n"
        )}`,
      });
    }

    if (ragContext.trim()) {
      contextAwareMessages.push({
        role: "system",
        content: `Additional document input:\n${ragContext}`,
      });
    }

    // Add conversation history
    let userMessages = [];
    if (conversationId) {
      const conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      userMessages = conversation.messages
        .filter((m) => m.sender === "user" || m.sender === "ai")
        .slice(-5)
        .map((m) => ({
          role: m.sender === "ai" ? "assistant" : m.sender,
          content: m.text,
        }));
    } else {
      userMessages = messages
        .filter((m) => m.role === "user" || m.role === "assistant")
        .slice(-5);
    }
    contextAwareMessages = [...contextAwareMessages, ...userMessages];

    // Send initial buffer chunk
    const initialChunk = {
      id: `chatcmpl-buffer-${Date.now()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: aiModelId,
      choices: [
        {
          delta: { content: "Let me think about that... " },
          index: 0,
          finish_reason: null,
        },
      ],
    };
    res.write(`data: ${JSON.stringify(initialChunk)}\n\n`);

    // Generate AI response with streaming
    const stream = await openaiClient.chat.completions.create({
      model: model.apiConfig?.chatModel || "gpt-4o-mini",
      messages: contextAwareMessages,
      max_tokens: model.apiConfig?.maxTokens || 1000,
      temperature: model.apiConfig?.temperature || 0.7,
      stream: true,
    });

    let aiReply = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content || "";
      aiReply += content;
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    // Create or update conversation
    let conversation;
    if (!conversationId) {
      const promptValue = chatType === "new" ? aiReply : prompt;
      const conversationName = await generateConversationName(
        openaiClient,
        promptValue
      );

      conversation = new Conversation({
        userId,
        aiModelId,
        conversationName,
        messages: [
          ...(chatType !== "new"
            ? [{ sender: "user", text: prompt, attachments: [] }]
            : []),
          { sender: "ai", text: aiReply, attachments: [] },
        ],
      });
    } else {
      conversation = await Conversation.findById(conversationId);
      if (!conversation) {
        throw new Error("Conversation not found");
      }
      conversation.messages.push(
        { sender: "user", text: prompt, attachments: [] },
        { sender: "ai", text: aiReply, attachments: [] }
      );
    }

    conversation.updatedAt = new Date();
    await conversation.save();

    // Signal end of stream
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (error) {
    console.error("elevenLabsLLM error:", error);
    res.write(
      `data: ${JSON.stringify({
        error: {
          message: "Internal error occurred!",
          type: "server_error",
          details: error.message,
        },
      })}\n\n`
    );
    res.end();
  }
};
