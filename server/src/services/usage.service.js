import GuestUsage from "../models/guest.usage.model.js";
import User from "../models/user.model.js";

import {GUEST_IMAGE_LIMIT} from "../config/usage.config.js";

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
      processCount: 0,
    });
  }

  return usage;
};

/*
|--------------------------------------------------------------------------
| Reserve Guest Usage
|--------------------------------------------------------------------------
|
| Atomically checks the limit and increments processCount.
|
*/

export const reserveGuestUsage = async (guestId, imageCount) => {
  if (!guestId) {
    throw new Error("Guest ID is required");
  }

  if (!Number.isInteger(imageCount) || imageCount <= 0) {
    throw new Error("Image count must be a positive integer");
  }

  // Make sure the guest has a usage document.
  await getGuestUsage(guestId);

  // Atomically check the limit and increment usage.
  const usage = await GuestUsage.findOneAndUpdate(
    {
      guestId,
      processCount: {
        $lte: GUEST_IMAGE_LIMIT - imageCount,
      },
    },
    {
      $inc: {
        processCount: imageCount,
      },
    },
    {
      returnDocument: "after",
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

  const user = await User.findById(userId).select("usage");

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
| Atomically checks the caller-supplied limit and
| increments usage.processCount.
|
*/

export const reserveUserUsage = async (userId, imageCount, limit) => {
  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!Number.isInteger(imageCount) || imageCount <= 0) {
    throw new Error("Image count must be a positive integer");
  }

  if (!Number.isInteger(limit) || limit < 0) {
    throw new Error("Limit must be a non-negative integer");
  }

  const user = await User.findOneAndUpdate(
    {
      _id: userId,

      "usage.processCount": {
        $lte: limit - imageCount,
      },
    },
    {
      $inc: {
        "usage.processCount": imageCount,
      },
    },
    {
      returnDocument: "after",
    },
  ).select("usage");

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

/*
|--------------------------------------------------------------------------
| Release Guest Usage
|--------------------------------------------------------------------------
|
| Decreases guest processCount when reserved
| processing cannot be completed.
|
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

      processCount: {
        $gte: imageCount,
      },
    },
    {
      $inc: {
        processCount: -imageCount,
      },
    },
    {
      returnDocument: "after",
    },
  );

  return usage;
};

/*
|--------------------------------------------------------------------------
| Release Authenticated User Usage
|--------------------------------------------------------------------------
|
| Decreases user usage.processCount when reserved
| processing cannot be completed.
|
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

      "usage.processCount": {
        $gte: imageCount,
      },
    },
    {
      $inc: {
        "usage.processCount": -imageCount,
      },
    },
    {
      returnDocument: "after",
    },
  ).select("usage");

  return user;
};
