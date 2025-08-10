import { NextRequest } from 'next/server';

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

    // Fetch token data with image data URIs from Node.js balance API
    const origin = req.nextUrl.origin || 'https://walletsearch.vercel.app';
    const apiUrl = new URL(`${origin}/api/balance`);
    apiUrl.searchParams.set('fid', String(fid));
    if (bankrAddresses.length > 0) apiUrl.searchParams.set('bankrAddresses', bankrAddresses.join(','));

    let tokens: Array<{ token_address: string; token_name: string; token_symbol: string; value_usd?: number; logo_url?: string; r2_image_url?: string | null }> = [];
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

    // Canvas approach with actual token images - FINALLY!
    try {
      const { createCanvas, loadImage } = await import('canvas');
      
      const canvas = createCanvas(1200, 800);
      const ctx = canvas.getContext('2d');

      // Background
      ctx.fillStyle = '#0B1020';
      ctx.fillRect(0, 0, 1200, 800);

      // Header - use sans-serif for better Vercel compatibility
      ctx.fillStyle = 'white';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`@${username}`, 600, 80);

      ctx.font = '24px sans-serif';
      ctx.fillStyle = '#E6E8F0';
      ctx.fillText(`Portfolio: ${formatUsd(total_value_usd)}`, 600, 120);

      // Draw tokens with actual images in 2 columns
      const leftTokens = tokens.slice(0, 5);
      const rightTokens = tokens.slice(5, 10);

      // Left column
      for (let i = 0; i < leftTokens.length; i++) {
        const token = leftTokens[i];
        const y = 180 + (i * 80);
        
        try {
          // Load and draw token image - prefer R2 URL if available
          const imageUrl = token.r2_image_url || token.logo_url;
          if (imageUrl) {
            // Add timeout and better error handling for image loading
            const image = await Promise.race([
              loadImage(imageUrl),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Image load timeout')), 5000)
              )
            ]);
            ctx.save();
            ctx.beginPath();
            ctx.arc(150, y, 20, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(image, 130, y - 20, 40, 40);
            ctx.restore();
          } else {
            // Fallback circle
            ctx.fillStyle = '#4F46E5';
            ctx.beginPath();
            ctx.arc(150, y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText((i + 1).toString(), 150, y + 4);
          }

          // Token text
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${i + 1}. ${token.token_symbol}`, 200, y - 5);
          
          ctx.font = '16px sans-serif';
          ctx.fillStyle = '#E6E8F0';
          ctx.fillText(formatUsd(token.value_usd), 200, y + 20);
        } catch (error) {
          console.log(`Failed to load image for ${token.token_symbol} (${imageUrl}):`, error);
          // Draw fallback circle
          ctx.fillStyle = '#4F46E5';
          ctx.beginPath();
          ctx.arc(150, y, 20, 0, Math.PI * 2);
          ctx.fill();
          
          // Token text even if image fails
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${i + 1}. ${token.token_symbol}`, 200, y - 5);
          
          ctx.font = '16px sans-serif';
          ctx.fillStyle = '#E6E8F0';
          ctx.fillText(formatUsd(token.value_usd), 200, y + 20);
        }
      }

      // Right column
      for (let i = 0; i < rightTokens.length; i++) {
        const token = rightTokens[i];
        const y = 180 + (i * 80);
        
        try {
          // Load and draw token image - prefer R2 URL if available
          const imageUrl = token.r2_image_url || token.logo_url;
          if (imageUrl) {
            // Add timeout and better error handling for image loading
            const image = await Promise.race([
              loadImage(imageUrl),
              new Promise<never>((_, reject) => 
                setTimeout(() => reject(new Error('Image load timeout')), 5000)
              )
            ]);
            ctx.save();
            ctx.beginPath();
            ctx.arc(650, y, 20, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(image, 630, y - 20, 40, 40);
            ctx.restore();
          } else {
            // Fallback circle
            ctx.fillStyle = '#4F46E5';
            ctx.beginPath();
            ctx.arc(650, y, 20, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'white';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText((i + 6).toString(), 650, y + 4);
          }

          // Token text
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${i + 6}. ${token.token_symbol}`, 700, y - 5);
          
          ctx.font = '16px sans-serif';
          ctx.fillStyle = '#E6E8F0';
          ctx.fillText(formatUsd(token.value_usd), 700, y + 20);
        } catch (error) {
          console.log(`Failed to load image for ${token.token_symbol} (${imageUrl}):`, error);
          // Draw fallback circle
          ctx.fillStyle = '#4F46E5';
          ctx.beginPath();
          ctx.arc(650, y, 20, 0, Math.PI * 2);
          ctx.fill();
          
          // Token text even if image fails
          ctx.fillStyle = 'white';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${i + 6}. ${token.token_symbol}`, 700, y - 5);
          
          ctx.font = '16px sans-serif';
          ctx.fillStyle = '#E6E8F0';
          ctx.fillText(formatUsd(token.value_usd), 700, y + 20);
        }
      }

      // Footer
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Search by ETH/SOL wallet address or Farcaster/X username on Wallet Search 🔎', 600, 750);

      // Return PNG buffer
      const buffer = canvas.toBuffer('image/png');
      
      return new Response(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    } catch (canvasError) {
      console.error('Canvas error:', canvasError);
      
      // Fallback to simple response
      return new Response(`Canvas Error: ${canvasError instanceof Error ? canvasError.message : 'Unknown canvas error'}`, {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        },
      });
    }
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}