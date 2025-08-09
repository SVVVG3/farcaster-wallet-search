import type { Metadata } from 'next';

interface SharePageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata(
  { searchParams }: SharePageProps
): Promise<Metadata> {
  const params = await searchParams;
  const fid = typeof params.fid === 'string' ? params.fid : Array.isArray(params.fid) ? params.fid[0] : undefined;
  const username = typeof params.username === 'string' ? params.username : Array.isArray(params.username) ? params.username[0] : undefined;
  const bankrAddresses = typeof params.bankrAddresses === 'string' ? params.bankrAddresses : Array.isArray(params.bankrAddresses) ? params.bankrAddresses.join(',') : undefined;

  const v = Date.now().toString();

  const url = new URL(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://walletsearch.vercel.app'}/api/generate-share-image`);
  if (fid) url.searchParams.set('fid', fid);
  if (username) url.searchParams.set('username', username);
  if (bankrAddresses) url.searchParams.set('bankrAddresses', bankrAddresses);
  url.searchParams.set('v', v);

  const imageUrl = url.toString();

  // fc:miniapp + fc:frame meta via other metadata fields is not directly supported by Next Metadata API.
  // We'll return OG/Twitter images and the <head> will include default fc tags from layout; this page is only used as an embed URL.
  return {
    title: `Wallet Search — ${username ? '@' + username : 'Top Holdings'}`,
    description: 'Top 10 token holdings on Base',
    openGraph: {
      images: [{ url: imageUrl, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      images: [imageUrl],
    },
    other: {
      // Emit fc meta tags manually
      'fc:miniapp': JSON.stringify({
        version: '1',
        imageUrl,
        button: {
          title: 'Search Wallets 🔎',
          action: {
            type: 'launch_miniapp',
            name: 'Wallet Search',
            url: process.env.NEXT_PUBLIC_BASE_URL || 'https://walletsearch.vercel.app',
            splashImageUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://walletsearch.vercel.app'}/WalletSearchIcon.png`,
            splashBackgroundColor: '#000000',
          },
        },
      }),
      'fc:frame': JSON.stringify({
        version: '1',
        imageUrl,
        button: {
          title: 'Search Wallets 🔎',
          action: {
            type: 'launch_frame',
            name: 'Wallet Search',
            url: process.env.NEXT_PUBLIC_BASE_URL || 'https://walletsearch.vercel.app',
            splashImageUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://walletsearch.vercel.app'}/WalletSearchIcon.png`,
            splashBackgroundColor: '#000000',
          },
        },
      }),
    },
  };
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const params = await searchParams;
  const username = typeof params.username === 'string' ? params.username : '';

  return (
    <main className="min-h-[60vh] flex items-center justify-center text-center p-8">
      <div>
        <h1 className="text-2xl font-bold mb-3">Share Preview</h1>
        <p className="text-gray-500">This URL is for embedding in casts. The dynamic image is set via metadata.</p>
        {username && <p className="mt-2 text-gray-400">User: @{username}</p>}
      </div>
    </main>
  );
}


