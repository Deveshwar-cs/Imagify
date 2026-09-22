import sharp from "sharp";
import fs from "fs/promises";

import Image from "../models/image.models.js";

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

const createProcessedImage = async ({
  image,
  inputPath,
  outputPath,
  operation,
  folder,
}) => {
  const metadata = await sharp(outputPath).metadata();
  const stats = await fs.stat(outputPath);

  const result = await uploadToCloudinary(outputPath, folder);

  const processedImage = {
    operation,
    fileName: result.public_id,
    url: result.secure_url,
    size: stats.size,
    width: metadata.width,
    height: metadata.height,
    mimeType: `image/${metadata.format}`,
  };

  image.processedImages.push(processedImage);

  await image.save();

  return processedImage;
};

export const processResize = async (imageId, width, height) => {
  let inputPath;
  let outputPath;

  try {
    const image = await Image.findById(imageId);

    if (!image) {
      throw new Error("Image not found");
    }

    const parsedWidth = width ? Number(width) : null;
    const parsedHeight = height ? Number(height) : null;

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

    inputPath = await downloadImageToTemp(image.url);

    const extension = extensionMap[image.mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    const resizeOptions = {};

    if (parsedWidth) {
      resizeOptions.width = parsedWidth;
    }

    if (parsedHeight) {
      resizeOptions.height = parsedHeight;
    }

    await sharp(inputPath)
      .resize({
        ...resizeOptions,
        fit: "inside",
        withoutEnlargement: false,
      })
      .toFile(outputPath);

    return await createProcessedImage({
      image,
      inputPath,
      outputPath,
      operation: "resize",
      folder: "imagify/processed/resize",
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

export const processCompress = async (imageId, level = "medium") => {
  let inputPath;
  let outputPath;

  try {
    const image = await Image.findById(imageId);

    if (!image) {
      throw new Error("Image not found");
    }

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

    inputPath = await downloadImageToTemp(image.url);

    const extension = extensionMap[image.mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    let imageProcessor = sharp(inputPath);

    switch (image.mimeType) {
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
          quality: compression.quality,
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

    await imageProcessor.toFile(outputPath);

    return await createProcessedImage({
      image,
      inputPath,
      outputPath,
      operation: "compress",
      folder: "imagify/processed/compress",
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

export const processQuality = async (imageId) => {
  let inputPath;
  let outputPath;

  try {
    const image = await Image.findById(imageId);

    if (!image) {
      throw new Error("Image not found");
    }

    inputPath = await downloadImageToTemp(image.url);

    const extension = extensionMap[image.mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    await sharp(inputPath)
      .sharpen({
        sigma: 1.2,
        m1: 1,
        m2: 2,
      })
      .toFile(outputPath);

    return await createProcessedImage({
      image,
      inputPath,
      outputPath,
      operation: "quality",
      folder: "imagify/processed/quality",
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

export const processUpscale = async (imageId, scale = 2) => {
  let inputPath;
  let outputPath;

  try {
    const image = await Image.findById(imageId);

    if (!image) {
      throw new Error("Image not found");
    }

    const parsedScale = Number(scale);

    if (![2, 3].includes(parsedScale)) {
      throw new Error("Scale must be either 2 or 3");
    }

    inputPath = await downloadImageToTemp(image.url);

    const extension = extensionMap[image.mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    const newWidth = image.width * parsedScale;
    const newHeight = image.height * parsedScale;

    await sharp(inputPath)
      .resize({
        width: newWidth,
        height: newHeight,
        fit: "fill",
      })
      .toFile(outputPath);

    return await createProcessedImage({
      image,
      inputPath,
      outputPath,
      operation: `upscale-${parsedScale}x`,
      folder: `imagify/processed/upscale/${parsedScale}x`,
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};
