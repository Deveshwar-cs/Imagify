import sharp from "sharp";

import fs from "fs/promises";

import {
  createTempFilePath,
  uploadToCloudinary,
  downloadImageToTemp,
  cleanupTempFile,
} from "./image.service.js";

const extensionMap = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

// ============================================================
// Create processed image result
// ============================================================

const createProcessedImage = async ({outputPath, operation, folder}) => {
  const metadata = await sharp(outputPath).metadata();

  const stats = await fs.stat(outputPath);

  const result = await uploadToCloudinary(outputPath, folder);

  return {
    operation,
    fileName: result.public_id,
    url: result.secure_url,
    size: stats.size,
    width: metadata.width,
    height: metadata.height,
    mimeType: `image/${metadata.format}`,
  };
};

// ============================================================
// Resize
// ============================================================

export const processResize = async (sourceUrl, mimeType, width, height) => {
  let inputPath;
  let outputPath;

  try {
    const parsedWidth = width ? Number(width) : null;

    const parsedHeight = height ? Number(height) : null;

    // ----------------------------------------------------------
    // Validate dimensions
    // ----------------------------------------------------------

    if (
      (width !== undefined &&
        width !== "" &&
        (!Number.isFinite(parsedWidth) || parsedWidth <= 0)) ||
      (height !== undefined &&
        height !== "" &&
        (!Number.isFinite(parsedHeight) || parsedHeight <= 0))
    ) {
      throw new Error("Width and height must be valid positive numbers");
    }

    if (!parsedWidth && !parsedHeight) {
      throw new Error("Width or Height is required");
    }

    // ----------------------------------------------------------
    // Download original image
    // ----------------------------------------------------------

    inputPath = await downloadImageToTemp(sourceUrl);

    // ----------------------------------------------------------
    // Create output path
    // ----------------------------------------------------------

    const extension = extensionMap[mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    // ----------------------------------------------------------
    // Build resize options
    // ----------------------------------------------------------

    const resizeOptions = {};

    if (parsedWidth) {
      resizeOptions.width = parsedWidth;
    }

    if (parsedHeight) {
      resizeOptions.height = parsedHeight;
    }

    // ----------------------------------------------------------
    // Process image
    // ----------------------------------------------------------

    await sharp(inputPath)
      .resize({
        ...resizeOptions,

        // Preserve aspect ratio
        fit: "inside",

        // Allow enlargement for resize operation
        withoutEnlargement: false,
      })
      .toFile(outputPath);

    // ----------------------------------------------------------
    // Upload result and return information
    // ----------------------------------------------------------

    return await createProcessedImage({
      outputPath,

      operation: "resize",

      folder: "imagify/processing/results/resize",
    });
  } finally {
    await cleanupTempFile(inputPath);

    await cleanupTempFile(outputPath);
  }
};

// ============================================================
// Compress
// ============================================================

export const processCompress = async (
  sourceUrl,
  mimeType,
  level = "medium",
) => {
  let inputPath;
  let outputPath;

  try {
    const compressionLevels = {
      low: {
        quality: 80,
      },

      medium: {
        quality: 60,
      },

      high: {
        quality: 40,
      },
    };

    const compression = compressionLevels[level];

    if (!compression) {
      throw new Error("Invalid compression level");
    }

    // ----------------------------------------------------------
    // Download original image
    // ----------------------------------------------------------

    inputPath = await downloadImageToTemp(sourceUrl);

    // ----------------------------------------------------------
    // Create output path
    // ----------------------------------------------------------

    const extension = extensionMap[mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    // ----------------------------------------------------------
    // Create Sharp processor
    // ----------------------------------------------------------

    let imageProcessor = sharp(inputPath);

    switch (mimeType) {
      case "image/jpeg":
        imageProcessor = imageProcessor.jpeg({
          quality: compression.quality,
          mozjpeg: true,
        });
        break;

      case "image/png":
        imageProcessor = imageProcessor.png({
          compressionLevel: 9,
          palette: level === "high",
        });
        break;

      case "image/webp":
        imageProcessor = imageProcessor.webp({
          quality: compression.quality,
        });
        break;

      default:
        throw new Error("Unsupported image format");
    }

    // ----------------------------------------------------------
    // Process image
    // ----------------------------------------------------------

    await imageProcessor.toFile(outputPath);

    // ----------------------------------------------------------
    // Upload result
    // ----------------------------------------------------------

    return await createProcessedImage({
      outputPath,

      operation: "compress",

      folder: "imagify/processing/results/compress",
    });
  } finally {
    await cleanupTempFile(inputPath);

    await cleanupTempFile(outputPath);
  }
};

// ============================================================
// Improve quality
// ============================================================

export const processQuality = async (sourceUrl, mimeType) => {
  let inputPath;
  let outputPath;

  try {
    // ----------------------------------------------------------
    // Download original image
    // ----------------------------------------------------------

    inputPath = await downloadImageToTemp(sourceUrl);

    // ----------------------------------------------------------
    // Create output path
    // ----------------------------------------------------------

    const extension = extensionMap[mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    // ----------------------------------------------------------
    // Sharpen image
    // ----------------------------------------------------------

    await sharp(inputPath)
      .sharpen({
        sigma: 1.2,
        m1: 1,
        m2: 2,
      })
      .toFile(outputPath);

    // ----------------------------------------------------------
    // Upload result
    // ----------------------------------------------------------

    return await createProcessedImage({
      outputPath,

      operation: "quality",

      folder: "imagify/processing/results/quality",
    });
  } finally {
    await cleanupTempFile(inputPath);

    await cleanupTempFile(outputPath);
  }
};

// ============================================================
// Upscale
// ============================================================

export const processUpscale = async (sourceUrl, mimeType, scale = 2) => {
  let inputPath;
  let outputPath;

  try {
    const parsedScale = Number(scale);

    // ----------------------------------------------------------
    // Validate scale
    // ----------------------------------------------------------

    if (![2, 3].includes(parsedScale)) {
      throw new Error("Scale must be either 2 or 3");
    }

    // ----------------------------------------------------------
    // Download original image
    // ----------------------------------------------------------

    inputPath = await downloadImageToTemp(sourceUrl);

    // ----------------------------------------------------------
    // Get original dimensions
    // ----------------------------------------------------------

    const metadata = await sharp(inputPath).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error("Unable to determine image dimensions");
    }

    const newWidth = metadata.width * parsedScale;

    const newHeight = metadata.height * parsedScale;

    // ----------------------------------------------------------
    // Create output path
    // ----------------------------------------------------------

    const extension = extensionMap[mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    // ----------------------------------------------------------
    // Upscale image
    // ----------------------------------------------------------

    await sharp(inputPath)
      .resize({
        width: newWidth,
        height: newHeight,
        fit: "fill",
      })
      .toFile(outputPath);

    // ----------------------------------------------------------
    // Upload result
    // ----------------------------------------------------------

    return await createProcessedImage({
      outputPath,

      operation: `upscale-${parsedScale}x`,

      folder: `imagify/processing/results/upscale/${parsedScale}x`,
    });
  } finally {
    await cleanupTempFile(inputPath);

    await cleanupTempFile(outputPath);
  }
};
