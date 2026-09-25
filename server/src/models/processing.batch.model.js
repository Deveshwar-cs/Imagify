import mongoose from "mongoose";

const processingBatchSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },

    guestId: {
      type: String,
      default: null,
      index: true,
    },

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

    // Prevent sending the batch completion
    // notification more than once.
    notificationSent: {
      type: Boolean,
      default: false,
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
