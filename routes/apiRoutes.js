import { Router } from "express";
import { body } from "express-validator";
import multer from "multer";
import { generateText } from "../controllers/textController.js";

const router = Router();

// Configure multer to store the image in memory
const upload = multer({ storage: multer.memoryStorage() });

// Define validation rules for the /gerar-texto route
const validateGenerateText = [
  body("prompt")
    .isString()
    .withMessage("The prompt must be a string.")
    .notEmpty()
    .withMessage("The prompt cannot be empty.")
    .isLength({ max: 5000 })
    .withMessage("The prompt cannot exceed 5000 characters.")
    .trim(),
  // Add validation for the optional history
  body("history")
    .optional()
    .isJSON()
    .withMessage("History must be a valid JSON string."),
  // Add validation for the optional personality
  body("personality")
    .optional()
    .isString()
    .isIn(["default", "pirate", "shakespeare", "sarcastic"])
    .withMessage("Invalid personality."),
];

router.post(
  "/gerar-texto",
  upload.single("image"), // Middleware to process a single file named 'image'
  validateGenerateText,
  generateText
);

export default router;
