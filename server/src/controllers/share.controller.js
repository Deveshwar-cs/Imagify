import crypto from "crypto";

import Share from "../models/share.model.js";
import ProcessingBatch from "../models/processing.batch.model.js";
import Image from "../models/image.models.js";
import sharp from "sharp";
import cloudinary from "../config/cloudinary.js";
import {
  PLAN_STORAGE_LIMITS,
  GUEST_STORAGE_LIMIT,
} from "../config/usage.config.js";

const getOwnerQuery = (req) => {
  if (req.user) {
    return {
      user: req.user._id,
      guestId: null,
    };
  }

  return {
    user: null,
    guestId: req.guestId,
  };
};

export const createShare = async (req, res) => {
  try {
    const {batchId} = req.body;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required",
      });
    }

    const batch = await ProcessingBatch.findById(batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Processing batch not found!",
      });
    }

    // Share only completed batches
    if (batch.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Image must be completely processed before sharing.",
      });
    }

    // Generate temporary token
    const token = crypto.randomBytes(32).toString("hex");

    // Link expires after 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const share = await Share.create({
      token,
      batchId: batch._id,
      expiresAt,
    });

    const shareUrl = `${process.env.CLIENT_URL}/share/${token}`;

    console.log("Share link created:", shareUrl);
    console.log("Share expires at:", expiresAt);

    return res.status(201).json({
      success: true,
      message: "Share link created successfully",
      share: {
        token: share.token,
        expiresAt: share.expiresAt,
        url: shareUrl,
      },
    });
  } catch (error) {
    console.error("Create share error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create share link",
    });
  }
};

export const getSharedResults = async (req, res) => {
  try {
    const {token} = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Share token is required",
      });
    }

    const share = await Share.findOne({token});

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share link not found!",
      });
    }

    // Check expiration
    if (share.expiresAt <= new Date()) {
      return res.status(410).json({
        success: false,
        message: "Share link has expired",
      });
    }

    const batch = await ProcessingBatch.findById(share.batchId).populate(
      "imageIds",
    );

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Shared processing results not found",
      });
    }

    const sharedImages = batch.imageIds.map((image) => {
      const processedImage =
        image.processedImages?.[image.processedImages.length - 1];

      return {
        id: image._id,
        originalName: image.originalName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,

        processedImage: processedImage
          ? {
              size: processedImage.size,
              width: processedImage.width,
              height: processedImage.height,
              mimeType: processedImage.mimeType,
            }
          : null,
      };
    });

    return res.status(200).json({
      success: true,

      share: {
        expiresAt: share.expiresAt,
      },

      batch: {
        id: batch._id,
        status: batch.status,
        operation: batch.operation,
        options: batch.options,
        totalImages: batch.totalImages,
        completedImages: batch.completedImages,
        failedImages: batch.failedImages,

        progress:
          batch.totalImages > 0
            ? Math.round((batch.completedImages / batch.totalImages) * 100)
            : 0,

        images: sharedImages,
      },
    });
  } catch (error) {
    console.error("Get shared result error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to get shared results",
    });
  }
};

export const getSharedProcessedImage = async (req, res) => {
  try {
    const {token, imageId} = req.params;

    console.log("Shared image request:", {
      token,
      imageId,
    });

    if (!token || !imageId) {
      return res.status(400).json({
        success: false,
        message: "Share token and image ID are required",
      });
    }

    // Find share
    const share = await Share.findOne({token});

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share link not found",
      });
    }

    // Check expiration
    if (share.expiresAt <= new Date()) {
      return res.status(410).json({
        success: false,
        message: "Share link has expired",
      });
    }

    // Find batch
    const batch = await ProcessingBatch.findById(share.batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Shared processing results not found",
      });
    }

    // Make sure this image belongs to this shared batch
    const imageBelongsToBatch = batch.imageIds.some(
      (id) => id.toString() === imageId,
    );

    if (!imageBelongsToBatch) {
      return res.status(404).json({
        success: false,
        message: "Image not found in the shared batch",
      });
    }

    // Find image
    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    // Get latest processed image
    const processedImage =
      image.processedImages?.[image.processedImages.length - 1];

    if (!processedImage) {
      return res.status(404).json({
        success: false,
        message: "Processed image not found",
      });
    }

    console.log("Fetching processed image from Cloudinary:");
    console.log(processedImage.url);

    // Fetch Cloudinary image from backend
    const cloudinaryResponse = await fetch(processedImage.url);

    console.log("Cloudinary response status:", cloudinaryResponse.status);

    if (!cloudinaryResponse.ok) {
      console.error(
        "Cloudinary error:",
        cloudinaryResponse.status,
        cloudinaryResponse.statusText,
      );

      return res.status(502).json({
        success: false,
        message: "Failed to fetch processed image",
      });
    }

    const imageBuffer = Buffer.from(await cloudinaryResponse.arrayBuffer());

    console.log(
      "Processed image fetched successfully:",
      imageBuffer.length,
      "bytes",
    );

    // Send image through our server
    res.set({
      "Content-Type": processedImage.mimeType || "image/jpeg",
      "Content-Length": imageBuffer.length.toString(),
      "Cache-Control": "private, max-age=300",
    });

    return res.send(imageBuffer);
  } catch (error) {
    console.error("Get processed image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load shared image",
    });
  }
};

