const TaskDraft = require("../models/TaskDraft");
const NovaAceProfile = require("../models/NovaAceProfile");

// Event Hub for real-time notifications
let clients = [];

exports.eventsHandler = (req, res) => {
  const headers = {
    'Content-Type': 'text/event-stream',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache'
  };
  res.writeHead(200, headers);

  const clientId = Date.now();
  const newClient = {
    id: clientId,
    userId: req.query.userId,
    res
  };

  clients.push(newClient);
  console.log(`[SSE] Client ${clientId} connected for user ${req.query.userId}`);

  req.on('close', () => {
    console.log(`[SSE] Client ${clientId} disconnected`);
    clients = clients.filter(client => client.id !== clientId);
  });
};

const notifyUser = (userId, eventData) => {
  clients.forEach(client => {
    if (client.userId === userId.toString()) {
      client.res.write(`data: ${JSON.stringify(eventData)}\n\n`);
    }
  });
};

exports.getOrCreateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    let profile = await NovaAceProfile.findOne({ userId });
    if (!profile) {
      profile = await NovaAceProfile.create({ userId });
    }
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body;
    const profile = await NovaAceProfile.findOneAndUpdate({ userId }, updates, { new: true, upsert: true });
    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: "Failed to update profile", error: error.message });
  }
};

exports.createTaskDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const { content, conversationId } = req.body;
    const draft = await TaskDraft.create({ userId, content, conversationId });
    
    // Notify frontend immediately
    notifyUser(userId, { type: "TASK_DRAFT_CREATED", draftId: draft._id });
    
    res.status(201).json(draft);
  } catch (error) {
    res.status(500).json({ message: "Failed to create task draft", error: error.message });
  }
};

// Internal helper for other controllers (like userController) to trigger notifications
exports.notifyDraftCreated = (userId, draftId) => {
  notifyUser(userId, { type: "TASK_DRAFT_CREATED", draftId });
};

exports.getTaskDrafts = async (req, res) => {
  try {
    const userId = req.user.id;
    const drafts = await TaskDraft.find({ userId }).sort({ createdAt: -1 });
    res.json(drafts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch task drafts", error: error.message });
  }
};

exports.approveTaskDraft = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const draft = await TaskDraft.findOne({ _id: id, userId });
    if (!draft) return res.status(404).json({ message: "Draft not found" });

    draft.status = "approved";
    await draft.save();

    console.log(`[Handoff] Task Draft ${id} approved. Ready for Envelope Builder.`);
    res.json({ message: "Task draft approved", draft });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve task draft", error: error.message });
  }
};
