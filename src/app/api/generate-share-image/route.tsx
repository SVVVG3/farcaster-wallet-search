import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

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

    // CORRECT APPROACH: Following Next.js ImageResponse docs for external images
    // Pre-fetch and convert images to data URIs for Satori compatibility
    const processedTokens = await Promise.all(
      tokens.slice(0, 10).map(async (token, index) => {
        const imageUrl = token.r2_image_url || token.logo_url;
        let imageData = null;
        
        if (imageUrl) {
          try {
            // Fetch image and convert to data URI (Satori-compatible approach)
            const response = await fetch(imageUrl, { 
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WalletSearch/1.0)' }
            });
            if (response.ok) {
              const arrayBuffer = await response.arrayBuffer();
              const base64 = Buffer.from(arrayBuffer).toString('base64');
              const contentType = response.headers.get('content-type') || 'image/png';
              imageData = `data:${contentType};base64,${base64}`;
            }
          } catch (error) {
            console.log(`Failed to fetch image for ${token.token_symbol}:`, error);
          }
        }
        
        return {
          ...token,
          imageData,
          position: index + 1
        };
      })
    );

    // Split into 2 columns
    const leftTokens = processedTokens.slice(0, 5);
    const rightTokens = processedTokens.slice(5, 10);

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

          {/* 2-Column Layout with ACTUAL token images */}
          <div style={{ display: 'flex', gap: '60px', flex: 1, justifyContent: 'center' }}>
            {/* Left Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {leftTokens.map((token) => (
                <div key={token.position} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {/* Actual Token Image */}
                  {token.imageData ? (
                    <img
                      src={token.imageData}
                      width="32"
                      height="32"
                      style={{
                        borderRadius: '50%',
                        border: '2px solid #4F46E5',
                      }}
                      alt=""
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {token.position}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {token.position}. {token.token_symbol}
                    </div>
                    <div style={{ fontSize: '14px', color: '#E6E8F0' }}>
                      {formatUsd(token.value_usd)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {rightTokens.map((token) => (
                <div key={token.position} style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                  {/* Actual Token Image */}
                  {token.imageData ? (
                    <img
                      src={token.imageData}
                      width="32"
                      height="32"
                      style={{
                        borderRadius: '50%',
                        border: '2px solid #4F46E5',
                      }}
                      alt=""
                    />
                  ) : (
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                    }}>
                      {token.position}
                    </div>
                  )}
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '16px', fontWeight: 'bold' }}>
                      {token.position}. {token.token_symbol}
                    </div>
                    <div style={{ fontSize: '14px', color: '#E6E8F0' }}>
                      {formatUsd(token.value_usd)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: '20px',
            fontSize: '12px',
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
        headers: {
          'Cache-Control': 'public, immutable, no-transform, max-age=300',
        },
      }
    );
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}