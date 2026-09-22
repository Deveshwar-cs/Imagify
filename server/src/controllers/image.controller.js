import sharp from "sharp";
import Image from "../models/image.models.js";
import fs from "fs/promises";
import cloudinary from "../config/cloudinary.js";
import {
  createTempFilePath,
  uploadToCloudinary,
  downloadImageToTemp,
  cleanupTempFile,
} from "../services/image.service.js";

export const uploadImage = async (req, res) => {
  try {
    if (!req.files) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    const uploadedImages = [];

    for (const file of req.files) {
      const metadata = await sharp(file.buffer).metadata();

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

        uploadStream.end(file.buffer);
      });

      const image = await Image.create({
        originalName: file.originalname,
        fileName: result.public_id,
        mimeType: file.mimetype,
        size: file.size,
        width: metadata.width,
        height: metadata.height,
        url: result.secure_url,
      });

      uploadedImages.push({
        id: image._id,
        originalName: image.originalName,
        fileName: image.fileName,
        mimeType: image.mimeType,
        size: image.size,
        width: image.width,
        height: image.height,
        url: image.url,
      });
    }

    return res.status(201).json({
      success: true,
      message: `${uploadedImages.length} image${
        uploadedImages.length > 1 ? "s" : ""
      } uploaded successfully`,
      images: uploadedImages,
    });
  } catch (error) {
    console.log("Upload image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to upload image",
    });
  }
};

export const resizeImage = async (req, res) => {
  let inputPath;
  let outputPath;
  try {
    const {imageId} = req.params;
    const {width, height} = req.body;

    if (!width && !height) {
      return res.status(400).json({
        success: false,
        message: "Width or Height is required",
      });
    }

    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
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
      return res.status(400).json({
        success: false,
        message: "Width and height must be valid positive numbers",
      });
    }

    inputPath = await downloadImageToTemp(image.url);
    const extensionMap = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

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

    const metadata = await sharp(outputPath).metadata();

    const status = await fs.stat(outputPath);

    // Upload processed image to Cloudinary
    const result = await uploadToCloudinary(
      outputPath,
      "imagify/processed/resize",
    );
    const processedImage = {
      operation: "resize",
      fileName: result.public_id,
      url: result.secure_url,
      size: status.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    return res.status(200).json({
      success: true,
      message: "Image resized successfully",
      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: image.url,
      },
      processed: {...processedImage, url: result.secure_url},
    });
  } catch (error) {
    console.error("Resize image error", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resize image",
    });
  } finally {
    // Remove temporary files
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

export const compressImage = async (req, res) => {
  let inputPath;
  let outputPath;
  try {
    const {imageId} = req.params;
    const {level = "medium"} = req.body;

    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found",
      });
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
      return res.status(400).json({
        success: false,
        message: "Invalid compression level",
      });
    }

    inputPath = await downloadImageToTemp(image.url);

    const extensionMap = {
      "image/jpeg": ".jpeg",
      "image/png": "png",
      "image/webp": ".webp",
    };

    const extension = extensionMap[image.mimeType] || "jpeg";

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
        return res.status(400).json({
          success: false,
          message: "Unsupported image format",
        });
    }

    await imageProcessor.toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();

    const stats = await fs.stat(outputPath);

    const result = await uploadToCloudinary(
      outputPath,
      "imagify/processed/compress",
    );
    const processedImage = {
      operation: "compress",
      fileName: result.public_id,
      url: result.secure_url,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    return res.status(200).json({
      success: true,
      message: "Image compressed successfully",

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: image.url,
      },

      processed: {
        ...processedImage,
        url: result.secure_url,
      },
    });
  } catch (error) {
    console.error("Compress image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to compress image",
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

export const improveQuality = async (req, res) => {
  let inputPath;
  let outputPath;
  try {
    const {imageId} = req.params;
    const image = await Image.findById(imageId);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found!",
      });
    }

    inputPath = await downloadImageToTemp(image.url);
    const extensionMap = {
      "image/jpeg": ".jpeg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensionMap[image.mimeType] || ".jpeg";

    outputPath = createTempFilePath(extension);
    // const outputFileName = `quality-${Date.now()}-${image.fileName}`;

    // const outputPath = path.join("uploads", outputFileName);

    await sharp(inputPath)
      .sharpen({sigma: 1.2, m1: 1, m2: 2})
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();

    const stats = await fs.stat(outputPath);

    const result = await uploadToCloudinary(
      outputPath,
      "imagify/processed/quality",
    );
    const processedImage = {
      operation: "quality",
      fileName: result.public_id,
      url: result.secure_url,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    return res.status(200).json({
      success: true,
      message: "Image quality improved successfully",

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: image.url,
      },

      processed: {
        ...processedImage,
        url: result.secure_url,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Unable to Improve quality",
    });
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};

export const upscaleImage = async (req, res) => {
  let inputPath;
  let outputPath;
  try {
    const {imageId} = req.params;
    const {scale = 2} = req.body;

    const image = await Image.findById(imageId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: "Image not found!",
      });
    }

    const parsedScale = Number(scale);

    if (![2, 3].includes(parsedScale)) {
      return res.status(400).json({
        success: false,
        message: "Scale must be either 2 or 3",
      });
    }

    inputPath = await downloadImageToTemp(image.url);
    const extensionMap = {
      "image/jpeg": "jpg",
      "image/png": "png",
      "image/webp": "webp",
    };

    const extension = extensionMap[image.mimeType] || ".jpg";

    outputPath = createTempFilePath(extension);

    const newWidth = image.width * parsedScale;
    const newHeight = image.height * parsedScale;

    // const outputFileName = `upscale-${parsedScale}x-${Date.now()}-${image.fileName}`;

    // const outputPath = path.join("uploads", outputFileName);

    await sharp(inputPath)
      .resize({
        width: newWidth,
        height: newHeight,
        fit: "fill",
      })
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();
    const stats = await fs.stat(outputPath);

    const result = await uploadToCloudinary(
      outputPath,
      `imagify/processed/upscale/${parsedScale}x`,
    );
    const processedImage = {
      operation: `upscale-${parsedScale}x`,
      fileName: result.public_id,
      url: result.secure_url,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    return res.status(200).json({
      success: true,
      message: `Image upscaled ${parsedScale}x successfully`,

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: image.url,
      },

      processed: {
        ...processedImage,
        url: result.secure_url,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({success: false, message: "Unable to upscale image"});
  } finally {
    await cleanupTempFile(inputPath);
    await cleanupTempFile(outputPath);
  }
};
