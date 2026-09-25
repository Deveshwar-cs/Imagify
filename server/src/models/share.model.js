import mongoose from "mongoose";

const shareSchema = new mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ProcessingBatch",
      required: true,
      index: true,
    },

    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Automatically remove expired share documents
shareSchema.index({expiresAt: 1}, {expireAfterSeconds: 0});

const Share = mongoose.model("Share", shareSchema);

export default Share;
