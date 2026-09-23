import jwt from "jsonwebtoken";

import User from "../models/user.model.js";
import {verifyGoogleToken} from "../services/google.auth.service.js";

export const googleLogin = async (req, res) => {
  try {
    const {credential} = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: "Google credential is required",
      });
    }

    const payload = await verifyGoogleToken(credential);

    const {sub: googleId, name, email, picture, email_verified} = payload;

    if (!email_verified) {
      return res.status(401).json({
        success: false,
        message: "Google email is not verified",
      });
    }

    let user = await User.findOne({
      googleId,
    });

    if (!user) {
      user = await User.create({
        googleId,
        name,
        email,
        picture,
        usageCount: 0,
      });
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("authToken", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: false,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Google login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        usageCount: user.usageCount,
      },
    });
  } catch (error) {
    console.error("Google login error:", error);

    return res.status(401).json({
      success: false,
      message: "Google authentication failed",
    });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user;

    return res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        picture: user.picture,
        usageCount: user.usageCount,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to get current user",
    });
  }
};

export const logout = (req, res) => {
  res.clearCookie("authToken", {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
  });

  return res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
