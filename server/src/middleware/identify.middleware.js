import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const identifyUserOrGuest = async (req, res, next) => {
  try {
    const token = req.cookies.authToken;

    // Logged-in user
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.userId);

        if (user) {
          req.user = user;
          return next();
        }
      } catch (error) {
        // Invalid auth token.
        // Continue as guest.
      }
    }

    // Guest user
    let guestId = req.cookies.guestId;

    if (!guestId) {
      const crypto = await import("crypto");

      guestId = crypto.randomUUID();

      res.cookie("guestId", guestId, {
        httpOnly: true,
        sameSite: "lax",
        secure: false,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    req.guestId = guestId;

    next();
  } catch (error) {
    console.error("Identity middleware error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to identify user",
    });
  }
};
