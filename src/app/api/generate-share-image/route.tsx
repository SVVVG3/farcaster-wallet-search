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
    
    // Create formatted text with token icons using different symbols
    const createTokenLine = (token: { token_symbol?: string; token_name?: string; value_usd?: number }, index: number): string => {
      if (!token) return '';
      const symbol = token.token_symbol || token.token_name || 'TOKEN';
      const value = formatUsd(token.value_usd);
      
      // Use different emojis/symbols for different token types
      const getTokenIcon = (tokenSymbol: string): string => {
        const s = tokenSymbol.toUpperCase();
        if (s.includes('ETH') || s === 'WETH') return '🔷';
        if (s.includes('BTC') || s === 'WBTC') return '🟠';
        if (s.includes('USDC') || s.includes('USDT') || s.includes('DAI')) return '💵';
        if (s.includes('SOL')) return '🟣';
        if (s.includes('LINK')) return '🔗';
        if (s.includes('UNI')) return '🦄';
        if (s.includes('AAVE')) return '👻';
        if (s.includes('COMP')) return '🏛️';
        if (s.includes('SUSHI')) return '🍣';
        if (s.includes('CRV')) return '🌊';
        return '🪙'; // Default coin emoji
      };
      
      const icon = getTokenIcon(symbol);
      return `${icon} ${index}. ${symbol} ${value}`;
    };

    // Build the display content
    const lines = [];
    lines.push(`@${username} • Portfolio: ${formatUsd(total_value_usd)}`);
    lines.push(''); // Empty line
    
    // Add tokens in 2-column format using spacing
    for (let i = 0; i < 5; i++) {
      const leftToken = topTokens[i];
      const rightToken = topTokens[i + 5];
      
      const leftLine = leftToken ? createTokenLine(leftToken, i + 1) : '';
      const rightLine = rightToken ? createTokenLine(rightToken, i + 6) : '';
      
      if (leftLine || rightLine) {
        // Pad left side to create column effect
        const paddedLeft = leftLine.padEnd(40, ' ');
        lines.push(`${paddedLeft}${rightLine}`);
      }
    }
    
    lines.push(''); // Empty line
    lines.push('Search by ETH/SOL wallet address or');
    lines.push('Farcaster/X username on Wallet Search 🔎');
    
    const content = lines.join('\n');

    // Try a simple approach with actual token images
    const topTokens = tokens.slice(0, 6); // Show top 6 with images to keep it simple

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
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 'bold', marginBottom: 10 }}>
            @{username}
          </div>
          <div style={{ fontSize: 20, marginBottom: 30, opacity: 0.9 }}>
            Portfolio: {formatUsd(total_value_usd)}
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 20 }}>
            {topTokens.map((token, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
                {token.logo_url ? (
                  <img 
                    src={token.logo_url} 
                    width={24} 
                    height={24} 
                    style={{ borderRadius: 12, marginRight: 8 }}
                    alt=""
                  />
                ) : (
                  <div style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: '#4F46E5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 8,
                    fontSize: 12,
                    fontWeight: 'bold'
                  }}>
                    {(token.token_symbol || 'T')[0]}
                  </div>
                )}
                <div style={{ fontSize: 16 }}>
                  {i + 1}. {token.token_symbol} {formatUsd(token.value_usd)}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ fontSize: 14, opacity: 0.7, marginTop: 20, textAlign: 'center' }}>
            Search by ETH/SOL wallet address or Farcaster/X username on Wallet Search 🔎
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


