import express from "express";
import dotenv from "dotenv";
import apiRoutes from "./routes/apiRoutes.js";
import errorHandler from "./middleware/errorMiddleware.js";

dotenv.config();

const app = express();
app.use(express.json());

// Serve static files from the 'public' folder (our frontend)
app.use(express.static("public"));

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
