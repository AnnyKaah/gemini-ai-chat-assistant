import { validationResult } from "express-validator";
import { GoogleGenerativeAI } from "@google/generative-ai";
import asyncHandler from "../utils/asyncHandler.js";

// Check for the API key on initialization
if (!process.env.GOOGLE_API_KEY) {
  throw new Error(
    "The GOOGLE_API_KEY environment variable is not set. Create a .env file and add the key."
  );
}

// Initialize the AI client once for reuse
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest", // Use model from .env, with a fallback
});

export const generateText = asyncHandler(async (req, res, next) => {
  // Run validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // With multer, text data comes from req.body and the file from req.file
  const { prompt, personality } = req.body;
  const history = req.body.history ? JSON.parse(req.body.history) : [];
  const imageFile = req.file;
  // Build the prompt parts for the API
  const promptParts = [prompt];

  if (imageFile) {
    promptParts.push({
      inlineData: {
        mimeType: imageFile.mimetype,
        data: imageFile.buffer.toString("base64"),
      },
    });
  }

  const personalityInstructions = {
    sarcastic: [
      {
        role: "user",
        parts: [
          {
            text: "From now on, you are a witty and sarcastic assistant. Please respond as such.",
          },
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: "Oh, fantastic. Another chat. Just what I needed. *Sigh*. What do you want?",
          },
        ],
      },
    ],
    pirate: [
      {
        role: "user",
        parts: [{ text: "From now on, you are a pirate." }],
      },
      {
        role: "model",
        parts: [{ text: "Arrr, matey! What be the news?" }],
      },
    ],
    shakespeare: [
      {
        role: "user",
        parts: [{ text: "From now on, you speak like Shakespeare." }],
      },
      {
        role: "model",
        parts: [
          { text: "Speak, noble user! How may I serve thee on this fine day?" },
        ],
      },
    ],
  };

  const chatHistory =
    personality && personalityInstructions[personality]
      ? [...personalityInstructions[personality], ...history]
      : history;

  const chat = model.startChat({
    history: chatHistory,
  });

  const result = await chat.sendMessageStream(promptParts);

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");

  for await (const chunk of result.stream) {
    res.write(chunk.text());
  }

  res.end();
});
