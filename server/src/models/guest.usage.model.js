import mongoose from "mongoose";

const guestUsageSchema = new mongoose.Schema(
  {
    guestId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

const GuestUsage = mongoose.model("GuestUsage", guestUsageSchema);

export default GuestUsage;
