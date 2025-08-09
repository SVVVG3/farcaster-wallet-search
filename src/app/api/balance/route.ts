import { NextRequest, NextResponse } from 'next/server';
import { fetchUserTokenBalances } from '@/lib/neynar';

// Helper function to fetch image and convert to data URI
async function fetchImageAsDataUri(imageUrl: string, timeout = 5000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(imageUrl, { 
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WalletSearch/1.0)',
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = response.headers.get('content-type') || 'image/png';
    const base64 = buffer.toString('base64');
    
    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.log(`Failed to fetch image: ${imageUrl}, Error: ${error}`);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fidParam = searchParams.get('fid');
    const bankrAddressesParam = searchParams.get('bankrAddresses');

    if (!fidParam) {
      return NextResponse.json(
        { error: 'FID parameter is required' },
        { status: 400 }
      );
    }

    const fid = parseInt(fidParam, 10);
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'FID must be a valid number' },
        { status: 400 }
      );
    }

    // Parse Bankr addresses if provided (comma-separated)
    const bankrAddresses: string[] = bankrAddressesParam 
      ? bankrAddressesParam.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0)
      : [];

    console.log(`Balance API: Fetching token balances for FID ${fid}`);
    if (bankrAddresses.length > 0) {
      console.log(`Balance API: Including ${bankrAddresses.length} Bankr addresses: ${bankrAddresses.join(', ')}`);
    }
    
    const balanceResult = await fetchUserTokenBalances(fid, bankrAddresses);
    
    // Add image data URIs for top 10 tokens
    const tokensWithImages = await Promise.all(
      balanceResult.tokens.slice(0, 10).map(async (token) => {
        if (token.logo_url) {
          try {
            const imageDataUri = await fetchImageAsDataUri(token.logo_url);
            return { ...token, imageDataUri };
          } catch {
            return { ...token, imageDataUri: null };
          }
        }
        return { ...token, imageDataUri: null };
      })
    );
    
    // Replace the tokens array with the enhanced version
    const enhancedResult = {
      ...balanceResult,
      tokens: tokensWithImages.concat(balanceResult.tokens.slice(10)) // Keep remaining tokens without images
    };
    
    console.log(`Balance API: Returning ${enhancedResult.tokens.length} tokens for FID ${fid}, ${tokensWithImages.filter(t => t.imageDataUri).length} with images`);
    
    return NextResponse.json(enhancedResult);

  } catch (error) {
    console.error('Balance API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch token balances',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}