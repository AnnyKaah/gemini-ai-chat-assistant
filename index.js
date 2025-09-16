import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/apiRoutes.js";
import errorHandler from "./middleware/errorMiddleware.js";

// Set up __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());

// Serve static files from the 'public' folder using an absolute path
app.use(express.static(path.join(__dirname, "public")));

// Use API routes with the /api prefix to avoid conflicts
app.use("/api", apiRoutes);

// Add the error handling middleware. It must be the last middleware.
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

// Start the server only if not in test mode
if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
