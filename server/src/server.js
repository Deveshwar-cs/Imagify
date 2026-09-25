import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import imageRoutes from "./routes/image.routes.js";
import connectDB from "./config/database.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
import {handleStripeWebhook} from "./controllers/subscription.webhook.controller.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import storageRoutes from "./routes/storage.routes.js";

dotenv.config();
const app = express();
connectDB();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://imagify.com",
      "https://imagify-taupe-iota.vercel.app",
    ],
    credentials: true,
  }),
);

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Imagify api is running",
  });
});

app.post(
  "/api/subscription/webhook",
  express.raw({
    type: "application/json",
  }),
  handleStripeWebhook,
);

app.use(express.json());
app.use(cookieParser());
app.use("/api/subscription", subscriptionRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/storage", storageRoutes);

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  if (error.name === "MulterError") {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 10 MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.message === "Only JPG, PNG, and WEBP images are allowed") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
  });
});

app.listen(PORT, () => {
  console.log(`Imagify server running on http://localhost:${PORT}`);
});
