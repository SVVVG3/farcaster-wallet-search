import { NextRequest } from 'next/server';
import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username') || 'user';
    
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 40,
            color: 'white',
            background: '#0B1020',
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 50,
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 'bold', marginBottom: 20 }}>
            Wallet Search
          </div>
          <div style={{ fontSize: 24, opacity: 0.8 }}>
            Top Holdings for @{username}
          </div>
          <div style={{ fontSize: 18, opacity: 0.6, marginTop: 20 }}>
            Search Wallets 🔎
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


