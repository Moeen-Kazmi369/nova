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
const { detectWakeWord } = require("../utils/wakeWord");
const NovaAceProfile = require("../models/NovaAceProfile");
const TaskDraft = require("../models/TaskDraft");
const taskController = require("./taskController");

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

const EMBEDDING_MODEL = "text-embedding-3-small"; // 1536-dim

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

const TASK_DRAFT_TOOL = {
  type: "function",
  function: {
    name: "save_task_draft",
    description: "Saves a high-quality task draft composed during the conversation.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Clear, concise title for the task." },
        objective: { type: "string", description: "The primary goal/outcome of the task." },
        audience: { type: "string", description: "Who this task is being performed for." },
        deliverable_type: { type: "string", description: "The type of output (e.g., slide_deck, report, code)." },
        output_format: { type: "string", description: "File format (e.g., pptx, md, js)." },
        key_topics: { type: "array", items: { type: "string" }, description: "Core topics to be covered." },
        constraints: { type: "array", items: { type: "string" }, description: "Specific rules or limitations." },
        proposed_roles: { type: "array", items: { type: "string" }, description: "Suggested agent roles (e.g., COO, Worker, Grader)." },
        priority: { type: "string", enum: ["low", "normal", "high"], default: "normal" }
      },
      required: ["title", "objective", "audience", "deliverable_type"]
    }
  }
};

async function getNovaAceSystemPrompt(userId, model) {
  let profile = await NovaAceProfile.findOne({ userId });
  if (!profile) {
    profile = await NovaAceProfile.create({ userId });
  }

  return `
# IDENTITY: NOVA ACE (Architectural Task Composer)
You are the high-intelligence conversational front-end for ACEPLACE Workstation. You are not a generic assistant; you are a **Task Architect**.

## GOAL:
Refine user intent into a high-quality, deterministic **TaskDraft**. Your job is to move from vague speech to a structured execution plan.

## INTELLIGENCE & GROUNDING (CRITICAL):
1. **Use Knowledge Proactively:** Do not just wait for the user to give you details. Look at the provided CONTEXT (Knowledge Base). If you find relevant company standards, target audiences, or technical roadmaps, **proactively suggest** them for the TaskDraft.
2. **Synthesize & Expand, Do NOT Parrot:** When a user gives you a simple idea (e.g., "build an AI SaaS for lead generation"), you MUST NOT simply copy their exact words into the TaskDraft fields. You must **invent, expand, and architect** it into a high-gravity, professional plan. Add technical depth, define clear methodologies, and establish rigorous constraints based on your domain expertise.
3. **Suggested Roles:** Based on the complexity of the task, intelligently suggest highly specialized roles in the 'proposed_roles' array (e.g., "Economic Architect", "Brand Oracle", "Machine Learning Lead" instead of just "Developer").

## BEHAVIORAL RULES:
- **Clarification:** Ask sharp, professional clarifying questions only when necessary. If you can infer or invent a good detail, suggest it instead of asking.
- **Drafting (CRITICAL):** When the task is "strong enough" (has a clear Objective, Audience, and Deliverable), **call the \`save_task_draft\` tool IMMEDIATELY**. Do not ask for permission to save. Just save it.
- **Tone:** ${profile.instructions || "Professional, executive-grade, and proactive."}
- **Speaking Style:** ${profile.voice_preferences?.speaking_style || "Professional"}
- **Domain Focus:** ${profile.voice_preferences?.domain_focus || "General"}

## TASK SHAPING POLICY:
- If it's a presentation, suggest an audience and key slides.
- If it's code, suggest constraints like "must include unit tests and strict typing."
- Always look for "Key Topics" in the provided knowledge base to enrich the draft.

${model.apiConfig?.systemPrompt || ""}
`;
}

