/**
 * Test utilities for verifying image dimension preservation during rotation
 * and other transformations in the image processing pipeline.
 */

import { ImageEdits } from '@/types/image-edits';

export interface DimensionTestResult {
  testName: string;
  passed: boolean;
  originalDimensions: { width: number; height: number };
  expectedDimensions: { width: number; height: number };
  actualDimensions: { width: number; height: number };
  rotationAngle: number;
  error?: string;
}

export interface TestImageSpec {
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

// Test image specifications for various common sizes and aspect ratios
export const TEST_IMAGES: TestImageSpec[] = [
  { name: "Square Small", width: 100, height: 100, aspectRatio: "1:1" },
  { name: "Square Medium", width: 500, height: 500, aspectRatio: "1:1" },
  { name: "Square Large", width: 1000, height: 1000, aspectRatio: "1:1" },
  { name: "Portrait 4:3", width: 400, height: 300, aspectRatio: "4:3" },
  { name: "Landscape 4:3", width: 300, height: 400, aspectRatio: "3:4" },
  { name: "Portrait 16:9", width: 1920, height: 1080, aspectRatio: "16:9" },
  { name: "Landscape 16:9", width: 1080, height: 1920, aspectRatio: "9:16" },
  { name: "Ultra-wide", width: 2560, height: 1080, aspectRatio: "21:9" },
  { name: "Mobile Portrait", width: 375, height: 812, aspectRatio: "~9:19" },
  { name: "Mobile Landscape", width: 812, height: 375, aspectRatio: "~19:9" }
];

// Common rotation angles to test
export const TEST_ROTATION_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315, 360];

/**
 * Calculate expected dimensions after rotation
 * For display purposes (not actual image processing)
 */
export function calculateRotatedDisplayDimensions(
  originalWidth: number,
  originalHeight: number,
  rotationDegrees: number
): { width: number; height: number } {
  const rotation = (rotationDegrees * Math.PI) / 180;
  const cos = Math.abs(Math.cos(rotation));
  const sin = Math.abs(Math.sin(rotation));
  
  // Calculate rotated bounding box
  const rotatedWidth = originalWidth * cos + originalHeight * sin;
  const rotatedHeight = originalWidth * sin + originalHeight * cos;
  
  return {
    width: Math.round(rotatedWidth),
    height: Math.round(rotatedHeight)
  };
}

/**
 * Generate a test canvas with specified dimensions
 */
export function generateTestCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');
  
  // Create a distinctive pattern for testing
  ctx.fillStyle = '#f0f0f0';
  ctx.fillRect(0, 0, width, height);
  
  // Add corner markers
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(0, 0, 20, 20); // Top-left
  ctx.fillStyle = '#00ff00';
  ctx.fillRect(width - 20, 0, 20, 20); // Top-right
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(0, height - 20, 20, 20); // Bottom-left
  ctx.fillStyle = '#ffff00';
  ctx.fillRect(width - 20, height - 20, 20, 20); // Bottom-right
  
  // Add center cross
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 10, height / 2);
  ctx.lineTo(width / 2 + 10, height / 2);
  ctx.moveTo(width / 2, height / 2 - 10);
  ctx.lineTo(width / 2, height / 2 + 10);
  ctx.stroke();
  
  return canvas;
}

/**
 * Convert canvas to data URL for testing
 */
export function canvasToDataUrl(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png');
}

/**
 * Extract dimensions from an image data URL
 */
export function getImageDimensionsFromDataUrl(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    img.src = dataUrl;
  });
}

/**
 * Run dimension preservation test for a specific image and rotation
 */
