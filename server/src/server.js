import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import imageRoutes from "./routes/image.routes.js";
import authRoutes from "./routes/auth.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import storageRoutes from "./routes/storage.routes.js";

import connectDB from "./config/database.js";

import {handleStripeWebhook} from "./controllers/subscription.webhook.controller.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// =========================================
// DATABASE
// =========================================

connectDB();

// =========================================
// CORS
// =========================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:4173",
      "https://imagify.com",
      "https://imagify-taupe-iota.vercel.app",
      "https://imagify-git-main-logic-lords.vercel.app",
      "https://polyester-rocky-material.ngrok-free.dev",
    ],
    credentials: true,
  }),
);

// =========================================
// HEALTH CHECK
// =========================================

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Imagify api is running",
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Imagify api is running",
  });
});

// =========================================
// STRIPE WEBHOOK
// =========================================

// IMPORTANT:
// This route must come BEFORE express.json().
//
// Stripe needs the original raw request body
// to verify the webhook signature.

app.post(
  "/api/subscription/webhook",

  express.raw({
    type: "application/json",
  }),

  handleStripeWebhook,
);

// =========================================
// GLOBAL BODY PARSERS
// =========================================

app.use(express.json());

app.use(cookieParser());

// =========================================
// ROUTES
// =========================================

app.use("/api/subscription", subscriptionRoutes);

app.use("/api/images", imageRoutes);

app.use("/api/auth", authRoutes);

app.use("/api/storage", storageRoutes);

// =========================================
// ERROR HANDLER
// =========================================

app.use((error, req, res, next) => {
  console.error("Server error:", error);

  // -----------------------------------------
  // MULTER ERRORS
  // -----------------------------------------

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

  // -----------------------------------------
  // FILE TYPE ERROR
  // -----------------------------------------

  if (error.message === "Only JPG, PNG, and WEBP images are allowed") {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // -----------------------------------------
  // DEFAULT ERROR
  // -----------------------------------------

  return res.status(500).json({
    success: false,
    message: "Something went wrong on the server.",
  });
});

// =========================================
// START SERVER
// =========================================

app.listen(PORT, () => {
  console.log(`Imagify server running on http://localhost:${PORT}`);
});
