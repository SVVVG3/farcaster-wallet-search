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

    // Create simple text layout (like your successful app)
    const tokenText = tokens.slice(0, 10)
      .map((token, i) => `${i + 1}. ${token.token_symbol} ${formatUsd(token.value_usd)}`)
      .join('\n');

    const content = `@${username}\nPortfolio: ${formatUsd(total_value_usd)}\n\n${tokenText}\n\nSearch by ETH/SOL wallet address or\nFarcaster/X username on Wallet Search`;

    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 18,
            color: 'white',
            background: '#0B1020',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 50,
            textAlign: 'center',
            lineHeight: 1.6,
            whiteSpace: 'pre-line',
            fontFamily: 'system-ui, sans-serif',
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