exports.userTextPrompt = async (req, res) => {
  upload(req, res, async (uploadErr) => {
    if (uploadErr) return res.status(400).json({ message: uploadErr.message });
    const userId = req.user.id;
    try {
      const { conversationId, prompt, chatType, aiModelId } = req.body;
      const isLocalConversation =
        conversationId && String(conversationId).startsWith("local-");
      const effectiveConversationId = isLocalConversation
        ? null
        : conversationId;

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
      let imageDescriptions = "";
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          let content = "";
          if (file.mimetype === "application/pdf") {
            content = await parsePDF(file.buffer);
            ragContext += "\n" + content;
          } else if (
            ["text/plain", "text/csv", "application/json"].includes(
              file.mimetype,
            )
          ) {
            content = await parseTxtCsvJson(file.buffer);
            ragContext += "\n" + content;
          } else if (
            ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)
          ) {
            content = await getImageDescription(openaiClient, file.buffer);
            imageDescriptions += "\n" + content;
          }
        }
      }

      // RAG context from AI Model stored fullTextContent
      // if (model.fullTextContent) {
      //   ragContext += "\n" + model.fullTextContent;
      // }

      // Semantic search in Supabase vector DB using prompt
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
          relatedChunks = data.map((d) => d.content);
        }
      } catch (e) {
        console.error("RAG retrieval failed:", e);
      }
      // Prepare messages for OpenAI chat
      const systemPrompt = await getNovaAceSystemPrompt(userId, model);

      const temperature = model.apiConfig?.temperature || 0.2;
      const maxTokens = model.apiConfig?.maxTokens || 1000;

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

      if (imageDescriptions.trim()) {
        messages.push({
          role: "assistant",
          content: `ANALYZED IMAGES (These are images you've already analyzed):\n----\n${imageDescriptions}\n----`,
        });
      }

      if (ragContext.trim()) {
        messages.push({
          role: "assistant",
          content: `ADDITIONAL DOCUMENTS:\n----\n${ragContext}\n----`,
        });
      }

      // 1) recent history first
      if (effectiveConversationId) {
        const conversation = await Conversation.findById(
          effectiveConversationId,
        );
        // ... error handling
        const userMessages = conversation.messages
          .filter((m) => m.sender === "user" || m.sender === "ai")
          .slice(-5)
          .map((m) => ({
            role: m.sender === "ai" ? "assistant" : "user",
            content: m.text,
          }));
        messages.push(...userMessages);
      }

      // 2) then the fresh user prompt last
      messages.push({ role: "user", content: prompt });

      // Generate AI response
      const completion = await openaiClient.chat.completions.create({
        model: model.apiConfig?.chatModel || "gpt-4o-mini",
        messages,
        max_tokens: maxTokens,
        temperature,
        tools: [TASK_DRAFT_TOOL],
        tool_choice: "auto",
      });

      let aiReply = completion.choices[0].message?.content || "";
      let pendingDraftContent = null;
      let taskDraft = null;

      if (completion.choices[0].message?.tool_calls) {
        const toolCall = completion.choices[0].message.tool_calls[0];
        if (toolCall.function.name === "save_task_draft") {
          pendingDraftContent = JSON.parse(toolCall.function.arguments);
          aiReply = `I have successfully drafted the task: **${pendingDraftContent.title}**. You can review and approve it in the Task Composer. [TASK_DRAFT_ID: PENDING]`;
        }
      }

      if (!aiReply) aiReply = "No response generated";

      // Create or update conversation
      let conversation;

      if (!effectiveConversationId) {
        const promptValue = chatType === "new" ? aiReply : prompt;
        // Generate conversation name from first user message
        const conversationName = await generateConversationName(
          openaiClient,
          promptValue,
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
        conversation = await Conversation.findById(effectiveConversationId);
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

      // Create TaskDraft if pending
      if (pendingDraftContent) {
        taskDraft = await TaskDraft.create({
          userId,
          conversationId: conversation._id,
          content: pendingDraftContent,
        });
        // Trigger real-time signal
        taskController.notifyDraftCreated(userId, taskDraft._id);
      }

      res.json({
        conversationId: conversation._id,
        reply: aiReply,
        taskDraftId: taskDraft?._id, // 👈 THE TRIGGER
        conversationName: conversation.conversationName,
        wasLocal: !!isLocalConversation,
        previousLocalConversationId: isLocalConversation
          ? conversationId
          : null,
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
    if (String(conversationId).startsWith("local-")) {
      return res.json([]); // Local placeholder: no messages yet
    }
    const conversation =
      await Conversation.findById(conversationId).select("messages");
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

// Create a new conversation with "New Chat" name
exports.createNewConversation = async (req, res) => {
  try {
    const userId = req.user.id;
    const aiModelId = req.body.aiModelId;
    const newConversation = await Conversation.create({
      userId,
      conversationName: "New Chat",
      aiModelId,
      messages: [],
    });
    return res.status(201).json({ conversationId: newConversation._id });
  } catch (error) {
    console.error("Error creating new conversation:", error);
    return res
      .status(500)
      .json({ message: "Failed to create new conversation" });
  }
};

// Controller for ElevenLabs Custom LLM integration with streaming

exports.elevenLabsLLM = async (req, res) => {
  const request = req.body;
  const { elevenlabs_extra_body, messages } = request;
  const { aiModelId, conversationId, chatType, userId } =
    elevenlabs_extra_body || {};

  if (!aiModelId || !messages || !Array.isArray(messages) || !conversationId) {
    return res.status(400).json({
      error: {
        message: "aiModelId, messages, and conversationId are required",
        type: "invalid_request_error",
      },
    });
  }

  // Find last user message
  const lastUserMessage =
    messages.findLast?.((m) => m.role === "user") ||
    [...messages].reverse().find((m) => m.role === "user");

  if (!lastUserMessage) {
    return res.status(400).json({
      error: {
        message: "No user message found",
        type: "invalid_request_error",
      },
    });
  }

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return res.status(404).json({
      error: {
        message: "Conversation not found",
        type: "invalid_request_error",
      },
    });
  }

  const transcript = lastUserMessage.content || "";
  const { triggered, question, prefix } = detectWakeWord(transcript);

  if (!triggered) {
    // 1. Save user message even if not triggered to preserve context for future turns
    conversation.messages.push({
      sender: "user",
      text: transcript,
      attachments: [],
    });
    conversation.updatedAt = new Date();
    await conversation.save();

    // 2. Respond with "skip_turn" tool call to keep agent silent gracefully
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const chunkId = `chatcmpl-${Date.now()}`;
    const created = Math.floor(Date.now() / 1000);
    const modelName = req.body.model || "gpt-4o-mini";

    const toolChunk = {
      id: chunkId,
      object: "chat.completion.chunk",
      created: created,
      model: modelName,
      choices: [{
        index: 0,
        delta: {
          role: "assistant",
          tool_calls: [{
            index: 0,
            id: `call_${Date.now()}`,
            type: "function",
            function: {
              name: "skip_turn",
              arguments: "{}"
            }
          }]
        },
        finish_reason: null
      }]
    };

    const finishChunk = {
      id: chunkId,
      object: "chat.completion.chunk",
      created: created,
      model: modelName,
      choices: [{
        index: 0,
        delta: {},
        finish_reason: "tool_calls"
      }]
    };

    res.write(`data: ${JSON.stringify(toolChunk)}\n\n`);
    res.write(`data: ${JSON.stringify(finishChunk)}\n\n`);
    res.write("data: [DONE]\n\n");

    console.log("[WakeWord] Silent Mode: Sent skip_turn tool call.");
    return res.end();
  }

  // Preserve context: Combine prefix (if any) with the extracted question
  if (lastUserMessage) {
    lastUserMessage.content = (prefix ? prefix + ". " : "") + (question || transcript);
  }

  const prompt = lastUserMessage.content;

  const wasEmptyBefore = (conversation.messages?.length || 0) === 0;

  // SSE headers (same as before)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  // Optional: CORS if needed by your EL agent
  // res.setHeader("Access-Control-Allow-Origin", "*");

  // keep-alive heartbeat (every 15s)
  const heartbeat = setInterval(() => {
    try {
      res.write(`: ping\n\n`);
    } catch {}
  }, 15000);

  try {
    const model = await AIModel.findById(aiModelId);
    if (!model || model.status !== "active")
      throw new Error("Invalid or inactive AI Model");

    const openaiApiKey = model.apiConfig?.apiKey || process.env.OPENAI_API_KEY;
    if (!openaiApiKey) throw new Error("OpenAI API key not configured");
    const openaiClient = new openai.OpenAI({ apiKey: openaiApiKey });

    // -------- RAG retrieval (always try; filter per-model) --------
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
        match_count: 3,
      });

      if (!error && data?.length) {
        relatedChunks = data.map((item) => item.content.substring(0, 600));
      }
    } catch (e) {
      console.error("RAG (elevenLabsLLM) retrieval error:", e);
    }

    // Optional: tiny extra notes (don’t rely on Mongo body for inference)
    const ragContext = (model.fullTextContent || "").slice(0, 1200);
    // Extract image information from conversation history
    let imageInfo = "";
    const allMessages = conversation.messages || [];
    for (const msg of allMessages) {
      if (msg.attachments && msg.attachments.length > 0) {
        const imageAttachments = msg.attachments.filter(
          (att) => att.mimetype && att.mimetype.includes("image"),
        );
        if (imageAttachments.length > 0) {
          imageInfo += `\n- User shared image(s): ${imageAttachments.map((att) => att.filename).join(", ")}`;
        }
      }
    }
    const systemPrompt = await getNovaAceSystemPrompt(userId || req.body.elevenlabs_extra_body?.userId, model);

    // Build messages: system → context → history → user
    const msgs = [{ role: "system", content: systemPrompt }];

    if (relatedChunks.length) {
      msgs.push({
        role: "assistant",
        content: [
          "CONTEXT:",
          "----",
          ...relatedChunks.map((c, i) => `[${i + 1}] ${c}`),
          "----",
        ].join("\n"),
      });
    }

    if (imageInfo) {
      msgs.push({
        role: "assistant",
        content: `REFERENCED IMAGES IN THIS CONVERSATION:\n----\nImages shared by the user in current conversation:${imageInfo}\n----\nUse the image descriptions provided in the context or refer back to what the user mentioned about these images.`,
      });
    }

    if (ragContext) {
      msgs.push({
        role: "assistant",
        content: `ADDITIONAL NOTES:\n----\n${ragContext}\n----`,
      });
    }

    const hist = conversation.messages
      .filter((m) => m.sender === "user" || m.sender === "ai")
      .slice(-3)
      .map((m) => ({
        role: m.sender === "ai" ? "assistant" : "user",
        content: m.text.slice(0, 300),
      }));
    msgs.push(...hist);

    msgs.push({ role: "user", content: prompt });

    // -------- Stream from OpenAI --------
    const stream = await openaiClient.chat.completions.create({
      model: model.apiConfig?.chatModel || "gpt-4o-mini",
      messages: msgs,
      max_tokens: model.apiConfig?.maxTokens || 500,
      temperature: model.apiConfig?.temperature ?? 0.7,
      stream: true,
      tools: [TASK_DRAFT_TOOL],
      tool_choice: "auto",
    });

    let aiReply = "";
    let toolCallArguments = "";
    let toolCallId = "";

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta;
      const piece = delta?.content || "";
      if (piece) aiReply += piece;

      // Collect tool call arguments if present
      if (delta?.tool_calls?.[0]) {
        const tc = delta.tool_calls[0];
        if (tc.id) toolCallId = tc.id;
        if (tc.function?.arguments) toolCallArguments += tc.function.arguments;
      }

      try {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      } catch (e) {
        console.error("SSE write error:", e?.message);
        break;
      }
    }

    // Process tool call if completed
    if (toolCallArguments) {
      try {
        const draftContent = JSON.parse(toolCallArguments);
        const finalUserId = userId || req.body.elevenlabs_extra_body?.userId;
        const draft = await TaskDraft.create({
          userId: finalUserId,
          conversationId: conversation._id,
          content: draftContent,
        });
        console.log(`[VoiceMode] Task draft saved: ${draftContent.title}`);
        
        // Trigger real-time signal
        taskController.notifyDraftCreated(finalUserId, draft._id);
      } catch (e) {
        console.error("Failed to parse or save task draft from voice stream:", e);
      }
    }

    // Name conversation if first turn
    if (wasEmptyBefore) {
      try {
        const conversationName = await generateConversationName(
          openaiClient,
          prompt,
        );
        if (conversationName) conversation.conversationName = conversationName;
      } catch (e) {
        console.warn("Failed to generate conversation name:", e?.message);
      }
    }

    conversation.messages.push(
      { sender: "user", text: prompt, attachments: [] },
      { sender: "ai", text: aiReply, attachments: [] },
    );
    conversation.updatedAt = new Date();
    await conversation.save();

    res.write("data: [DONE]\n\n");
    clearInterval(heartbeat);
    res.end();
  } catch (error) {
    console.error("elevenLabsLLM error:", error);

    // Keep the same error payload shape your agent is used to
    const errorMessage = {
      id: `chatcmpl-error-${Date.now()}`,
      object: "chat.completion.chunk",
      created: Math.floor(Date.now() / 1000),
      model: aiModelId || "unknown",
      choices: [
        {
          delta: { content: "Sorry—something went wrong. Please try again." },
          index: 0,
          finish_reason: "stop",
        },
      ],
    };

    try {
      res.write(`data: ${JSON.stringify(errorMessage)}\n\n`);
      res.write("data: [DONE]\n\n");
    } catch {}
    clearInterval(heartbeat);
    res.end();
  }
};
