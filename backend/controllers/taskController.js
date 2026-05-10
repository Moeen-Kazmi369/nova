const TaskDraft = require("../models/TaskDraft");
const NovaAceProfile = require("../models/NovaAceProfile");

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
    res.status(201).json(draft);
  } catch (error) {
    res.status(500).json({ message: "Failed to create task draft", error: error.message });
  }
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

    // HAND-OFF TO ENVELOPE BUILDER (Subham's Side)
    // For now, we just simulate the conversion
    console.log(`[Handoff] Task Draft ${id} approved. Ready for Envelope Builder.`);

    res.json({ message: "Task draft approved", draft });
  } catch (error) {
    res.status(500).json({ message: "Failed to approve task draft", error: error.message });
  }
};
