import { NextRequest } from 'next/server';
import { createCanvas, loadImage } from 'canvas';

export const runtime = 'nodejs';

// Helper function to draw fallback circle with token symbol
function drawFallbackCircle(ctx: any, x: number, y: number, size: number, tokenSymbol?: string) {
  ctx.fillStyle = '#4F46E5';
  ctx.beginPath();
  ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 16px Arial';
  ctx.textAlign = 'center';
  ctx.fillText((tokenSymbol || 'T')[0], x + size/2, y + size/2 + 6);
}

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

        // Fetch token data with image data URIs
    let tokens: Array<{ token_address: string; token_name: string; token_symbol: string; value_usd?: number; logo_url?: string; imageDataUri?: string | null }> = [];
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

    // Format USD values
    const formatUsd = (value?: number): string => {
      const v = value || 0;
      if (v < 0.01) return '<$0.01';
      if (v < 1000) return `$${v.toFixed(2)}`;
      if (v < 1_000_000) return `$${(v / 1000).toFixed(1)}K`;
      return `$${(v / 1_000_000).toFixed(1)}M`;
    };
    
    // Canvas with token data
    const WIDTH = 1200;
    const HEIGHT = 630;
    const canvas = createCanvas(WIDTH, HEIGHT);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#0B1020';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Header
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`@${username}`, WIDTH / 2, 60);

    ctx.font = '24px Arial';
    ctx.fillStyle = '#E6E8F0';
    ctx.fillText(`Portfolio: ${formatUsd(total_value_usd)}`, WIDTH / 2, 100);

    // Token list in 2 columns with images
    const LOGO_SIZE = 40;
    const ROW_HEIGHT = 60;
    const START_Y = 160;
    const LEFT_COL_X = 200;
    const RIGHT_COL_X = 700;

    for (let i = 0; i < Math.min(tokens.length, 10); i++) {
      const token = tokens[i];
      const isLeftColumn = i < 5;
      const rowIndex = isLeftColumn ? i : i - 5;
      const x = isLeftColumn ? LEFT_COL_X : RIGHT_COL_X;
      const y = START_Y + (rowIndex * ROW_HEIGHT);

      // Draw token logo or fallback circle
      if (token.imageDataUri) {
        try {
          const img = await loadImage(token.imageDataUri);
          // Draw circular clipped logo
          ctx.save();
          ctx.beginPath();
          ctx.arc(x + LOGO_SIZE/2, y + LOGO_SIZE/2, LOGO_SIZE/2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(img, x, y, LOGO_SIZE, LOGO_SIZE);
          ctx.restore();
        } catch {
          // Fallback to circle
          drawFallbackCircle(ctx, x, y, LOGO_SIZE, token.token_symbol);
        }
      } else {
        // Fallback circle with letter
        drawFallbackCircle(ctx, x, y, LOGO_SIZE, token.token_symbol);
      }

      // Draw token info text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '18px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`${i + 1}. ${token.token_symbol}`, x + LOGO_SIZE + 15, y + 20);
      
      ctx.fillStyle = '#E6E8F0';
      ctx.font = '16px Arial';
      ctx.fillText(formatUsd(token.value_usd), x + LOGO_SIZE + 15, y + 40);
    }

    // Footer
    ctx.fillStyle = '#A0A0A0';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Search by ETH/SOL wallet address or', WIDTH / 2, HEIGHT - 40);
    ctx.fillText('Farcaster/X username on Wallet Search', WIDTH / 2, HEIGHT - 20);

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


