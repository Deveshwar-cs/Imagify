import sharp from "sharp";

import Image from "../models/image.models.js";

import cloudinary from "../config/cloudinary.js";

import {SUBSCRIPTION_PLANS} from "../config/subscription.plan.js";

export const uploadStoredImage = async (req, res) => {
  try {
    const user = req.user;

    // Check active subscription
    if (!user.subscription || user.subscription.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "An active subscription is required to store images.",
      });
    }

    // Get subscription plan
    const plan = SUBSCRIPTION_PLANS[user.subscription.plan];

    if (!plan) {
      return res.status(403).json({
        success: false,
        message: "Invalid subscription plan.",
      });
    }

    // Check file
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    // Count user's stored images
    const storedImageCount = await Image.countDocuments({
      user: user._id,
    });

    // Check plan limit
    if (storedImageCount >= plan.limit) {
      return res.status(429).json({
        success: false,
        message: `You have reached your ${plan.name} plan limit of ${plan.limit} images.`,
        usage: {
          used: storedImageCount,
          limit: plan.limit,
          remaining: 0,
        },
      });
    }

    // Get image metadata
    const metadata = await sharp(req.file.buffer).metadata();

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "imagify/stored-images",
          resource_type: "image",
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        },
      );

      uploadStream.end(req.file.buffer);
    });

    // Save image to MongoDB
    const image = await Image.create({
      user: user._id,
      originalName: req.file.originalname,
      fileName: result.public_id,
      mimeType: req.file.mimetype,
      size: req.file.size,
      width: metadata.width,
      height: metadata.height,
      url: result.secure_url,
    });

    return res.status(201).json({
      success: true,
      message: "Image stored successfully.",

      image: {
        id: image._id,
        originalName: image.originalName,
        fileName: image.fileName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
        url: image.url,
      },

      usage: {
        used: storedImageCount + 1,
        limit: plan.limit,
        remaining: plan.limit - (storedImageCount + 1),
      },
    });
  } catch (error) {
    console.error("Stored image upload error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to store image.",
    });
  }
};

export const getPublicImage = async (req, res) => {
  try {
    const {imageId} = req.params;

    const image = await Image.findById(imageId).select(
      "originalName fileName mimeType size width height url createdAt",
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    return res.status(200).json({
      success: true,
      image: {
        id: image._id,
        originalName: image.originalName,
        fileName: image.fileName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
        url: image.url,
        createdAt: image.createdAt,
      },
    });
  } catch (error) {
    console.error("Get public image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get image",
    });
  }
};

export const getStorageUsage = async (req, res) => {
  try {
    const user = req.user;

    if (!user.subscription || user.subscription.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "An active subscription is required.",
      });
    }

    const plan = SUBSCRIPTION_PLANS[user.subscription.plan];

    if (!plan) {
      return res.status(403).json({
        success: false,
        message: "Invalid subscription plan.",
      });
    }

    const used = await Image.countDocuments({
      user: user._id,
    });

    const remaining = Math.max(plan.limit - used, 0);

    return res.status(200).json({
      success: true,

      usage: {
        used,
        limit: plan.limit,
        remaining,
      },
    });
  } catch (error) {
    console.error("Get storage usage error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get storage usage.",
    });
  }
};

export const getStoredImages = async (req, res) => {
  try {
    const user = req.user;

    const images = await Image.find({
      user: user._id,
    })
      .sort({createdAt: -1})
      .select("originalName fileName mimeType size width height url createdAt");
    return res.status(200).json({
      success: true,

      count: images.length,

      images: images.map((image) => ({
        id: image._id,
        originalName: image.originalName,
        fileName: image.fileName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
        url: image.url,
        createdAt: image.createdAt,
      })),
    });
  } catch (error) {
    console.error("Get stored images error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get stored images.",
    });
  }
};

export const deleteStoredImage = async (req, res) => {
  try {
    const user = req.user;
    const {imageId} = req.params;

    const image = await Image.findOne({
      _id: imageId,
      user: user._id,
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    await cloudinary.uploader.destroy(image.fileName, {
      resource_type: "image",
    });

    await Image.findByIdAndDelete(image._id);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.error("Delete stored image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete image",
    });
  }
};
