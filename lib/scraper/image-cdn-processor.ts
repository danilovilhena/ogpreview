import { ScrapedMetadata } from './types';

const CDN_URL = 'https://cdn.ogpreview.co';

const BUNNY_CONFIG = {
  region: 'ny.storage.bunnycdn.com',
  storageZone: 'og-preview',
  accessKey: process.env.BUNNY_KEY,
} as const;

interface ImageUploadResult {
  success: boolean;
  originalUrl: string;
  cdnUrl?: string;
  error?: string;
}

/**
 * Generate a unique filename for the uploaded image
 */
function generateFilename(originalUrl: string): string {
  try {
    const url = new URL(originalUrl);
    const pathname = url.pathname;
    const extension = pathname.split('.').pop() || 'jpg';

    // Create a hash-like identifier from the URL
    const timestamp = Date.now();
    const urlHash = Buffer.from(originalUrl).toString('base64').replace(/[+/=]/g, '').substring(0, 8);

    return `${urlHash}_${timestamp}.${extension}`;
  } catch {
    // Fallback for invalid URLs
    const timestamp = Date.now();
    return `image_${timestamp}.jpg`;
  }
}

/**
 * Fetch image data from URL
 */
async function fetchImageData(imageUrl: string): Promise<{ data: ArrayBuffer; contentType: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    const response = await fetch(imageUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OGPreview/1.0; +https://ogpreview.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';

    // Validate it's an image
    if (!contentType.startsWith('image/')) {
      throw new Error(`Not an image: ${contentType}`);
    }

    const data = await response.arrayBuffer();

    // Basic size validation (max 10MB)
    if (data.byteLength > 10 * 1024 * 1024) {
      throw new Error('Image too large (max 10MB)');
    }

    return { data, contentType };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Upload image data to Bunny CDN
 */
async function uploadToBunnyCDN(imageData: ArrayBuffer, filename: string, contentType: string): Promise<string> {
  if (!BUNNY_CONFIG.accessKey) {
    throw new Error('BUNNY_KEY environment variable not set');
  }

  const uploadUrl = `https://${BUNNY_CONFIG.region}/${BUNNY_CONFIG.storageZone}/${filename}`;

  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      AccessKey: BUNNY_CONFIG.accessKey,
      'Content-Type': contentType,
      accept: 'application/json',
    },
    body: imageData,
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(`Bunny CDN upload failed: ${response.status} ${response.statusText} - ${errorText}`);
  }

  // Return the CDN URL for the uploaded image
  return `${CDN_URL}/${filename}`;
}

/**
 * Process a single image URL: fetch and upload to CDN
 */
async function processImageUrl(imageUrl: string): Promise<ImageUploadResult> {
  try {
    // Validate URL
    new URL(imageUrl);

    // Fetch image data
    const { data, contentType } = await fetchImageData(imageUrl);

    // Generate filename
    const filename = generateFilename(imageUrl);

    // Upload to CDN
    const cdnUrl = await uploadToBunnyCDN(data, filename, contentType);

    return {
      success: true,
      originalUrl: imageUrl,
      cdnUrl,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.warn(`Failed to process image ${imageUrl}:`, errorMessage);

    return {
      success: false,
      originalUrl: imageUrl,
      error: errorMessage,
    };
  }
}

/**
 * Process an array of image URLs with controlled concurrency
 */
async function processImageUrls(imageUrls: string[]): Promise<string[]> {
  if (!imageUrls || imageUrls.length === 0) {
    return [];
  }

  // Remove duplicates and filter valid URLs
  const uniqueUrls = [...new Set(imageUrls)].filter((url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  });

  if (uniqueUrls.length === 0) {
    return [];
  }

  // Process images with limited concurrency (max 3 at once)
  const results: ImageUploadResult[] = [];
  const concurrency = Math.min(3, uniqueUrls.length);

  for (let i = 0; i < uniqueUrls.length; i += concurrency) {
    const batch = uniqueUrls.slice(i, i + concurrency);
    const batchPromises = batch.map((url) => processImageUrl(url));
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  // Return CDN URLs for successful uploads, original URLs for failures
  return results.map((result) => (result.success ? result.cdnUrl! : result.originalUrl));
}

/**
 * Main function: Process all images in metadata and replace with CDN URLs
 */
export async function processMetadataImages(metadata: ScrapedMetadata): Promise<ScrapedMetadata> {
  try {
    console.log('Processing metadata images for CDN upload...');

    // Process OpenGraph images
    const processedOgImages = metadata.openGraph?.images ? await processImageUrls(metadata.openGraph.images) : [];

    const processedOgSecureImages = metadata.openGraph?.imageSecureUrl ? await processImageUrls(metadata.openGraph.imageSecureUrl) : [];

    // Process Twitter images
    const processedTwitterImages = metadata.twitter?.images ? await processImageUrls(metadata.twitter.images) : [];

    // Process favicon if it exists
    let processedFavicon = metadata.basic?.favicon;
    if (processedFavicon) {
      const faviconResults = await processImageUrls([processedFavicon]);
      processedFavicon = faviconResults[0];
    }

    // Return updated metadata with CDN URLs
    const updatedMetadata: ScrapedMetadata = {
      ...metadata,
      openGraph: {
        ...metadata.openGraph,
        ...(processedOgImages.length > 0 && { images: processedOgImages }),
        ...(processedOgSecureImages.length > 0 && { imageSecureUrl: processedOgSecureImages }),
      },
      twitter: {
        ...metadata.twitter,
        ...(processedTwitterImages.length > 0 && { images: processedTwitterImages }),
      },
      basic: {
        ...metadata.basic,
        ...(processedFavicon && { favicon: processedFavicon }),
      },
    };

    console.log('Image processing completed successfully');
    return updatedMetadata;
  } catch (error) {
    console.error('Error processing metadata images:', error);
    // Return original metadata if processing fails
    return metadata;
  }
}
