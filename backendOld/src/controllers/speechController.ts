import { Request, Response } from 'express';
import fs from 'fs';
// @ts-ignore
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Extend Express Request type to include 'file' for multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const speechToText = async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No audio file uploaded' });
  }

  const audioPath = req.file.path;
  try {
    // Use File if available, otherwise fallback to ReadStream
    let fileToSend: any;
    if (typeof File !== 'undefined') {
      const fileBuffer = fs.readFileSync(audioPath);
      fileToSend = new File([fileBuffer], 'recording.webm', { type: 'audio/webm' });
    } else {
      fileToSend = fs.createReadStream(audioPath);
    }
    const transcript = await openai.audio.transcriptions.create({
      file: fileToSend,
      model: 'whisper-1',
      response_format: 'text',
      language: 'en',
    });
    // Clean up uploaded file
    fs.unlink(audioPath, () => {});
    res.json({ transcript });
  } catch (error: any) {
    fs.unlink(audioPath, () => {});
    res.status(500).json({ error: error.message || 'Transcription failed' });
  }
}; 