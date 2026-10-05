import sharp from "sharp";

import Image from "../models/image.models.js";

import {SUBSCRIPTION_PLANS} from "../config/subscription.plan.js";

import {uploadBufferToCloudinary} from "../services/image.service.js";
import ProcessingBatch from "../models/processing.batch.model.js";
import {
  downloadImageToTemp,
  uploadToCloudinary,
  cleanupTempFile,
} from "../services/image.service.js";
import cloudinary from "../config/cloudinary.js";

export const uploadStoredImage = async (req, res) => {
  try {
    const user = req.user;

    // -----------------------------------------
    // CHECK ACTIVE SUBSCRIPTION
    // -----------------------------------------

    if (!user.subscription || user.subscription.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "An active subscription is required to store images.",
      });
    }

    // -----------------------------------------
    // GET SUBSCRIPTION PLAN
    // -----------------------------------------

    const plan = SUBSCRIPTION_PLANS[user.subscription.plan];

    if (!plan) {
      return res.status(403).json({
        success: false,
        message: "Invalid subscription plan.",
      });
    }

    // -----------------------------------------
    // CHECK FILE
    // -----------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image.",
      });
    }

    // -----------------------------------------
    // COUNT USER'S STORED IMAGES
    // -----------------------------------------

    const storedImageCount = await Image.countDocuments({
      user: user._id,
    });

    // -----------------------------------------
    // CHECK STORAGE LIMIT
    // -----------------------------------------

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

    // -----------------------------------------
    // GET IMAGE METADATA
    // -----------------------------------------

    const metadata = await sharp(req.file.buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return res.status(400).json({
        success: false,
        message: "Unable to read image dimensions.",
      });
    }

    // -----------------------------------------
    // UPLOAD TO CLOUDINARY
    // -----------------------------------------

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "imagify/storage/originals",
    );

    // -----------------------------------------
    // SAVE IMAGE TO MONGODB
    // -----------------------------------------

    const image = await Image.create({
      user: user._id,

      // This is permanent authenticated storage.
      // guestId is intentionally not used here.

      originalName: req.file.originalname,

      fileName: result.public_id,

      mimeType: req.file.mimetype,

      size: req.file.size,

      width: metadata.width,

      height: metadata.height,

      url: result.secure_url,
    });

    // -----------------------------------------
    // CALCULATE UPDATED USAGE
    // -----------------------------------------

    const used = storedImageCount + 1;

    const remaining = Math.max(plan.limit - used, 0);

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

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
        used,
        limit: plan.limit,
        remaining,
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

// =========================================
// GET PUBLIC IMAGE
// =========================================

export const getPublicImage = async (req, res) => {
  try {
    const {imageId} = req.params;

    const image = await Image.findById(imageId).select(
      "originalName fileName mimeType size width height url createdAt",
    );

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found.",
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
      message: "Failed to get image.",
    });
  }
};

// =========================================
// GET STORAGE USAGE
// =========================================

export const getStorageUsage = async (req, res) => {
  try {
    const user = req.user;

    // -----------------------------------------
    // CHECK ACTIVE SUBSCRIPTION
    // -----------------------------------------

    if (!user.subscription || user.subscription.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "An active subscription is required.",
      });
    }

    // -----------------------------------------
    // GET PLAN
    // -----------------------------------------

    const plan = SUBSCRIPTION_PLANS[user.subscription.plan];

    if (!plan) {
      return res.status(403).json({
        success: false,
        message: "Invalid subscription plan.",
      });
    }

    // -----------------------------------------
    // COUNT STORED IMAGES
    // -----------------------------------------

    const used = await Image.countDocuments({
      user: user._id,
    });

    const remaining = Math.max(plan.limit - used, 0);

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

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

// =========================================
// GET USER'S STORED IMAGES
// =========================================

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

// =========================================
// DELETE STORED IMAGE
// =========================================

