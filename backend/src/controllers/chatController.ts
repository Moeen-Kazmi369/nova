// import "../utils/pdf-setup";  // MUST be first
import { Request, Response } from 'express';

import Chat from '../models/Chat.js';
import Message from '../models/Message.js';
import fs from 'fs';
import path from 'path';
import Tesseract from 'tesseract.js';
import OpenAI from 'openai';
import pdfjs from "pdfjs-dist/legacy/build/pdf.js";

const { getDocument } = pdfjs;
import { createCanvas } from "canvas";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });


// List all chats for the user
export const listChats = async (req: any, res: Response) => {
  try {
    const chats = await Chat.find({ user: req.user.id }).sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
};

// Create a new chat
export const createChat = async (req: any, res: Response) => {
  try {
    const chat = await Chat.create({ user: req.user.id });
    res.status(201).json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create chat' });
  }
};

// Delete a chat
export const deleteChat = async (req: any, res: Response) => {
  try {
    const chat = await Chat.findOneAndDelete({ _id: req.params.chatId, user: req.user.id });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    await Message.deleteMany({ _id: { $in: chat.messages } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete chat' });
  }
};

// Rename a chat
export const renameChat = async (req: any, res: Response) => {
  const { title } = req.body;
  if (typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Invalid title' });
  }
  try {
    const chat = await Chat.findOneAndUpdate(
      { _id: req.params.chatId, user: req.user.id },
      { title, updatedAt: new Date() },
      { new: true }
    );
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: 'Failed to rename chat' });
  }
};

// Get messages for a chat
export const getChatMessages = async (req: any, res: Response) => {
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, user: req.user.id }).populate('messages');
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    res.json(chat.messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
};

// Add a message to a chat
export const addMessageToChat = async (req: any, res: Response) => {
  const { text, isUser } = req.body;
  if (typeof text !== 'string' || typeof isUser !== 'boolean') {
    return res.status(400).json({ error: 'Invalid message format' });
  }
  try {
    const chat = await Chat.findOne({ _id: req.params.chatId, user: req.user.id });
    if (!chat) return res.status(404).json({ error: 'Chat not found' });
    const message = await Message.create({
      user: req.user.id,
      text,
      isUser,
      timestamp: new Date(),
    });
    chat.messages.push(message._id);
    chat.updatedAt = new Date();
    await chat.save();
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add message' });
  }
};

export const uploadFileToChat = async (req: any, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  let extractedText = '';
  try {
    if (fileExt === '.pdf') {
      const pdfParse = (await import('pdf-parse')).default;
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } else if ([ '.png', '.jpg', '.jpeg', '.bmp', '.gif', '.webp' ].includes(fileExt)) {
      const { data: { text } } = await Tesseract.recognize(filePath, 'eng');
      extractedText = text;
    } else {
      extractedText = fs.readFileSync(filePath, 'utf-8');
    }
    const chat = await Chat.findOne({ _id: req.params.chatId, user: req.user.id });
    if (!chat) {
      fs.unlink(filePath, () => {});
      return res.status(404).json({ error: 'Chat not found' });
    }
    const message = await Message.create({
      user: req.user.id,
      text: extractedText,
      isUser: true,
      timestamp: new Date(),
    });
    chat.messages.push(message._id);
    chat.updatedAt = new Date();
    await chat.save();
    fs.unlink(filePath, () => {});
    res.status(201).json({ message: 'File processed and message added', extractedText });
  } catch (err: any) {
    fs.unlink(filePath, () => {});
    res.status(500).json({ error: err.message || 'Failed to process file' });
  }
};

export const uploadMessageWithFile = async (req: any, res: any) => {
  if (!req.file || !req.body.prompt) {
    return res.status(400).json({ error: "File and prompt are required" });
  }

  const filePath = req.file.path;
  const fileExt = path.extname(req.file.originalname).toLowerCase();
  let extractedText = "";
  let messages: any[] = [{ role: "user", content: [] }];

  try {
    // Handle different file types
    if (fileExt === ".pdf") {
      const pdfParse = (await import("pdf-parse")).default;
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
      messages[0].content.push({
        type: "text",
        text: `${req.body.prompt}\n\n[File Content]:\n${extractedText}`,
      });
    } else if (
      [".png", ".jpg", ".jpeg", ".bmp", ".gif", ".webp"].includes(fileExt)
    ) {
      // Convert image to base64 for OpenAI vision API
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString("base64");
      const mimeType = req.file.mimetype;

      // Optional: Extract text with Tesseract for additional context
      const {
        data: { text },
      } = await Tesseract.recognize(filePath, "eng");
      extractedText = text;

      messages[0].content.push(
        {
          type: "text",
          text: `${req.body.prompt}\n\n[Extracted Text from Image]:\n${extractedText}`,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
          },
        }
      );
    } else {
      extractedText = fs.readFileSync(filePath, "utf-8");
      messages[0].content.push({
        type: "text",
        text: `${req.body.prompt}\n\n[File Content]:\n${extractedText}`,
      });
    }

    // Save user message to database
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      user: req.user.id,
    });
    if (!chat) {
      fs.unlink(filePath, () => {});
      return res.status(404).json({ error: "Chat not found" });
    }

    const userMessage = await Message.create({
      user: req.user.id,
      text: `${req.body.prompt}\n\n[File Name]: ${req.file.originalname}`,
      isUser: true,
      timestamp: new Date(),
      file: {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: req.file.path,
      },
    });

    chat.messages.push(userMessage._id);
    chat.updatedAt = new Date();
    await chat.save();

    // Call OpenAI API
    const aiResponse = await openai.chat.completions.create({
      model: "gpt-4o", // Use vision-capable model
      max_tokens: 500,
      messages,
    });

    const aiText =
      aiResponse.choices[0]?.message?.content ||
      "AI did not return a response.";

    // Save AI response to database
    const aiMessage = await Message.create({
      user: req.user.id,
      text: aiText,
      isUser: false,
      timestamp: new Date(),
    });

    chat.messages.push(aiMessage._id);
    chat.updatedAt = new Date();
    await chat.save();

    // Clean up temporary file
    fs.unlink(filePath, () => {});

    // Send response
    res.status(201).json({
      message: "File and prompt processed successfully",
      userMessage,
      aiMessage,
      extractedText,
    });
  } catch (err: any) {
    fs.unlink(filePath, () => {});
    console.error(err);
    let errorMessage = "Failed to process file and prompt. Please try again.";
    if (err.code === "ENOSPC") {
      errorMessage = "Server storage is full. Please try again later.";
    } else if (err.message.includes("network")) {
      errorMessage =
        "Network error. Please check your connection and try again.";
    } else if (err.message.includes("rate_limit")) {
      errorMessage = "Rate limit exceeded. Please wait a moment and try again.";
    }
    res.status(500).json({ error: errorMessage });
  }
};

