import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';
import React from 'react';

export const runtime = 'edge';

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

    // Fetch token data from balance API
    const origin = request.nextUrl.origin || 'https://walletsearch.vercel.app';
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
          style: { display: 'flex', alignItems: 'center', gap: 30, marginBottom: 40 } 
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

    return new ImageResponse(
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
        // Header - DOUBLED SIZES
        React.createElement('div', {
          style: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 60 }
        },
          React.createElement('div', {
            style: { fontSize: 64, fontWeight: 'bold', marginBottom: 16 }
          }, `@${username}`),
          React.createElement('div', {
            style: { fontSize: 48, color: '#E6E8F0' }
          }, `Portfolio: ${formatUsd(total_value_usd)}`)
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
  } catch (e) {
    return new Response(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`, {
      status: 500,
    });
  }
}