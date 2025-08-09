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

    // Helper function to fetch image and convert to data URI
    const fetchImageAsDataUri = async (imageUrl: string): Promise<string | null> => {
      try {
        const response = await fetch(imageUrl);
        if (!response.ok) return null;
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const contentType = response.headers.get('content-type') || 'image/png';
        const base64 = buffer.toString('base64');
        
        return `data:${contentType};base64,${base64}`;
      } catch {
        return null;
      }
    };

    // Pre-fetch token logos for top 6 tokens
    const topTokens = tokens.slice(0, 6);
    const tokensWithImages = await Promise.all(
      topTokens.map(async (token) => {
        const imageDataUri = token.logo_url ? await fetchImageAsDataUri(token.logo_url) : null;
        return { ...token, imageDataUri };
      })
    );

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
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {tokensWithImages.map((token, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                {token.imageDataUri ? (
                  <img 
                    src={token.imageDataUri} 
                    width={32} 
                    height={32} 
                    style={{ borderRadius: 16, marginRight: 12 }}
                    alt=""
                  />
                ) : (
                  <div style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    fontSize: 14,
                    fontWeight: 'bold'
                  }}>
                    {(token.token_symbol || 'T')[0]}
                  </div>
                )}
                <div style={{ fontSize: 18, minWidth: 200 }}>
                  {i + 1}. {token.token_symbol} {formatUsd(token.value_usd)}
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ fontSize: 14, opacity: 0.7, marginTop: 30, textAlign: 'center', lineHeight: 1.4 }}>
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