export const deleteStoredImage = async (req, res) => {
  try {
    const user = req.user;

    const {imageId} = req.params;

    // -----------------------------------------
    // FIND IMAGE BELONGING TO CURRENT USER
    // -----------------------------------------

    const image = await Image.findOne({
      _id: imageId,
      user: user._id,
    });

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found.",
      });
    }

    // -----------------------------------------
    // DELETE FROM CLOUDINARY
    // -----------------------------------------

    await cloudinary.uploader.destroy(image.fileName, {
      resource_type: "image",
    });

    // -----------------------------------------
    // DELETE FROM MONGODB
    // -----------------------------------------

    await Image.findByIdAndDelete(image._id);

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully.",
    });
  } catch (error) {
    console.error("Delete stored image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete image.",
    });
  }
};

export const saveProcessedImage = async (req, res) => {
  let tempFilePath = null;

  try {
    const {batchId, resultId} = req.body;

    if (!batchId || !resultId) {
      return res.status(400).json({
        success: false,
        message: "Batch ID and result ID are required",
      });
    }

    const user = req.user;

    // ------------------------------------------------------------
    // 1. Check user's subscription
    // ------------------------------------------------------------

    const currentPlan = user.subscription?.plan;

    if (!currentPlan || currentPlan === "none") {
      return res.status(403).json({
        success: false,
        message: "An active subscription is required to save images.",
      });
    }

    const selectedPlan = SUBSCRIPTION_PLANS[currentPlan];

    if (!selectedPlan) {
      return res.status(400).json({
        success: false,
        message: "Invalid subscription plan",
      });
    }

    // ------------------------------------------------------------
    // 2. Find the processing batch
    // ------------------------------------------------------------

    const batch = await ProcessingBatch.findOne({
      _id: batchId,
      user: user._id,
      status: "completed",
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Processing batch not found",
      });
    }

    // ------------------------------------------------------------
    // 3. Find the processed result
    // ------------------------------------------------------------

    const processedResult = batch.results.id(resultId);

    if (!processedResult) {
      return res.status(404).json({
        success: false,
        message: "Processed image not found",
      });
    }

    // ------------------------------------------------------------
    // 4. Check whether this image is already saved
    // ------------------------------------------------------------

    const existingImage = await Image.findOne({
      user: user._id,
      url: processedResult.url,
    });

    if (existingImage) {
      return res.status(200).json({
        success: true,
        message: "Image is already saved to storage",
        image: existingImage,
      });
    }

    // ------------------------------------------------------------
    // 5. Check storage quota
    // ------------------------------------------------------------

    const storedImageCount = await Image.countDocuments({
      user: user._id,
    });

    if (storedImageCount >= selectedPlan.limit) {
      return res.status(403).json({
        success: false,
        message: "You have reached your storage limit.",
      });
    }

    // ------------------------------------------------------------
    // 6. Download processed image temporarily
    // ------------------------------------------------------------

    tempFilePath = await downloadImageToTemp(processedResult.url);

    // ------------------------------------------------------------
    // 7. Upload to permanent storage
    // ------------------------------------------------------------

    const cloudinaryResult = await uploadToCloudinary(
      tempFilePath,
      "imagify/storage/processed",
    );

    // ------------------------------------------------------------
    // 8. Create permanent Image document
    // ------------------------------------------------------------

    const savedImage = await Image.create({
      user: user._id,
      guestId: null,

      originalName: processedResult.originalName,

      fileName: cloudinaryResult.public_id,

      mimeType: processedResult.mimeType,

      size: processedResult.size,

      width: processedResult.width,

      height: processedResult.height,

      url: cloudinaryResult.secure_url,
    });

    return res.status(201).json({
      success: true,
      message: "Processed image saved to storage",
      image: savedImage,
    });
  } catch (error) {
    console.error("Save processed image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to save processed image",
    });
  } finally {
    // ------------------------------------------------------------
    // Always remove temporary file
    // ------------------------------------------------------------

    await cleanupTempFile(tempFilePath);
  }
};
