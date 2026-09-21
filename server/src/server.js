import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import imageRoutes from "./routes/image.routes.js";
import connectDB from "./config/database.js";

const app = express();
dotenv.config();
connectDB();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://imagify.com",
      "https://imagify-taupe-iota.vercel.app",
    ],
  }),
);

app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Imagify api is running",
  });
});

app.use("/uploads", express.static("uploads"));
app.use("/api/images", imageRoutes);

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
