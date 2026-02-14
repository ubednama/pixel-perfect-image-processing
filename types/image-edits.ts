export interface ImageEdits {
  // Transform operations
  rotation: number;
  flipHorizontal: boolean;
  flipVertical: boolean;
  autoOrient: boolean;

  // Resize operations
  width: number;
  height: number;
  unit: "px" | "%";
  aspectRatioLocked: boolean;
  resizeFit: "cover" | "contain" | "fill" | "inside" | "outside";
  resizePosition:
    | "centre"
    | "top"
    | "right top"
    | "right"
    | "right bottom"
    | "bottom"
    | "left bottom"
    | "left"
    | "left top";
  resizeKernel:
    | "nearest"
    | "linear"
    | "cubic"
    | "mitchell"
    | "lanczos2"
    | "lanczos3";
  withoutEnlargement: boolean;
  withoutReduction: boolean;

  // Crop/Extract operations
  crop: {
    x: number;
    y: number;
    width: number;
    height: number;
    enabled: boolean;
  };

  // Color manipulation
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  tint: {
    r: number;
    g: number;
    b: number;
    enabled: boolean;
  };
  grayscale: boolean;
  negate: boolean;

  // Filters and effects
  blur: number;
  sharpen: {
    sigma: number;
    m1: number;
    m2: number;
    x1: number;
    y2: number;
    y3: number;
    enabled: boolean;
  };
  median: number;
  gamma: number;
  normalize: boolean;
  clahe: {
    width: number;
    height: number;
    maxSlope: number;
    enabled: boolean;
  };

  // Linear transformation
  linear: {
    multiplier: number;
    offset: number;
    enabled: boolean;
  };

  // Threshold
  threshold: {
    value: number;
    grayscale: boolean;
    enabled: boolean;
  };

  // Modulate (HSB adjustments)
  modulate: {
    brightness: number;
    saturation: number;
    hue: number;
    lightness: number;
    enabled: boolean;
  };

  // Composite operations
  composite: {
    input: string;
    blend:
      | "clear"
      | "source"
      | "over"
      | "in"
      | "out"
      | "atop"
      | "dest"
      | "dest-over"
      | "dest-in"
      | "dest-out"
      | "dest-atop"
      | "xor"
      | "add"
      | "saturate"
      | "multiply"
      | "screen"
      | "overlay"
      | "darken"
      | "lighten"
      | "colour-dodge"
      | "colour-burn"
      | "hard-light"
      | "soft-light"
      | "difference"
      | "exclusion";
    gravity:
      | "north"
      | "northeast"
      | "east"
      | "southeast"
      | "south"
      | "southwest"
      | "west"
      | "northwest"
      | "center"
      | "centre";
    left: number;
    top: number;
    enabled: boolean;
  };

  // Extend/Pad operations
  extend: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    background: {
      r: number;
      g: number;
      b: number;
      alpha: number;
    };
    enabled: boolean;
  };

  // Trim operations
  trim: {
    threshold: number;
    enabled: boolean;
  };

  // Affine transformation
  affine: {
    matrix: number[];
    background: {
      r: number;
      g: number;
      b: number;
      alpha: number;
    };
    interpolator:
      | "nearest"
      | "bilinear"
      | "bicubic"
      | "nohalo"
      | "lbb"
      | "vsqbs";
    enabled: boolean;
  };

  // Convolve operations
  convolve: {
    width: number;
    height: number;
    kernel: number[];
    scale: number;
    offset: number;
    enabled: boolean;
  };

  // Output format and quality
  exportFormat: "png" | "jpeg" | "webp" | "avif" | "tiff" | "gif" | "original";
  quality: number;
  progressive: boolean;
  downloadTargetKB: number;
  originalMimeType?: string;

  // Color space operations
  toColorspace:
    | "srgb"
    | "rgb"
    | "cmyk"
    | "lab"
    | "b-w"
    | "grey16"
    | "rgb16"
    | "scrgb";
  pipelineColorspace: "rgb16" | "scrgb" | "lab" | "grey16";
}

export interface ImageState {
  baseImage: string; // The current base image (original or saved state)
  originalImage: string; // The very first uploaded image (never changes)
  edits: ImageEdits; // Current edit stack applied to base image
  processedImageUrl: string; // Current rendered result
}

export interface HistoryEntry {
  baseImage: string;
  edits: ImageEdits;
  timestamp: number;
  action: string; // Description of the action taken
}
