import { GoogleGenerativeAI } from "@google/generative-ai";
import asyncHandler from "../utils/asyncHandler.js";

export const generateText = asyncHandler(async (req, res, next) => {
  // Check for the API key at the beginning of the request.
  if (!process.env.GOOGLE_API_KEY) {
    // It's important to return a JSON object for consistency.
    return res.status(500).json({
      message:
        "The GOOGLE_API_KEY environment variable is not configured on the server.",
    });
  }

  // Initialize the AI client within the handler to ensure it's always available
  // and to avoid startup errors in serverless environments.
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash-latest",
  });

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
