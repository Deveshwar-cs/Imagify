import mongoose from "mongoose";

const processingBatchSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    imageIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Image",
      },
    ],

    totalImages: {
      type: Number,
      required: true,
    },

    completedImages: {
      type: Number,
      default: 0,
    },

    failedImages: {
      type: Number,
      default: 0,
    },

    operation: {
      type: String,
      enum: ["resize", "compress", "quality", "upscale"],
      required: true,
    },

    options: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
);

const ProcessingBatch = mongoose.model(
  "ProcessingBatch",
  processingBatchSchema,
);

export default ProcessingBatch;
