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
    
    // Prepare top 10 tokens for display with visual elements
    const topTokens = tokens.slice(0, 10);
    
    // Generate a simple color for each token based on its symbol
    const getTokenColor = (symbol: string): string => {
      const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
                     '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'];
      const index = symbol.charCodeAt(0) % colors.length;
      return colors[index];
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
          <div style={{ textAlign: 'center', marginBottom: 30 }}>
            <div style={{ fontSize: 32, fontWeight: 'bold' }}>@{username}</div>
            <div style={{ fontSize: 24, marginTop: 10 }}>Portfolio: {formatUsd(total_value_usd)}</div>
          </div>

          {/* Two Column Layout with Token Icons */}
          <div style={{ display: 'flex', flex: 1, justifyContent: 'space-between' }}>
            {/* Left Column */}
            <div style={{ flex: 1, paddingRight: 30 }}>
              {topTokens.slice(0, 5).map((token, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  {/* Token Icon */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: getTokenColor(token.token_symbol || 'T'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                    {(token.token_symbol || token.token_name || 'T')[0].toUpperCase()}
                  </div>
                  {/* Token Info */}
                  <div style={{ fontSize: 16 }}>
                    {i + 1}. {token.token_symbol || token.token_name || 'TOKEN'} {formatUsd(token.value_usd)}
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div style={{ flex: 1, paddingLeft: 30 }}>
              {topTokens.slice(5, 10).map((token, i) => (
                <div key={i + 5} style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                  {/* Token Icon */}
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: getTokenColor(token.token_symbol || 'T'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    fontSize: 14,
                    fontWeight: 'bold',
                    color: 'white',
                  }}>
                    {(token.token_symbol || token.token_name || 'T')[0].toUpperCase()}
                  </div>
                  {/* Token Info */}
                  <div style={{ fontSize: 16 }}>
                    {i + 6}. {token.token_symbol || token.token_name || 'TOKEN'} {formatUsd(token.value_usd)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <div style={{ fontSize: 14, opacity: 0.8, lineHeight: 1.4 }}>
              Search by ETH/SOL wallet address or Farcaster/X username on Wallet Search 🔎
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


