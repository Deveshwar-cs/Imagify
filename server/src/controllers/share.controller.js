import crypto from "crypto";
import Share from "../models/share.model.js";
import ProcessingBatch from "../models/processing.batch.model.js";
import {rmSync} from "fs";
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
      return res.status(404).message({
        success: false,
        message: "Processing batch not found!",
      });
    }

    if (batch.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Image must be completely processed before sharing.",
      });
    }

    const token = crypto.randomBytes(32).toString("hex");

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    const share = await Share.create({
      token,
      batchId: batch._id,
      expiresAt,
    });

    const shareUrl = `${process.env.CLIENT_URL}/share/${token}`;

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
    console.error("Create share error", error);

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
      return res
        .status(404)
        .json({success: false, message: "Share link not found!"});
    }

    if (share.expiresAt <= new Date()) {
      return res
        .status(410)
        .json({success: false, message: "Share link has expired"});
    }

    const batch = await ProcessingBatch.findById(share.batchId).populate(
      "imageIds",
    );

    if (!batch) {
      res.status(404).json({
        success: false,
        message: "Shared processing results not found",
      });
    }

    const sharedImages = batch.imageIds.map((image) => ({
      id: image._id,
      originalName: image.originalName,
      mimeType: image.mimeType,
      size: image.size,
      width: image.width,
      height: image.height,

      processedImage: image.processedImages?.length
        ? {
            size: image.processedImages[image.processedImages.length - 1].size,

            width:
              image.processedImages[image.processedImages.length - 1].width,

            height:
              image.processedImages[image.processedImages.length - 1].height,

            mimeType:
              image.processedImages[image.processedImages.length - 1].mimeType,
          }
        : null,
    }));
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

        progress: Math.round((batch.completedImages / batch.totalImages) * 100),

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

    if (!token || !imageId) {
      return res.status(400).json({
        success: false,
        message: "Share token and image ID are required",
      });
    }

    // Find the share link
    const share = await Share.findOne({
      token,
    });

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

    // Find the batch connected to this share
    const batch = await ProcessingBatch.findById(share.batchId);

    if (!batch) {
      return res.status(404).json({
        success: false,
        message: "Shared processing results not found",
      });
    }

    const imageBelongsToBatch = batch.imageIds.some(
      (id) => id.toString() === imageId,
    );

    if (!imageBelongsToBatch) {
      return res.status(404).json({
        success: false,
        message: "Image not found in the shared batch",
      });
    }

    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
    }

    const processedImage =
      image.processedImages?.[image.processedImages.length - 1];

    if (!processedImage) {
      return res.status(404).json({
        success: false,
        message: "Processed image not found",
      });
    }

    const cloudinaryResponse = await fetch(processedImage.url);

    if (!cloudinaryResponse.ok) {
      return res.status(502).json({
        success: false,
        message: "Failed to fetch processed image",
      });
    }

    const imageBuffer = Buffer.from(await cloudinaryResponse.arrayBuffer());

    // Send image through our server
    res.set("Content-Type", processedImage.mimeType);

    res.set("Content-Length", imageBuffer.length);

    return res.send(imageBuffer);
  } catch (error) {
    console.error("Get processed image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to load shared image",
    });
  }
};
