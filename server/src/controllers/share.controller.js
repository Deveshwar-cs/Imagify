import crypto from "crypto";
import sharp from "sharp";

import Share from "../models/share.model.js";
import ProcessingBatch from "../models/processing.batch.model.js";
import {uploadBufferToCloudinary} from "../services/image.service.js";

// =========================================
// CREATE SHARE
// =========================================

export const createShare = async (req, res) => {
  try {
    // -----------------------------------------
    // AUTHENTICATION
    // -----------------------------------------

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to share processed images.",
      });
    }

    // -----------------------------------------
    // GET BATCH ID
    // -----------------------------------------

    const {batchId} = req.body;

    if (!batchId) {
      return res.status(400).json({
        success: false,
        message: "Batch ID is required.",
      });
    }

    // -----------------------------------------
    // FIND USER'S BATCH
    // -----------------------------------------

    const batch = await ProcessingBatch.findOne({
      _id: batchId,
      user: req.user._id,
    });

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Processing batch not found.",
      });
    }

    // -----------------------------------------
    // CHECK BATCH STATUS
    // -----------------------------------------

    if (batch.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Images must be completely processed before sharing.",
      });
    }

    // -----------------------------------------
    // CHECK RESULTS
    // -----------------------------------------

    if (!batch.results || batch.results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No processed results are available to share.",
      });
    }

    // -----------------------------------------
    // GENERATE SECURE TOKEN
    // -----------------------------------------

    const token = crypto.randomBytes(32).toString("hex");

    // -----------------------------------------
    // SET EXPIRATION
    // -----------------------------------------

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // -----------------------------------------
    // CREATE SHARE RECORD
    // -----------------------------------------

    const share = await Share.create({
      token,
      batchId: batch._id,
      expiresAt,
    });

    // -----------------------------------------
    // CREATE URL
    // -----------------------------------------

    const shareUrl = `${process.env.CLIENT_URL}/share/${token}`;

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

    return res.status(201).json({
      success: true,
      message: "Share link created successfully.",
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
      message: "Failed to create share link.",
    });
  }
};

// =========================================
// GET SHARED RESULTS
// =========================================

export const getSharedResults = async (req, res) => {
  try {
    const {token} = req.params;

    // -----------------------------------------
    // VALIDATE TOKEN
    // -----------------------------------------

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Share token is required.",
      });
    }

    // -----------------------------------------
    // FIND SHARE
    // -----------------------------------------

    const share = await Share.findOne({
      token,
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share link not found or expired.",
      });
    }

    // -----------------------------------------
    // CHECK EXPIRATION
    // -----------------------------------------

    if (share.expiresAt <= new Date()) {
      return res.status(410).json({
        success: false,
        message: "Share link has expired.",
      });
    }

    // -----------------------------------------
    // FIND BATCH
    // -----------------------------------------

    const batch = await ProcessingBatch.findById(share.batchId);
    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Shared processing results not found.",
      });
    }

    // -----------------------------------------
    // CHECK STATUS
    // -----------------------------------------

    if (batch.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Processing is not completed yet.",
      });
    }

    // -----------------------------------------
    // BUILD PUBLIC IMAGE DATA
    // -----------------------------------------

    const sharedImages = batch.images.map((image) => {
      const processedImage = batch.results.find(
        (result) => result.originalName === image.originalName,
      );

      return {
        originalName: image.originalName,
        mimeType: image.mimeType,
        size: image.size,

        processedImage: processedImage
          ? {
              id: processedImage._id,
              operation: processedImage.operation,
              size: processedImage.size,
              width: processedImage.width,
              height: processedImage.height,
              mimeType: processedImage.mimeType,

              // Do not expose Cloudinary URL directly.
              // Frontend can request the image through
              // the protected share endpoint.
              url: `/share/${token}/image/${processedImage._id}`,
            }
          : null,
      };
    });

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

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
      message: "Failed to get shared results.",
    });
  }
};

// =========================================
// GET SHARED PROCESSED IMAGE
// =========================================

