import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

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

    // Test approach: manually create token elements without .map()
    const topTokens = tokens.slice(0, 3); // Start with just 3 tokens to test

    return new ImageResponse(
      (
        <div
          style={{
            background: '#0B1020',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: '40px',
            fontFamily: 'system-ui, sans-serif',
            color: 'white',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '30px' }}>
            <div style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '8px' }}>
              @{username}
            </div>
            <div style={{ fontSize: '24px', color: '#E6E8F0' }}>
              Portfolio: {formatUsd(total_value_usd)}
            </div>
          </div>

          {/* Token List - Manual elements (no .map()) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1 }}>
            {/* Token 1 */}
            {topTokens[0] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {topTokens[0].logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={topTokens[0].logo_url}
                    width="32"
                    height="32"
                    style={{ borderRadius: '50%' }}
                    alt=""
                  />
                )}
                <div style={{ fontSize: '18px' }}>
                  1. {topTokens[0].token_symbol} {formatUsd(topTokens[0].value_usd)}
                </div>
              </div>
            )}

            {/* Token 2 */}
            {topTokens[1] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {topTokens[1].logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={topTokens[1].logo_url}
                    width="32"
                    height="32"
                    style={{ borderRadius: '50%' }}
                    alt=""
                  />
                )}
                <div style={{ fontSize: '18px' }}>
                  2. {topTokens[1].token_symbol} {formatUsd(topTokens[1].value_usd)}
                </div>
              </div>
            )}

            {/* Token 3 */}
            {topTokens[2] && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                {topTokens[2].logo_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={topTokens[2].logo_url}
                    width="32"
                    height="32"
                    style={{ borderRadius: '50%' }}
                    alt=""
                  />
                )}
                <div style={{ fontSize: '18px' }}>
                  3. {topTokens[2].token_symbol} {formatUsd(topTokens[2].value_usd)}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '20px',
            fontSize: '14px',
            color: '#9CA3AF',
            textAlign: 'center'
          }}>
            Search by ETH/SOL wallet address or Farcaster/X username on Wallet Search 🔎
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 800,
      }
    );
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}