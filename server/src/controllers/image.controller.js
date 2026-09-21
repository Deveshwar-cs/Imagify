import sharp from "sharp";
import Image from "../models/image.models.js";
import fs from "fs/promises";
import path from "path";
import {error} from "console";

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image",
      });
    }

    const metadata = await sharp(req.file.path).metadata();

    const image = await Image.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      width: metadata.width,
      height: metadata.height,
      path: req.file.path,
    });

    return res.status(201).json({
      success: true,
      message: "Image uploaded succcessfully",
      image: {
        id: image._id,
        originalName: image.originalName,
        fileName: image.fileName,
        mimeType: image.mimeType,
        size: image.size,
        width: metadata.width,
        height: metadata.height,
        path: req.file.path,
      },
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

    const outputFileName = `resize-${Date.now()}-${image.fileName}`;

    const outPath = path.join("uploads", outputFileName);

    const resizeOptions = {};

    if (parsedWidth) {
      resizeOptions.width = parsedWidth;
    }
    if (parsedHeight) {
      resizeOptions.height = parsedHeight;
    }

    await sharp(image.path)
      .resize({
        ...resizeOptions,
        fit: "inside",
        withoutEnlargement: false,
      })
      .toFile(outPath);

    const metadata = await sharp(outPath).metadata();

    const status = await fs.stat(outPath);

    const processedUrl = `http://localhost:${process.env.PORT || 5000}/${outPath.replaceAll("\\", "/")}`;

    const processedImage = {
      operation: "resize",
      fileName: outputFileName,
      path: outPath,
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
        url: `http://localhost:${process.env.PORT || 5000}/${image.path}`,
      },
      processed: {...processedImage, url: processedUrl},
    });
  } catch (error) {
    console.error("Resize image error", error);

    return res.status(500).json({
      success: false,
      message: "Failed to resize image",
    });
  }
};

export const compressImage = async (req, res) => {
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

    const outputFileName = `compress-${Date.now()}-${image.fileName}`;

    const outputPath = path.join("uploads", outputFileName);

    let imageProcessor = sharp(image.path);

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

    const processedImage = {
      operation: "compress",
      fileName: outputFileName,
      path: outputPath,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    const processedUrl = `http://localhost:${
      process.env.PORT || 5000
    }/${outputPath.replaceAll("\\", "/")}`;

    return res.status(200).json({
      success: true,
      message: "Image compressed successfully",

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: `http://localhost:${process.env.PORT || 5000}/${image.path}`,
      },

      processed: {
        ...processedImage,
        url: processedUrl,
      },
    });
  } catch (error) {
    console.error("Compress image error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to compress image",
    });
  }
};

export const improveQuality = async (req, res) => {
  try {
    const {imageId} = req.params;
    const image = await Image.findById(imageId);
    console.log(image);
    if (!image) {
      res.json(404).json({
        success: false,
        message: "Image not found!",
      });
    }

    const outputFileName = `quality-${Date.now()}-${image.fileName}`;

    const outputPath = path.join("uploads", outputFileName);
    console.log("image.path:", image.path);
    console.log("outputPath:", outputPath);
    await sharp(image.path)
      .sharpen({sigma: 1.2, m1: 1, m2: 2})
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();

    const stats = await fs.stat(outputPath);

    const processedImage = {
      operation: "quality",
      fileName: outputFileName,
      path: outputPath,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    const processedUrl = `http://localhost:${
      process.env.PORT || 5000
    }/${outputPath.replaceAll("\\", "/")}`;

    return res.status(200).json({
      success: true,
      message: "Image quality improved successfully",

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: `http://localhost:${process.env.PORT || 5000}/${image.path}`,
      },

      processed: {
        ...processedImage,
        url: processedUrl,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Unable to Improve quality",
    });
  }
};

export const upscaleImage = async (req, res) => {
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

    const newWidth = image.width * parsedScale;
    const newHeight = image.height * parsedScale;

    const outputFileName = `upscale-${parsedScale}x-${Date.now()}-${image.fileName}`;

    const outputPath = path.join("uploads", outputFileName);

    await sharp(image.path)
      .resize({
        width: newWidth,
        height: newHeight,
        fit: "fill",
      })
      .toFile(outputPath);

    const metadata = await sharp(outputPath).metadata();

    const stats = await fs.stat(outputPath);
    const processedImage = {
      operation: `upscale-${parsedScale}x`,
      fileName: outputFileName,
      path: outputPath,
      size: stats.size,
      width: metadata.width,
      height: metadata.height,
      mimeType: `image/${metadata.format}`,
    };

    image.processedImages.push(processedImage);

    await image.save();

    const processedUrl = `http://localhost:${
      process.env.PORT || 5000
    }/${outputPath.replaceAll("\\", "/")}`;

    return res.status(200).json({
      success: true,
      message: `Image upscaled ${parsedScale}x successfully`,

      original: {
        fileName: image.fileName,
        size: image.size,
        width: image.width,
        height: image.height,
        mimeType: image.mimeType,
        url: `http://localhost:${process.env.PORT || 5000}/${image.path}`,
      },

      processed: {
        ...processedImage,
        url: processedUrl,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({success: false, message: "Unable to upscale image"});
  }
};
