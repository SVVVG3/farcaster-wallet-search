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
import { fetchUserTokenBalances } from '@/lib/neynar';

export const runtime = 'edge';

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

    // Fetch top 10 tokens using existing server-side function
    const { tokens, total_value_usd } = await fetchUserTokenBalances(fid, bankrAddresses);

    // Simple two-column layout with token numbers 1–10
    const left = tokens.slice(0, 5);
    const right = tokens.slice(5, 10);

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

          {/* List */}
          <div style={{
            marginTop: 28,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 24,
            flex: 1,
          }}>
            {[left, right].map((col, ci) => (
              <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {col.map((t, i) => (
                  <div key={`${t.token_address}-${i}`} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    padding: '12px 14px',
                    borderRadius: 12,
                  }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 999,
                      background: 'linear-gradient(135deg,#6EE7F9 0%,#A78BFA 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                    }}>
                      {t.logo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={t.logo_url} alt={t.token_symbol} width={36} height={36} style={{ objectFit: 'cover' }} />
                      ) : (
                        <div style={{ color: 'white', fontWeight: 800 }}>
                          {t.token_symbol?.slice(0, 1) || '?'}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
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
                      <div style={{ fontSize: 14, opacity: 0.7 }}>{t.token_symbol}</div>
                    </div>
                    <div style={{ fontSize: 14, color: '#A8FFCF', fontWeight: 700 }}>
                      {formatUsd(t.value_usd)}
                    </div>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: 'rgba(255,255,255,0.08)',
                      color: '#E6E8F0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}>
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
      }
    );
  } catch (e) {
    return new Response('Failed to generate image', { status: 500 });
  }
}


