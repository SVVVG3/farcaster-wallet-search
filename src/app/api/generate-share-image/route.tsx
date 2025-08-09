/*
  Dynamic OG image for sharing a user's top 10 token holdings.
  Params (query):
    - fid: number (required)
    - username: string (optional, used for title)
    - bankrAddresses: comma-separated list of addresses (optional)
    - v: cache-buster (optional)
*/

import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

// IMPORTANT: ImageResponse is designed for the Edge runtime. Keep this route on Edge
// and avoid importing Node-only modules here.
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const WIDTH = 1200;
const HEIGHT = 630;

function formatUsd(value?: number): string {
  const v = value || 0;
  if (v < 0.01) return '<$0.01';
  if (v < 1000) return `$${v.toFixed(2)}`;
  if (v < 1_000_000) return `$${(v / 1000).toFixed(1)}K`;
  return `$${(v / 1_000_000).toFixed(1)}M`;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fidParam = searchParams.get('fid');
    const username = searchParams.get('username') || '';
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

    // Fetch token data via our Node API route to keep this Edge-safe
    const origin = req.nextUrl.origin || 'https://walletsearch.vercel.app';
    const apiUrl = new URL(`${origin}/api/balance`);
    apiUrl.searchParams.set('fid', String(fid));
    if (bankrAddresses.length > 0) apiUrl.searchParams.set('bankrAddresses', bankrAddresses.join(','));

    let tokens: Array<{ token_address: string; token_name: string; token_symbol: string; value_usd?: number }>; 
    let total_value_usd = 0;
    try {
      const res = await fetch(apiUrl.toString(), { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        tokens = Array.isArray(data.tokens) ? data.tokens : [];
        total_value_usd = typeof data.total_value_usd === 'number' ? data.total_value_usd : 0;
      } else {
        tokens = [];
      }
    } catch {
      tokens = [];
    }

    // Prepare simple rows for satori-safe rendering
    const rows = (tokens || []).slice(0, 10).map((t, idx) => `${idx + 1}. ${t.token_symbol || t.token_name || 'TOKEN'}  ${formatUsd(t.value_usd)}`);

    return new ImageResponse(
      (
        // Container (keep styles minimal for satori compatibility)
        <div style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          background: '#0B1020',
          color: '#E6E8F0',
          padding: 40,
        }}>
          {/* Header */}
          <div style={{ display: 'flex' }}>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ fontSize: 36, fontWeight: 800 }}>Wallet Search</div>
              <div style={{ fontSize: 22, opacity: 0.9 }}>Top 10 Token Holdings{username ? ` — @${username}` : ''}</div>
            </div>
            <div style={{ display: 'flex' }}>
              <div style={{ fontSize: 20, padding: '8px 14px', borderRadius: 10, background: '#1F6FEB', color: 'white', fontWeight: 700 }}>
                Total {formatUsd(total_value_usd)}
              </div>
            </div>
          </div>

          {/* Simple list (satori-safe) */}
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
            {rows.length > 0 ? (
              rows.map((line, i) => (
                <div key={i} style={{ fontSize: 16, marginBottom: 8 }}>{line}</div>
              ))
            ) : (
              <div style={{ fontSize: 18, opacity: 0.8 }}>No tokens found</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex' }}>
            <div style={{ flex: 1, opacity: 0.8, fontSize: 16 }}>walletsearch.vercel.app</div>
            <div style={{ opacity: 0.8, fontSize: 16 }}>Search Wallets 🔎</div>
          </div>
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: {
          // Cache dynamic images as recommended by docs to avoid blank previews
          'Cache-Control': 'public, immutable, no-transform, max-age=300',
        },
      }
    );
  } catch {
    // Return a tiny fallback image to avoid blank embed if something fails
    return new ImageResponse(
      (
        <div style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B1020',
          color: '#E6E8F0',
          fontSize: 32,
          fontWeight: 800,
        }}>
          Wallet Search
        </div>
      ),
      {
        width: WIDTH,
        height: HEIGHT,
        headers: { 'Cache-Control': 'public, no-transform, max-age=60' },
      }
    );
  }
}


