import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  isUser: { type: Boolean, required: true },
  timestamp: { type: Date, default: Date.now },
  file: {
    originalname: String,
    mimetype: String,
    size: Number,
    path: String
  }
});

const Message = mongoose.model('Message', messageSchema);
export default Message; 