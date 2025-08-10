import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import React from 'react';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fidParam = searchParams.get('fid');
    const username = searchParams.get('username') || 'user';
    const bankrAddressesParam = searchParams.get('bankrAddresses');
    // Accept cache-busting (unused but needed for cache busting)
    searchParams.get('v');

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

    // Fetch token data and user profile data
    const origin = request.nextUrl.origin || 'https://walletsearch.vercel.app';
    
    // Fetch token balances
    const apiUrl = new URL(`${origin}/api/balance`);
    apiUrl.searchParams.set('fid', String(fid));
    if (bankrAddresses.length > 0) apiUrl.searchParams.set('bankrAddresses', bankrAddresses.join(','));

    let tokens: Array<{ token_address: string; token_name: string; token_symbol: string; value_usd?: number; logo_url?: string; r2_image_url?: string | null }> = [];
    let total_value_usd = 0;
    let userProfileImage = null;

    // Fetch token data
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

    // Fetch user profile data for profile image
    try {
      const userRes = await fetch(`${origin}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: [String(fid)] }),
        cache: 'no-store'
      });
      
      if (userRes.ok) {
        const userData = await userRes.json();
        if (userData.results?.users && userData.results.users.length > 0) {
          const rawProfileImage = userData.results.users[0].pfp_url;
          
          // Process profile image through R2 for WebP conversion if needed
          if (rawProfileImage) {
            const { getTokenImageUrl } = await import('@/lib/r2');
            userProfileImage = await getTokenImageUrl(rawProfileImage);
          }
        }
      }
    } catch (error) {
      console.log('Failed to fetch user profile:', error);
      // Fall back to no profile image
    }

    // Format USD values
    const formatUsd = (value?: number): string => {
      const v = value || 0;
      if (v < 0.01) return '<$0.01';
      if (v < 1000) return `$${v.toFixed(2)}`;
      if (v < 1_000_000) return `$${(v / 1000).toFixed(1)}K`;
      return `$${(v / 1_000_000).toFixed(1)}M`;
    };

    // PROVEN PATTERN: Use React.createElement for complex structures
    const topTokens = tokens.slice(0, 10);
    
    // Create token elements using React.createElement pattern
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createTokenElement = (token: any, index: number) => {
      // Use R2 URLs which convert WebP to PNG for Satori compatibility
      const imageUrl = token.r2_image_url || token.logo_url;
      const colors = ['hsl(0, 70%, 50%)', 'hsl(36, 70%, 50%)', 'hsl(72, 70%, 50%)', 'hsl(108, 70%, 50%)', 'hsl(144, 70%, 50%)', 'hsl(180, 70%, 50%)', 'hsl(216, 70%, 50%)', 'hsl(252, 70%, 50%)', 'hsl(288, 70%, 50%)', 'hsl(324, 70%, 50%)'];
      
      return React.createElement('div', 
        { 
          key: index,
          style: { display: 'flex', alignItems: 'center', gap: 30, marginBottom: 30 } 
        },
                          // Token image or circle - DOUBLED SIZE
                  imageUrl 
                    ? React.createElement('img', {
                        src: imageUrl,
                        width: 64,
                        height: 64,
                        style: {
                          borderRadius: '50%',
                          border: '4px solid #4F46E5',
                        }
                      })
          : React.createElement('div', {
              style: {
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: colors[index % colors.length],
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                fontWeight: 'bold',
                color: 'white',
                border: '4px solid #4F46E5',
              }
            }, (index + 1).toString()),
        // Token details - DOUBLED FONT SIZES
        React.createElement('div', 
          { style: { display: 'flex', flexDirection: 'column' } },
          React.createElement('div', 
            { style: { fontSize: 32, fontWeight: 'bold', color: 'white' } },
            `${index + 1}. ${token.token_symbol}`
          ),
          React.createElement('div', 
            { style: { fontSize: 28, color: '#E6E8F0' } },
            formatUsd(token.value_usd)
          )
        )
      );
    };

    // Build left and right columns
    const leftTokens = topTokens.slice(0, 5).map((token, i) => createTokenElement(token, i));
    const rightTokens = topTokens.slice(5, 10).map((token, i) => createTokenElement(token, i + 5));

    const imageResponse = new ImageResponse(
      React.createElement('div', {
        style: {
          background: '#0B1020',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          padding: 40,
          fontFamily: 'system-ui, sans-serif',
          color: 'white',
        }
      },
        // Header with profile image and text
        React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 30 }
        },
          // Profile image and text container
          React.createElement('div', {
            style: { display: 'flex', alignItems: 'center', gap: 20 }
          },
            // Profile image (if available)
            userProfileImage ? React.createElement('img', {
              src: userProfileImage,
              width: 80,
              height: 80,
              style: {
                borderRadius: '50%',
                border: '4px solid #4F46E5',
              }
            }) : null,
            // Username and portfolio text
            React.createElement('div', {
              style: { fontSize: 43, fontWeight: 'bold', color: 'white', textAlign: 'center' } // Reduced by 20% for longer usernames
            }, `@${username}'s Portfolio: ${formatUsd(total_value_usd)}`)
          )
        ),
        
        // 2-Column Layout - DOUBLED GAP
        React.createElement('div', {
          style: { display: 'flex', gap: 120, flex: 1, justifyContent: 'center' }
        },
          // Left Column
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' }
          }, ...leftTokens),
          
          // Right Column  
          React.createElement('div', {
            style: { display: 'flex', flexDirection: 'column' }
          }, ...rightTokens)
        ),
        
        // Footer - DOUBLED SIZE
        React.createElement('div', {
          style: { 
            display: 'flex', 
            justifyContent: 'center', 
            marginTop: 40,
            fontSize: 24,
            color: '#9CA3AF',
            textAlign: 'center'
          }
        }, 'Search by ETH/SOL wallet address or Farcaster/X username on Wallet Search 🔎')
      ),
      {
        width: 1200,
        height: 800,
      }
    );

    // Set proper cache headers for dynamic images
    imageResponse.headers.set('Cache-Control', 'public, immutable, no-transform, max-age=300');
    return imageResponse;
  } catch (e) {
    console.error('Image generation error:', e);
    
    // Return a simple fallback image on error
    try {
      const fallbackResponse = new ImageResponse(
        React.createElement('div', {
          style: {
            background: '#0B1020',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
            color: 'white',
            fontSize: 32,
          }
        }, 'Wallet Search'),
        { width: 1200, height: 800 }
      );
      
      fallbackResponse.headers.set('Cache-Control', 'public, immutable, no-transform, max-age=60');
      return fallbackResponse;
    } catch (fallbackError) {
      return new Response(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`, {
        status: 500,
      });
    }
  }
}