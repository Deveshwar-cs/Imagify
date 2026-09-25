import crypto from "crypto";

import Share from "../models/share.model.js";
import ProcessingBatch from "../models/processing.batch.model.js";
import Image from "../models/image.models.js";

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