export async function runDimensionTest(
  testImage: TestImageSpec,
  rotationAngle: number,
  processImageFn: (imageUrl: string, edits: ImageEdits) => Promise<{ imageUrl?: string; error?: string }>
): Promise<DimensionTestResult> {
  const testName = `${testImage.name} @ ${rotationAngle}°`;
  
  try {
    // Generate test image
    const canvas = generateTestCanvas(testImage.width, testImage.height);
    const originalDataUrl = canvasToDataUrl(canvas);
    
    // Create edits with rotation
    const edits: ImageEdits = {
      // Transform operations
      rotation: rotationAngle,
      flipHorizontal: false,
      flipVertical: false,
      autoOrient: false,
      
      // Resize operations
      width: 0,
      height: 0,
      unit: "px",
      aspectRatioLocked: true,
      resizeFit: "cover",
      resizePosition: "centre",
      resizeKernel: "lanczos3",
      withoutEnlargement: false,
      withoutReduction: false,
      
      // Crop/Extract operations
      crop: { enabled: false, x: 0, y: 0, width: 0, height: 0 },
      
      // Color manipulation
      brightness: 0,
      contrast: 0,
      saturation: 0,
      hue: 0,
      tint: { r: 0, g: 0, b: 0, enabled: false },
      grayscale: false,
      negate: false,
      
      // Filters and effects
      blur: 0,
      sharpen: { enabled: false, sigma: 0, m1: 1, m2: 2, x1: 2, y2: 10, y3: 20 },
      median: 0,
      gamma: 1.0,
      normalize: false,
      clahe: { width: 0, height: 0, maxSlope: 0, enabled: false },
      
      // Advanced operations
      linear: { multiplier: 1, offset: 0, enabled: false },
      threshold: { value: 128, grayscale: false, enabled: false },
      modulate: { brightness: 1, saturation: 1, hue: 0, lightness: 1, enabled: false },
      composite: { 
        input: "", 
        blend: "over", 
        gravity: "centre", 
        left: 0, 
        top: 0, 
        enabled: false 
      },
      extend: { 
        top: 0, 
        bottom: 0, 
        left: 0, 
        right: 0, 
        background: { r: 0, g: 0, b: 0, alpha: 0 }, 
        enabled: false 
      },
      trim: { threshold: 10, enabled: false },
      affine: { 
        matrix: [1, 0, 0, 1], 
        background: { r: 0, g: 0, b: 0, alpha: 0 }, 
        interpolator: "bilinear", 
        enabled: false 
      },
      convolve: { 
        width: 3, 
        height: 3, 
        kernel: [0, 0, 0, 0, 1, 0, 0, 0, 0], 
        scale: 1, 
        offset: 0, 
        enabled: false 
      },
      
      // Export settings
      exportFormat: "png",
      quality: 80,
      progressive: false,
      downloadTargetKB: 0,
      
      // Color space
      toColorspace: "srgb",
      pipelineColorspace: "scrgb"
    };
    
    // Process the image
    const result = await processImageFn(originalDataUrl, edits);
    
    if (result.error || !result.imageUrl) {
      return {
        testName,
        passed: false,
        originalDimensions: { width: testImage.width, height: testImage.height },
        expectedDimensions: { width: testImage.width, height: testImage.height },
        actualDimensions: { width: 0, height: 0 },
        rotationAngle,
        error: result.error || 'No processed image returned'
      };
    }
    
    // Get actual dimensions from processed image
    const actualDimensions = await getImageDimensionsFromDataUrl(result.imageUrl);
    
    // For rotation, the actual image dimensions should remain the same
    // (the visual scaling is handled by CSS, not by changing the image itself)
    const expectedDimensions = { width: testImage.width, height: testImage.height };
    
    const passed = actualDimensions.width === expectedDimensions.width && 
                   actualDimensions.height === expectedDimensions.height;
    
    return {
      testName,
      passed,
      originalDimensions: { width: testImage.width, height: testImage.height },
      expectedDimensions,
      actualDimensions,
      rotationAngle
    };
    
  } catch (error) {
    return {
      testName,
      passed: false,
      originalDimensions: { width: testImage.width, height: testImage.height },
      expectedDimensions: { width: testImage.width, height: testImage.height },
      actualDimensions: { width: 0, height: 0 },
      rotationAngle,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run comprehensive dimension tests
 */
export async function runComprehensiveDimensionTests(
  processImageFn: (imageUrl: string, edits: ImageEdits) => Promise<{ imageUrl?: string; error?: string }>
): Promise<DimensionTestResult[]> {
  const results: DimensionTestResult[] = [];
  
  // Test a subset of images and rotations for performance
  const testImages = TEST_IMAGES.slice(0, 5); // First 5 test images
  const testAngles = [0, 90, 180, 270]; // Key rotation angles
  
  for (const testImage of testImages) {
    for (const angle of testAngles) {
      const result = await runDimensionTest(testImage, angle, processImageFn);
      results.push(result);
    }
  }
  
  return results;
}

/**
 * Generate a test report from dimension test results
 */
export function generateTestReport(results: DimensionTestResult[]): string {
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const passRate = ((passed / total) * 100).toFixed(1);
  
  let report = `Dimension Preservation Test Report\n`;
  report += `=====================================\n`;
  report += `Total Tests: ${total}\n`;
  report += `Passed: ${passed}\n`;
  report += `Failed: ${total - passed}\n`;
  report += `Pass Rate: ${passRate}%\n\n`;
  
  if (total - passed > 0) {
    report += `Failed Tests:\n`;
    report += `-------------\n`;
    results.filter(r => !r.passed).forEach(result => {
      report += `❌ ${result.testName}\n`;
      report += `   Expected: ${result.expectedDimensions.width}x${result.expectedDimensions.height}\n`;
      report += `   Actual: ${result.actualDimensions.width}x${result.actualDimensions.height}\n`;
      if (result.error) {
        report += `   Error: ${result.error}\n`;
      }
      report += `\n`;
    });
  }
  
  report += `Passed Tests:\n`;
  report += `-------------\n`;
  results.filter(r => r.passed).forEach(result => {
    report += `✅ ${result.testName}\n`;
  });
  
  return report;
}