import { NextRequest } from 'next/server';
import { createCanvas } from 'canvas';

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

        // For basic test, we don't need the token data
    // Just get username for simple display
    
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


