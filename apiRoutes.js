import { Router } from "express";
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

const router = Router();

// Configure Multer to use memory storage instead of disk storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Initialize the Google AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

router.post("/gerar-texto", upload.single("image"), async (req, res, next) => {
  try {
    const { prompt, history } = req.body;

    // Use the gemini-pro-vision model if an image is uploaded
    const modelName = req.file ? "gemini-pro-vision" : "gemini-pro";
    const model = genAI.getGenerativeModel({ model: modelName });

    const chatHistory = history ? JSON.parse(history) : [];
    const chat = model.startChat({ history: chatHistory });

    const parts = [];
    if (req.file) {
      // If there's a file, convert it to a part object for the API
      parts.push({
        inlineData: {
          mimeType: req.file.mimetype,
          data: req.file.buffer.toString("base64"),
        },
      });
    }
    parts.push({ text: prompt });

    const result = await chat.sendMessageStream(parts);

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    for await (const chunk of result.stream) {
      res.write(chunk.text());
    }
    res.end();
  } catch (error) {
    // Pass the error to the centralized error handler
    next(error);
  }
});

export default router;
