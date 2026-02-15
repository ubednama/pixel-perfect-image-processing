import { ImageEdits } from "@/types/image-edits";
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// Define Sharp interpolator type locally as it's not exported
type Interpolator =
  | "nearest"
  | "bilinear"
  | "bicubic"
  | "nohalo"
  | "lbb"
  | "vsqbs";

export async function POST(request: NextRequest) {
  const startTime = performance.now();
  const timings: Record<string, number> = {};

  try {
    // Parse request timing
    const parseStart = performance.now();
    const formData = await request.formData();
    const imageFile = formData.get("image") as File;
    const editsString = formData.get("edits") as string;
    timings.parseRequest = performance.now() - parseStart;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    const edits: ImageEdits = editsString ? JSON.parse(editsString) : {};

    // Buffer conversion timing
    const bufferStart = performance.now();
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    timings.bufferConversion = performance.now() - bufferStart;

    // Sharp initialization timing
    const initStart = performance.now();
    let sharpInstance = sharp(imageBuffer);
    const metadata = await sharpInstance.metadata();
    timings.sharpInit = performance.now() - initStart;

    // Transformations timing
    const transformStart = performance.now();

    // Apply auto-orientation first if enabled
    if (edits.autoOrient) {
      sharpInstance = sharpInstance.rotate();
    }

    // Apply transformations
    // ROTATION TEMPORARILY DISABLED DUE TO QUALITY DEGRADATION ISSUES
    // if (edits.rotation && edits.rotation !== 0) {
    //   sharpInstance = sharpInstance.rotate(edits.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    // }

    if (edits.flipHorizontal) {
      sharpInstance = sharpInstance.flop();
    }

    if (edits.flipVertical) {
      sharpInstance = sharpInstance.flip();
    }

    timings.transformations = performance.now() - transformStart;

    // Apply affine transformation if enabled
    if (
      edits.affine?.enabled &&
      edits.affine.matrix &&
      edits.affine.matrix.length === 4
    ) {
      sharpInstance = sharpInstance.affine(
        [
          edits.affine.matrix[0],
          edits.affine.matrix[1],
          edits.affine.matrix[2],
          edits.affine.matrix[3],
        ] as [number, number, number, number],
        {
          background: edits.affine.background,
          interpolator: edits.affine.interpolator as Interpolator,
        }
      );
    }

    // Apply crop if enabled
    if (edits.crop?.enabled && edits.crop.width > 0 && edits.crop.height > 0) {
      const cropWidth = Math.round((metadata.width || 0) * edits.crop.width);
      const cropHeight = Math.round((metadata.height || 0) * edits.crop.height);
      const cropLeft = Math.round((metadata.width || 0) * edits.crop.x);
      const cropTop = Math.round((metadata.height || 0) * edits.crop.y);

      // Validate crop dimensions
      if (
        cropWidth > 0 &&
        cropHeight > 0 &&
        cropLeft >= 0 &&
        cropTop >= 0 &&
        cropLeft + cropWidth <= (metadata.width || 0) &&
        cropTop + cropHeight <= (metadata.height || 0)
      ) {
        sharpInstance = sharpInstance.extract({
          left: cropLeft,
          top: cropTop,
          width: cropWidth,
          height: cropHeight,
        });
      }
    }

    // Apply extend/padding if enabled
    if (edits.extend?.enabled) {
      sharpInstance = sharpInstance.extend({
        top: edits.extend.top,
        bottom: edits.extend.bottom,
        left: edits.extend.left,
        right: edits.extend.right,
        background: edits.extend.background,
      });
    }

    // Apply trim if enabled
    if (edits.trim?.enabled) {
      sharpInstance = sharpInstance.trim({
        threshold: edits.trim.threshold,
      });
    }

    // Apply resize if specified
    if (edits.width > 0 || edits.height > 0) {
      const resizeOptions: sharp.ResizeOptions = {};

      if (edits.width > 0) resizeOptions.width = edits.width;
      if (edits.height > 0) resizeOptions.height = edits.height;

      // Apply resize fit and position
      if (edits.resizeFit) {
        resizeOptions.fit = edits.resizeFit as keyof sharp.FitEnum;
      }
      if (edits.resizePosition) {
        resizeOptions.position =
          edits.resizePosition as keyof sharp.StrategyEnum;
      }
      if (edits.resizeKernel) {
        resizeOptions.kernel = edits.resizeKernel as keyof sharp.KernelEnum;
      }
      if (edits.withoutEnlargement) {
        resizeOptions.withoutEnlargement = edits.withoutEnlargement;
      }
      if (edits.withoutReduction) {
        resizeOptions.withoutReduction = edits.withoutReduction;
      }

      if (!edits.aspectRatioLocked) {
        resizeOptions.fit = "fill";
      }

      sharpInstance = sharpInstance.resize(resizeOptions);
    }

    // Apply color space transformations
    if (edits.toColorspace && edits.toColorspace !== "srgb") {
      sharpInstance = sharpInstance.toColourspace(edits.toColorspace as string);
    }
    if (edits.pipelineColorspace && edits.pipelineColorspace !== "scrgb") {
      sharpInstance = sharpInstance.pipelineColourspace(
        edits.pipelineColorspace as string
      );
    }

    // Apply gamma correction
    if (edits.gamma && edits.gamma !== 1.0) {
      sharpInstance = sharpInstance.gamma(edits.gamma);
    }

    // Apply normalize if enabled
    if (edits.normalize) {
      sharpInstance = sharpInstance.normalise();
    }

    // Apply CLAHE if enabled
    if (edits.clahe?.enabled) {
      sharpInstance = sharpInstance.clahe({
        width: edits.clahe.width,
        height: edits.clahe.height,
        maxSlope: edits.clahe.maxSlope,
      });
    }

    // Apply linear transformation if enabled
    if (edits.linear?.enabled) {
      sharpInstance = sharpInstance.linear(
        edits.linear.multiplier,
        edits.linear.offset
      );
    }

    // Apply modulate (HSB adjustments) if enabled
    if (edits.modulate?.enabled) {
      sharpInstance = sharpInstance.modulate({
        brightness: edits.modulate.brightness,
        saturation: edits.modulate.saturation,
        hue: edits.modulate.hue,
        lightness: edits.modulate.lightness,
      });
    } else {
      // Apply individual color adjustments (legacy support)
      if (
        edits.brightness !== 0 ||
        edits.contrast !== 0 ||
        edits.saturation !== 0 ||
        edits.hue !== 0
      ) {
        const brightness = 1 + edits.brightness / 100;
        const contrast = 1 + edits.contrast / 100;
        const saturation = 1 + edits.saturation / 100;
        const hue = edits.hue;

        sharpInstance = sharpInstance.modulate({
          brightness,
          saturation,
          lightness: contrast,
          hue,
        });
      }
    }

    // Apply tint if enabled
    if (edits.tint?.enabled) {
      sharpInstance = sharpInstance.tint({
        r: edits.tint.r,
        g: edits.tint.g,
        b: edits.tint.b,
      });
    }

    // Apply threshold if enabled
    if (edits.threshold?.enabled) {
      sharpInstance = sharpInstance.threshold(edits.threshold.value, {
        grayscale: edits.threshold.grayscale,
      });
    }

    // Apply negate if enabled
    if (edits.negate) {
      sharpInstance = sharpInstance.negate();
    }

    // Apply effects
    if (edits.grayscale) {
      sharpInstance = sharpInstance.grayscale();
    }

    if (edits.blur > 0) {
      sharpInstance = sharpInstance.blur(edits.blur);
    }

    // Apply median filter if enabled
    if (edits.median > 0) {
      sharpInstance = sharpInstance.median(edits.median);
    }

    // Apply sharpen if enabled (new object-based approach)
    if (
      edits.sharpen &&
      typeof edits.sharpen === "object" &&
      edits.sharpen.enabled
    ) {
      sharpInstance = sharpInstance.sharpen({
        sigma: edits.sharpen.sigma,
        m1: edits.sharpen.m1,
        m2: edits.sharpen.m2,
        x1: edits.sharpen.x1,
        y2: edits.sharpen.y2,
        y3: edits.sharpen.y3,
      });
    } else if (typeof edits.sharpen === "number" && edits.sharpen > 0) {
      // Legacy support for number-based sharpen
      sharpInstance = sharpInstance.sharpen({
        sigma: edits.sharpen / 10,
        m1: 1,
        m2: 2,
      });
    }

    // Apply convolve if enabled
    if (edits.convolve?.enabled) {
      sharpInstance = sharpInstance.convolve({
        width: edits.convolve.width,
        height: edits.convolve.height,
        kernel: edits.convolve.kernel,
        scale: edits.convolve.scale,
        offset: edits.convolve.offset,
      });
    }

    // Apply composite if enabled
    if (edits.composite?.enabled && edits.composite.input) {
      // Convert input to buffer if it's a data URL
      let compositeBuffer: Buffer;
      if (edits.composite.input.startsWith("data:")) {
        const base64Data = edits.composite.input.split(",")[1];
        compositeBuffer = Buffer.from(base64Data, "base64");
      } else {
        // Assume it's a file path or URL
        const response = await fetch(edits.composite.input);
        compositeBuffer = Buffer.from(await response.arrayBuffer());
      }

      sharpInstance = sharpInstance.composite([
        {
          input: compositeBuffer,
          blend: edits.composite.blend as sharp.Blend,
          gravity: edits.composite.gravity as sharp.Gravity,
          left: edits.composite.left,
          top: edits.composite.top,
        },
      ]);
    }

    // Determine output format
    let outputFormat: keyof sharp.FormatEnum = "webp";
    let outputOptions:
      | sharp.PngOptions
      | sharp.JpegOptions
      | sharp.WebpOptions
      | sharp.AvifOptions
      | sharp.TiffOptions
      | sharp.GifOptions = { quality: edits.quality || 80 };

    // Force PNG format if rotation is applied to preserve transparency
    const hasRotation = edits.rotation && edits.rotation !== 0;

    if (hasRotation && !edits.exportFormat) {
      outputFormat = "png";
      outputOptions = { compressionLevel: 6 };
    } else if (edits.exportFormat === "png") {
      outputFormat = "png";
      outputOptions = { compressionLevel: 6 };
    } else if (edits.exportFormat === "jpeg") {
      outputFormat = "jpeg";
      outputOptions = {
        quality: edits.quality || 80,
        progressive: edits.progressive || false,
      };
    } else if (edits.exportFormat === "webp") {
      outputFormat = "webp";
      outputOptions = {
        quality: edits.quality || 80,
        progressive: edits.progressive || false,
      };
    } else if (edits.exportFormat === "avif") {
      outputFormat = "avif";
      outputOptions = { quality: edits.quality || 80 };
    } else if (edits.exportFormat === "tiff") {
      outputFormat = "tiff";
      outputOptions = { quality: edits.quality || 80 };
    } else if (edits.exportFormat === "gif") {
      outputFormat = "gif";
      outputOptions = {};
    } else if (edits.exportFormat === "original" && metadata.format) {
      outputFormat = metadata.format as keyof sharp.FormatEnum;
    }

    // Apply target file size if specified
    if (edits.downloadTargetKB > 0) {
      const targetBytes = edits.downloadTargetKB * 1024;

      // For JPEG, WebP, and AVIF, we can adjust quality to meet target size
      if (
        outputFormat === "jpeg" ||
        outputFormat === "webp" ||
        outputFormat === "avif"
      ) {
        let quality = edits.quality || 90;
        let processedBuffer: Buffer;

        do {
          processedBuffer = await sharpInstance
            .clone()
            .toFormat(outputFormat, { ...outputOptions, quality })
            .toBuffer();

          if (processedBuffer.length <= targetBytes || quality <= 10) {
            break;
          }

          quality -= 10;
        } while (quality > 10);

        // Return the final processed image
        const base64 = processedBuffer.toString("base64");
        const mimeType = `image/${outputFormat}`;
        const dataUrl = `data:${mimeType};base64,${base64}`;

        return NextResponse.json({
          success: true,
          imageUrl: dataUrl,
          metadata: {
            format: outputFormat,
            size: processedBuffer.length,
            quality,
          },
        });
      }
    }

    // Final processing timing
    const processStart = performance.now();
    const processedBuffer = await sharpInstance
      .toFormat(outputFormat, outputOptions)
      .toBuffer();
    timings.finalProcessing = performance.now() - processStart;

    // Output generation timing
    const outputStart = performance.now();
    const base64 = processedBuffer.toString("base64");
    const mimeType = `image/${outputFormat}`;
    const dataUrl = `data:${mimeType};base64,${base64}`;
    timings.outputGeneration = performance.now() - outputStart;

    // Calculate total time
    const totalTime = performance.now() - startTime;
    timings.total = totalTime;

    return NextResponse.json({
      success: true,
      imageUrl: dataUrl,
      metadata: {
        format: outputFormat,
        size: processedBuffer.length,
        originalSize: imageBuffer.length,
        processingTime: totalTime,
        timings: timings,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to process image",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
