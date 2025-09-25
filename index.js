import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import apiRoutes from "./routes/apiRoutes.js";
import errorHandler from "./middleware/errorMiddleware.js";

// --- Configuração de Caminho para ES Modules (Correto) ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
app.use(express.json());

// Serve static files from the 'public' folder
app.use(express.static(path.join(__dirname, "public")));

// Use API routes with the /api prefix
app.use("/api", apiRoutes);

// Add the error handling middleware.
app.use(errorHandler);

export default app;
