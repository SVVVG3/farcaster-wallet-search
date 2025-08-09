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

    // Create formatted text with token icons using Unicode circles
    const createTokenLine = (token: any, index: number): string => {
      if (!token) return '';
      const symbol = token.token_symbol || token.token_name || 'TOKEN';
      const value = formatUsd(token.value_usd);
      const icon = '●'; // Unicode circle as token icon
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

    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 16,
            color: 'white',
            background: '#0B1020',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 50,
            textAlign: 'center',
            fontFamily: 'monospace',
            lineHeight: 1.8,
            whiteSpace: 'pre-line',
          }}
        >
          {content}
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


