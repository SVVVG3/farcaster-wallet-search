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

    let tokens: Array<{ token_address: string; token_name: string; token_symbol: string; value_usd?: number; logo_url?: string; imageDataUri?: string | null }> = [];
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

    // Create 2-column layout with token images (like your app)
    const leftTokens = tokens.slice(0, 5);
    const rightTokens = tokens.slice(5, 10);

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
          }}
        >
          {/* Header */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            marginBottom: '30px',
          }}>
            <div style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: 'white',
              marginBottom: '8px',
            }}>
              @{username}
            </div>
            <div style={{
              fontSize: '24px',
              color: '#E6E8F0',
            }}>
              Portfolio: {formatUsd(total_value_usd)}
            </div>
          </div>

          {/* Token Grid - 2 Columns */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            flex: 1,
            gap: '60px',
          }}>
            {/* Left Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              flex: 1,
            }}>
              {leftTokens.map((token, i) => (
                <div key={i} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                }}>
                  {/* Token Image or Fallback */}
                  {token.imageDataUri ? (
                    <img
                      src={token.imageDataUri}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                      }}
                      alt={token.token_symbol}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'white',
                    }}>
                      {(token.token_symbol || 'T')[0]}
                    </div>
                  )}
                  
                  {/* Token Info */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white',
                    }}>
                      {i + 1}. {token.token_symbol}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      color: '#E6E8F0',
                    }}>
                      {formatUsd(token.value_usd)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              flex: 1,
            }}>
              {rightTokens.map((token, i) => (
                <div key={i + 5} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px',
                }}>
                  {/* Token Image or Fallback */}
                  {token.imageDataUri ? (
                    <img
                      src={token.imageDataUri}
                      style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                      }}
                      alt={token.token_symbol}
                    />
                  ) : (
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#4F46E5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      color: 'white',
                    }}>
                      {(token.token_symbol || 'T')[0]}
                    </div>
                  )}
                  
                  {/* Token Info */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                  }}>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white',
                    }}>
                      {i + 6}. {token.token_symbol}
                    </div>
                    <div style={{
                      fontSize: '16px',
                      color: '#E6E8F0',
                    }}>
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
            flexDirection: 'column',
            alignItems: 'center',
            marginTop: '30px',
            gap: '5px',
          }}>
            <div style={{
              fontSize: '14px',
              color: '#A0A0A0',
              textAlign: 'center',
            }}>
              Search by ETH/SOL wallet address or
            </div>
            <div style={{
              fontSize: '14px',
              color: '#A0A0A0',
              textAlign: 'center',
            }}>
              Farcaster/X username on Wallet Search 🔎
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 800, // 3:2 aspect ratio
      }
    );
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}