import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

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
  // Create a hash-like key from the URL for consistent naming
  const urlHash = Buffer.from(originalUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 20);
  const extension = originalUrl.split('.').pop()?.toLowerCase() || 'png';
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
 * Upload image to R2 from external URL
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

    // Upload to R2
    await r2Client.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: new Uint8Array(imageBuffer),
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000', // Cache for 1 year
    }));

    console.log(`Successfully uploaded image to R2: ${key}`);
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