export const createScreenshotShare = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Screenshot file is required",
      });
    }

    // ---------------------------------------
    // Validate screenshot
    // ---------------------------------------

    if (req.file.mimetype !== "image/png") {
      return res.status(400).json({
        success: false,
        message: "Screenshot must be a PNG image",
      });
    }

    // ---------------------------------------
    // Check storage limit
    // ---------------------------------------

    const ownerQuery = getOwnerQuery(req);
    let storageLimit;

    if (req.user) {
      const userPlan = req.user.subscription?.plan;

      storageLimit = PLAN_STORAGE_LIMITS[userPlan] ?? 0;
    } else {
      storageLimit = GUEST_STORAGE_LIMIT;
    }

    const currentStored = await Image.countDocuments(ownerQuery);

    if (currentStored + 1 > storageLimit) {
      return res.status(429).json({
        success: false,
        message: `Storage limit reached. Your plan allows ${storageLimit} stored images.`,
        usage: {
          stored: currentStored,
          limit: storageLimit,
        },
      });
    }

    // ---------------------------------------
    // Get image metadata
    // ---------------------------------------

    const metadata = await sharp(req.file.buffer).metadata();

    // ---------------------------------------
    // Upload screenshot to Cloudinary
    // ---------------------------------------

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "imagify/originals",
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

    // ---------------------------------------
    // Create Image document
    // ---------------------------------------
    const image = await Image.create({
      user: req.user?._id || null,

      guestId: req.guestId || null,

      originalName: req.file.originalname || "imagify-screenshot.png",

      fileName: result.public_id,

      mimeType: req.file.mimetype,

      size: req.file.size,

      width: metadata.width,

      height: metadata.height,

      url: result.secure_url,

      // Screenshot is already the final image,
      // so store it as a processed image too.
      processedImages: [
        {
          operation: "screenshot",

          fileName: result.public_id,

          url: result.secure_url,

          size: req.file.size,

          width: metadata.width,

          height: metadata.height,

          mimeType: req.file.mimetype,
        },
      ],
    });

    // ---------------------------------------
    // Create completed batch
    // ---------------------------------------

    const batch = await ProcessingBatch.create({
      user: req.user?._id || null,
      guestId: req.guestId || null,

      status: "completed",

      imageIds: [image._id],

      totalImages: 1,

      completedImages: 1,

      failedImages: 0,

      operation: "screenshot",

      options: {},
    });

    // ---------------------------------------
    // Generate share token
    // ---------------------------------------

    const token = crypto.randomBytes(32).toString("hex");

    // ---------------------------------------
    // Share expires after 1 hour
    // ---------------------------------------

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const share = await Share.create({
      token,

      batchId: batch._id,

      expiresAt,
    });

    // ---------------------------------------
    // Create public URL
    // ---------------------------------------

    const shareUrl = `${process.env.CLIENT_URL}/share/${token}`;

    console.log("Screenshot share created:", shareUrl);

    return res.status(201).json({
      success: true,

      message: "Screenshot uploaded and shared successfully",

      share: {
        token: share.token,

        expiresAt: share.expiresAt,

        url: shareUrl,
      },

      image: {
        id: image._id,

        originalName: image.originalName,

        mimeType: image.mimeType,

        size: image.size,

        width: image.width,

        height: image.height,
      },
    });
  } catch (error) {
    console.error("Create screenshot share error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create screenshot share",
    });
  }
};
