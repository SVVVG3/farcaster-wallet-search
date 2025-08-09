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

    // Simple two-column layout with token numbers 1–10
    const left = (tokens || []).slice(0, 5);
    const right = (tokens || []).slice(5, 10);

    return new ImageResponse(
      (
        // Container
        <div style={{
          width: WIDTH,
          height: HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #0B1020 0%, #101524 100%)',
          color: '#E6E8F0',
          padding: 48,
          fontFamily: 'Inter, ui-sans-serif, system-ui',
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: 36, fontWeight: 800 }}>Wallet Search</div>
              <div style={{ fontSize: 22, opacity: 0.9 }}>
                Top 10 Token Holdings{username ? ` — @${username}` : ''}
              </div>
            </div>
            <div style={{
              fontSize: 20,
              padding: '8px 14px',
              borderRadius: 10,
              background: '#1F6FEB',
              color: 'white',
              fontWeight: 700,
            }}>
              Total {formatUsd(total_value_usd)}
            </div>
          </div>

          {/* List - avoid CSS grid (satori limitation) */}
          <div style={{ marginTop: 28, display: 'flex', gap: 24, flex: 1 }}>
            {[left, right].map((col, ci) => (
              <div key={ci} style={{ display: 'flex', flexDirection: 'column' }}>
                {col.map((t, i) => (
                  <div key={`${t.token_address}-${i}`} style={{ display: 'flex', alignItems: 'center', marginBottom: 12, padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 999, background: '#6E8BFA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ color: 'white', fontWeight: 800 }}>
                        {t.token_symbol?.slice(0, 1) || '?'}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', marginLeft: 10, flex: 1 }}>
                      <div style={{
                        fontSize: 16,
                        fontWeight: 700,
                        maxWidth: 320,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}>
                        {t.token_name || t.token_symbol}
                      </div>
                      <div style={{ fontSize: 14, opacity: 0.7, marginLeft: 8 }}>{t.token_symbol}</div>
                    </div>
                    <div style={{ fontSize: 14, color: '#A8FFCF', fontWeight: 700, marginRight: 10 }}>
                      {formatUsd(t.value_usd)}
                    </div>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.08)', color: '#E6E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                      {ci === 0 ? i + 1 : i + 6}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'space-between', opacity: 0.8, fontSize: 16 }}>
            <div>walletsearch.vercel.app</div>
            <div>Search Wallets 🔎</div>
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


