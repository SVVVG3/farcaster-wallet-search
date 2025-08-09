import { NextRequest } from 'next/server';
import { createCanvas, loadImage, Image } from 'canvas';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fidParam = searchParams.get('fid');
    const username = searchParams.get('username') || 'user';
    const bankrAddressesParam = searchParams.get('bankrAddresses');
    
    if (!fidParam) {
      return new Response('Missing fid', { status: 400 });
    }
    
    const fid = parseInt(fidParam, 10);
    if (Number.isNaN(fid)) {
      return new Response('Invalid fid', { status: 400 });
    }

    const bankrAddresses = bankrAddressesParam
      ? bankrAddressesParam.split(',').map((s) => s.trim()).filter(Boolean)
      : [];

    // Fetch token data via our Node API route
    const origin = req.nextUrl.origin || 'https://walletsearch.vercel.app';
    const apiUrl = new URL(`${origin}/api/balance`);
    apiUrl.searchParams.set('fid', String(fid));
    if (bankrAddresses.length > 0) apiUrl.searchParams.set('bankrAddresses', bankrAddresses.join(','));

    let tokens: Array<{ token_address: string; token_name: string; token_symbol: string; value_usd?: number; logo_url?: string }> = []; 
    let total_value_usd = 0;
    
    try {
      const res = await fetch(apiUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        tokens = Array.isArray(data.tokens) ? data.tokens.slice(0, 10) : [];
        total_value_usd = typeof data.total_value_usd === 'number' ? data.total_value_usd : 0;
      }
    } catch {
      // Fall back to empty data on fetch error
    }

    // Helper function to load image with timeout
    const loadImageWithTimeout = async (imageUrl: string, timeout = 5000): Promise<Image | null> => {
      try {
        // Add User-Agent and other headers to avoid blocking
        const result = await Promise.race([
          loadImage(imageUrl),
          new Promise<Image>((_, reject) => setTimeout(() => reject(new Error('Timeout')), timeout))
        ]);
        return result;
      } catch (error) {
        console.log(`Failed to load image: ${imageUrl}, Error: ${error}`);
        return null;
      }
    };

    // Pre-fetch token logos for top 10 tokens
    const topTokens = tokens.slice(0, 10);
    
    const tokensWithImages = await Promise.all(
      topTokens.map(async (token) => {
        const logoImage = token.logo_url ? await loadImageWithTimeout(token.logo_url) : null;
        return { ...token, logoImage };
      })
    );

    // Format USD values
    const formatUsd = (value?: number): string => {
      const v = value || 0;
      if (v < 0.01) return '<$0.01';
      if (v < 1000) return `$${v.toFixed(2)}`;
      if (v < 1_000_000) return `$${(v / 1000).toFixed(1)}K`;
      return `$${(v / 1_000_000).toFixed(1)}M`;
    };
    
    // Simple Canvas test - back to basics
    const WIDTH = 1200;
    const HEIGHT = 630;
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0B1020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Simple text test
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`@${username}`, WIDTH / 2, HEIGHT / 2);

    // Return PNG buffer
    const buffer = canvas.toBuffer('image/png');
    
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, immutable, no-transform, max-age=300',
      },
    });
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}


