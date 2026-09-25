import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
      trim: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      immutable: true,
    },

    picture: {
      type: String,
      default: "",
    },

    /*
    |--------------------------------------------------------------------------
    | Usage
    |--------------------------------------------------------------------------
    */

    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
    |--------------------------------------------------------------------------
    | Subscription
    |--------------------------------------------------------------------------
    */

    subscription: {
      plan: {
        type: String,
        enum: ["none", "starter", "premium", "enterprise"],
        default: "none",
      },

      status: {
        type: String,
        enum: ["inactive", "active", "past_due", "canceled", "incomplete"],
        default: "inactive",
      },

      stripeCustomerId: {
        type: String,
        default: "",
        immutable: true,
      },

      stripeSubscriptionId: {
        type: String,
        default: "",
      },

      currentPeriodEnd: {
        type: Date,
        default: null,
      },

      cancelAtPeriodEnd: {
        type: Boolean,
        default: false,
      },

      scheduledPlan: {
        type: String,
        enum: ["none", "starter", "premium", "enterprise"],
        default: "none",
      },

      scheduledPlanDate: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