export const getSharedProcessedImage = async (req, res) => {
  try {
    const {token, imageId} = req.params;

    // -----------------------------------------
    // VALIDATE PARAMETERS
    // -----------------------------------------

    if (!token || !imageId) {
      return res.status(400).json({
        success: false,
        message: "Share token and image ID are required.",
      });
    }

    // -----------------------------------------
    // FIND SHARE
    // -----------------------------------------

    const share = await Share.findOne({
      token,
    });

    if (!share) {
      return res.status(404).json({
        success: false,
        message: "Share link not found or expired.",
      });
    }

    // -----------------------------------------
    // CHECK EXPIRATION
    // -----------------------------------------

    if (share.expiresAt <= new Date()) {
      return res.status(410).json({
        success: false,
        message: "Share link has expired.",
      });
    }

    // -----------------------------------------
    // FIND BATCH
    // -----------------------------------------

    const batch = await ProcessingBatch.findById(share.batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Shared processing results not found.",
      });
    }

    // -----------------------------------------
    // CHECK STATUS
    // -----------------------------------------

    if (batch.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Processing is not completed yet.",
      });
    }

    // -----------------------------------------
    // FIND RESULT SUBDOCUMENT
    // -----------------------------------------

    const processedImage = batch.results.id(imageId);

    if (!processedImage) {
      return res.status(404).json({
        success: false,
        message: "Processed image not found in the shared batch.",
      });
    }

    // -----------------------------------------
    // FETCH FROM CLOUDINARY
    // -----------------------------------------

    const cloudinaryResponse = await fetch(processedImage.url);

    if (!cloudinaryResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch processed image.",
      });
    }

    // -----------------------------------------
    // CONVERT TO BUFFER
    // -----------------------------------------
    const imageBuffer = Buffer.from(await cloudinaryResponse.arrayBuffer());

    // -----------------------------------------
    // SEND IMAGE
    // -----------------------------------------

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
      message: "Failed to load shared image.",
    });
  }
};

// =========================================
// CREATE SCREENSHOT SHARE
// =========================================

export const createScreenshotShare = async (req, res) => {
  try {
    // -----------------------------------------
    // AUTHENTICATION
    // -----------------------------------------

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "You must be logged in to share screenshots.",
      });
    }

    // -----------------------------------------
    // CHECK FILE
    // -----------------------------------------

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Screenshot file is required.",
      });
    }

    // -----------------------------------------
    // VALIDATE SCREENSHOT
    // -----------------------------------------

    if (req.file.mimetype !== "image/png") {
      return res.status(400).json({
        success: false,
        message: "Screenshot must be a PNG image.",
      });
    }

    // -----------------------------------------
    // GET METADATA
    // -----------------------------------------

    const metadata = await sharp(req.file.buffer).metadata();

    if (!metadata.width || !metadata.height) {
      return res.status(400).json({
        success: false,
        message: "Unable to read screenshot dimensions.",
      });
    }

    // -----------------------------------------
    // UPLOAD TO CLOUDINARY
    // -----------------------------------------

    const result = await uploadBufferToCloudinary(
      req.file.buffer,
      "imagify/processing/results/screenshot",
    );

    const originalName = req.file.originalname || "imagify-screenshot.png";

    // -----------------------------------------
    // CREATE COMPLETED BATCH
    // -----------------------------------------

    const batch = await ProcessingBatch.create({
      user: req.user._id,
      guestId: null,

      status: "completed",
      images: [
        {
          originalName,
          mimeType: req.file.mimetype,
          publicId: result.public_id,
          size: req.file.size,
          url: result.secure_url,
        },
      ],
      results: [
        {
          originalName,

          operation: "screenshot",

          fileName: result.public_id,

          url: result.secure_url,

          size: req.file.size,

          width: metadata.width,

          height: metadata.height,

          mimeType: req.file.mimetype,
        },
      ],
      cleanupAt: new Date(Date.now() + 60 * 60 * 1000),
      totalImages: 1,
      completedImages: 1,
      failedImages: 0,

      notificationSent: false,

      operation: "screenshot",

      options: {},
    });

    // -----------------------------------------
    // GENERATE SHARE TOKEN
    // -----------------------------------------

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // -----------------------------------------
    // CREATE SHARE
    // -----------------------------------------

    const share = await Share.create({
      token,
      batchId: batch._id,
      expiresAt,
    });

    // -----------------------------------------
    // CREATE URL
    // -----------------------------------------

    const shareUrl = `${process.env.CLIENT_URL}/share/${token}`;

    // -----------------------------------------
    // RESPONSE
    // -----------------------------------------

    return res.status(201).json({
      success: true,

      message: "Screenshot uploaded and shared successfully.",

      share: {
        token: share.token,
        expiresAt: share.expiresAt,
        url: shareUrl,
      },

      image: {
        originalName,
        mimeType: req.file.mimetype,
        size: req.file.size,
        width: metadata.width,
        height: metadata.height,
      },
    });
  } catch (error) {
    console.error("Create screenshot share error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create screenshot share.",
    });
  }
};
