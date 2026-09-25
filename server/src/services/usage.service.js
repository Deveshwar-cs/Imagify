import GuestUsage from "../models/guest.usage.model.js";
import User from "../models/user.model.js";

import {
  GUEST_IMAGE_LIMIT,
  AUTHENTICATED_IMAGE_LIMIT,
} from "../config/usage.config.js";

/*
|--------------------------------------------------------------------------
| Get Guest Usage
|--------------------------------------------------------------------------
*/

export const getGuestUsage = async (guestId) => {
  if (!guestId) {
    throw new Error("Guest ID is required");
  }

  let usage = await GuestUsage.findOne({guestId});

  if (!usage) {
    usage = await GuestUsage.create({
      guestId,
      usageCount: 0,
    });
  }

  return usage;
};

/*
|--------------------------------------------------------------------------
| Reserve Guest Usage
|--------------------------------------------------------------------------
|
| Atomically checks the limit and increments usage.
|
*/

export const reserveGuestUsage = async (guestId, imageCount) => {
  if (!guestId) {
    throw new Error("Guest ID is required");
  }

  if (!Number.isInteger(imageCount) || imageCount <= 0) {
    throw new Error("Image count must be a positive integer");
  }

  // Make sure the guest has a usage document
  await getGuestUsage(guestId);

  // Atomically check the limit and increment usage
  const usage = await GuestUsage.findOneAndUpdate(
    {
      guestId,
      usageCount: {
        $lte: GUEST_IMAGE_LIMIT - imageCount,
      },
    },
    {
      $inc: {
        usageCount: imageCount,
      },
    },
    {
      new: true,
    },
  );

  if (!usage) {
    const currentUsage = await getGuestUsage(guestId);

    return {
      success: false,
      message: "You've reached your image processing limit.",
      usage: currentUsage,
    };
  }

  return {
    success: true,
    usage,
  };
};
/*
|--------------------------------------------------------------------------
| Get Authenticated User Usage
|--------------------------------------------------------------------------
*/

export const getUserUsage = async (userId) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  const user = await User.findById(userId).select("usageCount");

  if (!user) {
    throw new Error("User not found");
  }

  return user;
};

/*
|--------------------------------------------------------------------------
| Reserve Authenticated User Usage
|--------------------------------------------------------------------------
|
| Atomically checks the 10-image limit and increments usage.
|
*/

export const reserveUserUsage = async (userId, imageCount) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!Number.isInteger(imageCount) || imageCount <= 0) {
    throw new Error("Image count must be a positive integer");
  }

  const user = await User.findOneAndUpdate(
    {
      _id: userId,

      usageCount: {
        $lte: AUTHENTICATED_IMAGE_LIMIT - imageCount,
      },
    },
    {
      $inc: {
        usageCount: imageCount,
      },
    },
    {
      new: true,
    },
  ).select("usageCount");

  if (!user) {
    const currentUsage = await getUserUsage(userId);

    return {
      success: false,
      message: "You've reached your image processing limit.",
      usage: currentUsage,
    };
  }

  return {
    success: true,
    usage: user,
  };
};

/**
 * |--------------------------------------------------------------------------
 * | Release Guest Usage
 * |--------------------------------------------------------------------------
 * |
 * | Decreases guest usage when reserved processing cannot be completed.
 * |
 * |--------------------------------------------------------------------------
 */
export const releaseGuestUsage = async (guestId, imageCount) => {
  if (!guestId) {
    throw new Error("Guest ID is required");
  }

  if (!Number.isInteger(imageCount) || imageCount <= 0) {
    throw new Error("Image count must be a positive integer");
  }

  const usage = await GuestUsage.findOneAndUpdate(
    {
      guestId,
      usageCount: {
        $gte: imageCount,
      },
    },
    {
      $inc: {
        usageCount: -imageCount,
      },
    },
    {
      new: true,
    },
  );

  return usage;
};

/**
 * |--------------------------------------------------------------------------
 * | Release Authenticated User Usage
 * |--------------------------------------------------------------------------
 * |
 * | Decreases user usage when reserved processing cannot be completed.
 * |
 * |--------------------------------------------------------------------------
 */
export const releaseUserUsage = async (userId, imageCount) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!Number.isInteger(imageCount) || imageCount <= 0) {
    throw new Error("Image count must be a positive integer");
  }

  const user = await User.findOneAndUpdate(
    {
      _id: userId,
      usageCount: {
        $gte: imageCount,
      },
    },
    {
      $inc: {
        usageCount: -imageCount,
      },
    },
    {
      new: true,
    },
  ).select("usageCount");

  return user;
};
