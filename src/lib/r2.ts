import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';

// Initialize R2 client
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

/**
 * Generate a consistent key for token images based on the original URL
 */
function generateImageKey(originalUrl: string): string {
  // Clean the URL by removing query parameters for consistent hashing
  const cleanUrl = originalUrl.split('?')[0];
  
  // Create a full base64 hash from the clean URL
  const urlHash = Buffer.from(cleanUrl).toString('base64')
    .replace(/[+=\/]/g, '')  // Remove base64 special chars
    .replace(/[^a-zA-Z0-9]/g, ''); // Remove any other special chars
  
  // Extract extension from clean URL
  const extension = cleanUrl.split('.').pop()?.toLowerCase() || 'png';
  
  return `token-images/${urlHash}.${extension}`;
}

/**
 * Check if image exists in R2
 */
async function imageExistsInR2(key: string): Promise<boolean> {
  try {
    await r2Client.send(new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    }));
    return true;
  } catch {
    return false;
  }
}

/**
 * Upload image to R2 from external URL, converting WebP to PNG if needed
 */
async function uploadImageToR2(originalUrl: string, key: string): Promise<boolean> {
  try {
    // Fetch the image
    const response = await fetch(originalUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WalletSearch/1.0)',
      }
    });

    if (!response.ok) {
      console.log(`Failed to fetch image: ${originalUrl}, status: ${response.status}`);
      return false;
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';
    
    console.log(`Fetched image: ${originalUrl}, content-type: ${contentType}, size: ${imageBuffer.byteLength}`);

    let finalBuffer: Buffer;
    let finalContentType = 'image/png';
    let finalKey = key;

    // Convert WebP and other formats to PNG for Satori compatibility
    if (contentType === 'image/webp' || contentType === 'image/svg+xml' || !contentType.startsWith('image/')) {
      try {
        console.log(`Converting ${contentType} to PNG for Satori compatibility`);
        
        // Use Sharp to convert any image format to PNG
        finalBuffer = await sharp(Buffer.from(imageBuffer))
          .png({ quality: 90, compressionLevel: 6 })
          .resize(64, 64, { fit: 'cover' }) // Optimize size for token logos
          .toBuffer();
        
        // Ensure key has .png extension
        finalKey = key.replace(/\.(webp|svg|jpg|jpeg|gif)$/i, '.png');
        
        console.log(`Successfully converted to PNG: ${imageBuffer.byteLength} -> ${finalBuffer.length} bytes`);
      } catch (conversionError) {
        console.error(`Failed to convert image ${originalUrl}:`, conversionError);
        return false;
      }
    } else {
      // For PNG/JPG, use as-is but still optimize size
      try {
        finalBuffer = await sharp(Buffer.from(imageBuffer))
          .resize(64, 64, { fit: 'cover' })
          .toBuffer();
        finalContentType = contentType;
      } catch (optimizeError) {
        console.log(`Failed to optimize image, using original: ${optimizeError}`);
        finalBuffer = Buffer.from(imageBuffer);
        finalContentType = contentType;
      }
    }

    // Upload to R2
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: finalKey,
      Body: finalBuffer,
      ContentType: finalContentType,
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    }));

    console.log(`Successfully uploaded image to R2: ${finalKey} (${finalContentType}), final size: ${finalBuffer.length}`);
    return true;
  } catch (error) {
    console.error(`Failed to upload image to R2: ${originalUrl}`, error);
    return false;
  }
}

/**
 * Get R2 URL for a token image, uploading if necessary
 */
export async function getTokenImageUrl(originalUrl: string): Promise<string> {
  if (!originalUrl) {
    return originalUrl;
  }

  try {
    const imageKey = generateImageKey(originalUrl);
    const r2Url = `${PUBLIC_URL}/${imageKey}`;

    // Check if image already exists in R2
    if (await imageExistsInR2(imageKey)) {
      console.log(`Image found in R2: ${imageKey}`);
      return r2Url;
    }

    // Upload to R2
    const uploadSuccess = await uploadImageToR2(originalUrl, imageKey);
    if (uploadSuccess) {
      return r2Url;
    }

    // Fallback to original URL if upload fails
    console.log(`Falling back to original URL: ${originalUrl}`);
    return originalUrl;
  } catch (error) {
    console.error('Error in getTokenImageUrl:', error);
    // Fallback to original URL on any error
    return originalUrl;
  }
}

/**
 * Batch process multiple token image URLs
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function processTokenImages(tokens: Array<any>): Promise<Array<any>> {
  const processedTokens = await Promise.all(
    tokens.map(async (token) => {
      if (token.logo_url) {
        try {
          const r2Url = await getTokenImageUrl(token.logo_url);
          return { ...token, r2_image_url: r2Url };
        } catch (error) {
          console.error(`Failed to process image for token ${token.token_symbol}:`, error);
          return { ...token, r2_image_url: token.logo_url };
        }
      }
      return { ...token, r2_image_url: null };
    })
  );

  console.log(`Processed ${processedTokens.length} token images for R2`);
  return processedTokens;
}
