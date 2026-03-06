import { unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

/**
 * Deletes an image file from the public directory
 * @param imageUrl - The public URL of the image (e.g., "/images/partners/partner_123.webp")
 * @returns Promise<boolean> - true if deleted successfully, false otherwise
 */
export async function deleteImageFile(imageUrl: string): Promise<boolean> {
  if (!imageUrl) {
    return false;
  }

  try {
    // Skip if it's an external URL
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      console.log('Skipping deletion of external URL:', imageUrl);
      return false;
    }

    // Convert public URL to file system path
    // Remove leading slash and construct full path
    const relativePath = imageUrl.startsWith('/') ? imageUrl.slice(1) : imageUrl;
    const filePath = path.join(process.cwd(), 'public', relativePath);

    // Check if file exists
    if (!existsSync(filePath)) {
      console.log('File does not exist:', filePath);
      return false;
    }

    // Delete the file
    await unlink(filePath);
    console.log('Successfully deleted image:', filePath);
    return true;
  } catch (error) {
    console.error('Error deleting image file:', error);
    return false;
  }
}

/**
 * Extracts the image URL from a background-image CSS property
 * @param backgroundImage - CSS background-image value (e.g., "url('/images/banner.jpg')")
 * @returns string - The extracted URL or empty string
 */
export function extractImageUrlFromCss(backgroundImage: string): string {
  if (!backgroundImage) {
    return '';
  }

  // Extract URL from url('...') or url("...")
  const match = backgroundImage.match(/url\(['"]?([^'"]+)['"]?\)/);
  return match ? match[1] : backgroundImage;
}

/**
 * Checks if an image path is a generated/uploaded file (vs. original/external)
 * Generated files have timestamp pattern: partner_123456789.webp or banner_123456789.webp
 * @param imageUrl - The image URL to check
 * @returns boolean - true if it's a generated file that can be safely deleted
 */
export function isGeneratedImage(imageUrl: string): boolean {
  if (!imageUrl) {
    return false;
  }

  // Check if it matches our generated file pattern
  const generatedPattern = /\/(partner|banner|hero)_\d+\.(webp|jpg|jpeg|png|gif)$/i;
  return generatedPattern.test(imageUrl);
}

/**
 * Safely deletes an image only if it's a generated/uploaded file
 * @param imageUrl - The image URL to delete
 * @returns Promise<boolean> - true if deleted successfully
 */
export async function safeDeleteImage(imageUrl: string): Promise<boolean> {
  if (!imageUrl) {
    return false;
  }

  // Only delete generated images to avoid deleting original assets
  if (!isGeneratedImage(imageUrl)) {
    console.log('Skipping deletion of non-generated image:', imageUrl);
    return false;
  }

  return await deleteImageFile(imageUrl);
}
