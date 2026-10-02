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

    // Temporary input images used for this processing batch
    images: [
      {
        originalName: {
          type: String,
          required: true,
        },

        mimeType: {
          type: String,
          required: true,
        },

        size: {
          type: Number,
          required: true,
        },

        url: {
          type: String,
          required: true,
        },
      },
    ],

    // Temporary processed results
    results: [
      {
        originalName: {
          type: String,
          required: true,
        },

        operation: {
          type: String,
          required: true,
        },

        fileName: {
          type: String,
          required: true,
        },

        url: {
          type: String,
          required: true,
        },

        size: {
          type: Number,
          required: true,
        },

        width: {
          type: Number,
          required: true,
        },

        height: {
          type: Number,
          required: true,
        },

        mimeType: {
          type: String,
          required: true,
        },
      },
    ],

    cleanupAt: {
      type: Date,
      default: null,
      index: true,
    },

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

    // Prevent sending the batch completion notification more than once.
    notificationSent: {
      type: Boolean,
      default: false,
    },

    operation: {
      type: String,
      enum: ["resize", "compress", "quality", "upscale", "screenshot"],
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
