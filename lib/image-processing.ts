import { ImageEdits } from '@/types/image-edits'

export interface ProcessImageResponse {
  success: boolean
  imageUrl?: string
  metadata?: {
    format: string
    size: number
    originalSize?: number
    quality?: number
  }
  error?: string
  details?: string
}

export async function processImageWithSharp(
  imageFile: File | string,
  edits: ImageEdits
): Promise<ProcessImageResponse> {
  try {
    const formData = new FormData()
    
    // Handle both File objects and data URLs
    if (typeof imageFile === 'string') {
      // Convert data URL to blob
      const response = await fetch(imageFile)
      const blob = await response.blob()
      const file = new File([blob], 'image', { type: blob.type })
      formData.append('image', file)
    } else {
      formData.append('image', imageFile)
    }
    
    formData.append('edits', JSON.stringify(edits))
    
    const response = await fetch('/api/process-image', {
      method: 'POST',
      body: formData,
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to process image')
    }
    
    const result: ProcessImageResponse = await response.json()
    return result
    
  } catch (error) {
    console.error('Image processing error:', error)
    return {
      success: false,
      error: 'Failed to process image',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

export async function downloadProcessedImage(
  imageFile: File | string,
  edits: ImageEdits,
  filename?: string
): Promise<void> {
  try {
    const result = await processImageWithSharp(imageFile, edits)
    
    if (!result.success || !result.imageUrl) {
      throw new Error(result.error || 'Failed to process image')
    }
    
    // Convert data URL to blob
    const response = await fetch(result.imageUrl)
    const blob = await response.blob()
    
    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    
    // Generate filename based on format
    const format = result.metadata?.format || 'webp'
    const defaultFilename = `processed-image.${format}`
    link.download = filename || defaultFilename
    
    // Trigger download
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    
    // Clean up
    URL.revokeObjectURL(url)
    
  } catch (error) {
    console.error('Download error:', error)
    throw error
  }
}

// Utility function to check if edits have any changes from default
export function hasImageEdits(edits: ImageEdits): boolean {
  return (
    edits.rotation !== 0 ||
    edits.flipHorizontal ||
    edits.flipVertical ||
    edits.brightness !== 0 ||
    edits.contrast !== 0 ||
    edits.saturation !== 0 ||
    edits.grayscale ||
    edits.blur > 0 ||
    edits.sharpen.enabled ||
    edits.width > 0 ||
    edits.height > 0 ||
    (edits.crop?.enabled && edits.crop.width > 0 && edits.crop.height > 0)
  )
}

export function hasNonCropEdits(edits: ImageEdits): boolean {
  return (
    edits.rotation !== 0 ||
    edits.flipHorizontal ||
    edits.flipVertical ||
    edits.brightness !== 0 ||
    edits.contrast !== 0 ||
    edits.saturation !== 0 ||
    edits.grayscale ||
    edits.blur > 0 ||
    edits.sharpen.enabled ||
    edits.width > 0 ||
    edits.height > 0
  )
}

// Check if edits only contain CSS-filterable adjustments (for live preview optimization)
export function hasOnlyLiveAdjustments(edits: ImageEdits): boolean {
  return (
    edits.rotation === 0 &&
    !edits.flipHorizontal &&
    !edits.flipVertical &&
    edits.blur === 0 &&
    !edits.sharpen.enabled &&
    edits.width === 0 &&
    edits.height === 0 &&
    !edits.crop.enabled &&
    // Only brightness, contrast, saturation, and grayscale are live-adjustable
    (edits.brightness !== 0 || edits.contrast !== 0 || edits.saturation !== 0 || edits.grayscale)
  )
}

// Check if edits require server-side processing (non-CSS filterable)
export function hasServerSideEdits(edits: ImageEdits): boolean {
  return (
    edits.rotation !== 0 ||
    edits.flipHorizontal ||
    edits.flipVertical ||
    edits.blur > 0 ||
    edits.sharpen.enabled ||
    edits.width > 0 ||
    edits.height > 0 ||
    edits.crop.enabled
  )
}

// Utility function to get file size from data URL
export function getDataUrlSize(dataUrl: string): number {
  const base64 = dataUrl.split(',')[1]
  return Math.round((base64.length * 3) / 4)
}

// Utility function to convert file to data URL
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}