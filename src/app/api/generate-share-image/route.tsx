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

    // Fetch token data via our Node API route
    const origin = req.nextUrl.origin || 'https://walletsearch.vercel.app';
    const apiUrl = new URL(`${origin}/api/balance`);
    apiUrl.searchParams.set('fid', String(fid));
    if (bankrAddresses.length > 0) apiUrl.searchParams.set('bankrAddresses', bankrAddresses.join(','));

    let tokens: Array<{ token_address: string; token_name: string; token_symbol: string; value_usd?: number }> = []; 
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
    
    return new ImageResponse(
      (
        <div
          style={{
            color: 'white',
            background: '#0B1020',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 40,
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', marginBottom: 30 }}>
            <div style={{ fontSize: 36, fontWeight: 'bold' }}>
              @{username} • Total {formatUsd(total_value_usd)}
            </div>
          </div>

          {/* Token List */}
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            {tokens.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {tokens.slice(0, 5).map((token, i) => (
                  <div key={i} style={{ 
                    fontSize: 24, 
                    marginBottom: 12,
                    display: 'flex'
                  }}>
                    {i + 1}. {token.token_symbol || token.token_name || 'TOKEN'} - {formatUsd(token.value_usd)}
                  </div>
                ))}
                {tokens.length > 5 && (
                  <div style={{ fontSize: 20, opacity: 0.7, marginTop: 10 }}>
                    ...and {tokens.length - 5} more tokens
                  </div>
                )}
              </div>
            ) : (
              <div style={{ fontSize: 24, opacity: 0.8 }}>No tokens found</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ display: 'flex', marginTop: 20 }}>
            <div style={{ fontSize: 20, opacity: 0.8 }}>
              Search Wallets 🔎
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}


