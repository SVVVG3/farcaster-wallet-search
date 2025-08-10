'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { sdk } from '@farcaster/miniapp-sdk';
import { getExplorerUrl } from '@/lib/validation';

// Token balance interfaces (moved here to avoid importing server-side code)
interface TokenBalance {
  token_address: string;
  token_name: string;
  token_symbol: string; 
  balance: string;
  balance_formatted?: string;
  price_usd?: number;
  value_usd?: number;
  logo_url?: string;
}

interface TokenBalanceResult {
  fid: number;
  tokens: TokenBalance[];
  total_value_usd: number;
  error?: string;
}

interface TokenBalancesProps {
  fid: number;
  username: string;
  bankrAddresses?: string[];
}

interface TokenRowProps {
  token: TokenBalance;
  index: number;
}

// Haptic feedback functions (similar to ProfileDisplay)
const isInMiniApp = async () => {
  try {
    if (!sdk || !sdk.context) return false;
    const context = await sdk.context;
    return context && context.client && typeof context.client.clientFid === 'number';
  } catch {
    return false;
  }
};

const triggerHaptic = async () => {
  try {
    if ((await isInMiniApp()) && sdk && sdk.haptics) {
      console.log('📳 Checking haptic capabilities for token click');
      
      // Check if haptics are supported
      if (sdk.getCapabilities) {
        const capabilities = await sdk.getCapabilities();
        if (capabilities.includes('haptics.impactOccurred')) {
          console.log('✅ Haptics supported, triggering feedback for token');
          await sdk.haptics.impactOccurred('medium');
        } else {
          console.log('❌ Haptics not supported on this device');
        }
      } else {
        // Fallback for older SDK versions
        console.log('📳 Using fallback haptic method for token');
        await sdk.haptics.impactOccurred('medium');
      }
    } else {
      console.log('❌ Not in mini app or haptics not available for token');
    }
  } catch (error) {
    console.error('❌ Haptic feedback failed for token:', error);
  }
};

const handleExternalLink = async (url: string) => {
  console.log('🔗 Opening external token link:', url);
  await triggerHaptic();
  
  // Small delay to allow haptic feedback to be felt before navigation
  await new Promise(resolve => setTimeout(resolve, 50));
  
  // Only use SDK if we're in mini app environment
  if (await isInMiniApp()) {
    try {
      if (sdk && sdk.actions && sdk.actions.openUrl) {
        console.log('✅ Using SDK to open token URL');
        await sdk.actions.openUrl(url);
        return;
      }
    } catch (error) {
      console.error('❌ Failed to open external token URL with SDK:', error);
    }
  }
  
  // Fallback to window.open for desktop browsers  
  console.log('🌐 Using window.open fallback for token');
  window.open(url, '_blank', 'noopener,noreferrer');
};

const openTokenExplorer = (tokenAddress: string) => {
  const { url } = getExplorerUrl(tokenAddress);
  if (url) {
    handleExternalLink(url);
  }
};

function TokenRow({ token, index }: TokenRowProps) {
  const formatBalance = (balance: string): string => {
    try {
      // The balance from our TokenBalance interface is already in decimal format
      // from the Neynar API (in_token field), no need to divide by decimals
      const balanceNum = parseFloat(balance);
      if (balanceNum === 0) return '0';
      
      // For very small amounts, show more precision or scientific notation
      if (balanceNum < 0.001) {
        if (balanceNum < 0.00001) {
          return balanceNum.toExponential(2); // e.g., 2.97e-5
        }
        return balanceNum.toFixed(6); // e.g., 0.000530
      }
      
      // For small amounts, show reasonable decimals
      if (balanceNum < 1) return balanceNum.toFixed(4); // e.g., 0.0999
      
      // For moderate amounts
      if (balanceNum < 1000) return balanceNum.toFixed(2); // e.g., 722.29
      
      // For large amounts, use K/M notation
      if (balanceNum < 1000000) return (balanceNum / 1000).toFixed(1) + 'K'; // e.g., 7.5K
      return (balanceNum / 1000000).toFixed(1) + 'M'; // e.g., 2.9M
    } catch {
      return balance;
    }
  };

  const formatUsdValue = (value: number): string => {
    if (value < 0.01) return '<$0.01';
    if (value < 1000) return `$${value.toFixed(2)}`;
    if (value < 1000000) return `$${(value / 1000).toFixed(1)}K`;
    return `$${(value / 1000000).toFixed(1)}M`;
  };

  return (
    <button
      onClick={() => openTokenExplorer(token.token_address)}
      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors min-w-0 cursor-pointer hover:shadow-sm"
      title={`View ${token.token_name} contract on BaseScan`}
    >
      <div className="flex items-center space-x-3 flex-1 min-w-0 overflow-hidden">
        {/* Token Icon */}
        <div className="flex-shrink-0 relative">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {token.token_symbol.charAt(0)}
            </span>
          </div>
          {token.logo_url && (
            <Image
              src={token.logo_url}
              alt={`${token.token_name} logo`}
              width={32}
              height={32}
              className="rounded-full absolute inset-0 bg-white"
              onLoad={() => {
                console.log(`✅ Loaded logo for ${token.token_symbol}: ${token.logo_url}`);
              }}
              onError={(e) => {
                console.log(`❌ Failed to load logo for ${token.token_symbol}: ${token.logo_url}`);
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
              unoptimized={true} // Skip Next.js optimization for external images
            />
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center space-x-2 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[120px] sm:max-w-[180px]">
              {token.token_name || token.token_symbol}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
              #{index + 1}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 min-w-0">
            <span className="font-mono truncate max-w-[80px] sm:max-w-[120px]">{token.token_symbol}</span>
            <span className="flex-shrink-0">•</span>
            <span className="truncate max-w-[60px] sm:max-w-[100px]">{formatBalance(token.balance)}</span>
          </div>
        </div>
      </div>

      {/* USD Value */}
      <div className="text-right flex-shrink-0 ml-3">
        <div className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
          {formatUsdValue(token.value_usd || 0)}
        </div>
      </div>
    </button>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-24" />
            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16" />
          </div>
          <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16" />
        </div>
      ))}
    </div>
  );
}

export default function TokenBalances({ fid, username, bankrAddresses = [] }: TokenBalancesProps) {
  const [balanceData, setBalanceData] = useState<TokenBalanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const handleShare = async () => {
    try {
      await triggerHaptic();
      const base = process.env.NEXT_PUBLIC_BASE_URL || 'https://walletsearch.vercel.app';
      const params = new URLSearchParams({ fid: String(fid) });
      if (username) params.set('username', username);
      if (bankrAddresses.length > 0) params.set('bankrAddresses', bankrAddresses.join(','));
      params.set('v', Date.now().toString());
      const shareUrl = `${base}/share?${params.toString()}`;
      const text = `View @${username}'s top holdings across all Farcaster connected wallets on Wallet Search!`;
      if (sdk && sdk.actions && sdk.actions.composeCast) {
        await sdk.actions.composeCast({ text, embeds: [shareUrl] });
      } else {
        // Fallback: copy to clipboard and open
        try { await navigator.clipboard.writeText(shareUrl); } catch {}
        window.open(shareUrl, '_blank');
      }
    } catch (e) {
      console.error('Share failed', e);
    }
  };

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`TokenBalances: Fetching balances for FID ${fid} (@${username})`);
        
        // Build query parameters
        const params = new URLSearchParams({ fid: fid.toString() });
        if (bankrAddresses.length > 0) {
          params.set('bankrAddresses', bankrAddresses.join(','));
          console.log(`TokenBalances: Including ${bankrAddresses.length} Bankr addresses: ${bankrAddresses.join(', ')}`);
        }
        
        const response = await fetch(`/api/balance?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result: TokenBalanceResult = await response.json();
        
        console.log(`TokenBalances: Received ${result.tokens.length} tokens for @${username}`);
        setBalanceData(result);
        
        if (result.error) {
          console.warn(`TokenBalances: API returned error for @${username}:`, result.error);
          setError(result.error);
        }
      } catch (err) {
        console.error(`TokenBalances: Failed to fetch balances for @${username}:`, err);
        setError(err instanceof Error ? err.message : 'Failed to load token balances');
      } finally {
        setLoading(false);
      }
    };

    fetchBalances();
  }, [fid, username, bankrAddresses]);

  // Don't render anything if loading and no data yet
  if (loading && !balanceData) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Token Holdings
          </h4>
          <div className="text-sm text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  // Don't render if error and no data
  if (error && (!balanceData || balanceData.tokens.length === 0)) {
    console.log(`TokenBalances: Not rendering due to error with no data for @${username}:`, error);
    return null; // Graceful degradation - don't show error UI
  }

  // Don't render if no tokens
  if (!balanceData || balanceData.tokens.length === 0) {
    console.log(`TokenBalances: No tokens found for @${username}, not rendering component`);
    return null; // Graceful degradation - don't show empty state
  }

  const totalValue = balanceData.total_value_usd;

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-hidden w-full max-w-full">
      {/* Header */}
      <div className="flex items-center justify-between min-w-0">
        <h4 className="text-base font-semibold text-gray-900 dark:text-white truncate">
          Token Holdings
        </h4>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button
            onClick={handleShare}
            className="px-3 py-1.5 text-xs font-semibold rounded-md transition-colors text-white flex items-center gap-1.5"
            style={{ backgroundColor: '#7c65c1' }}
          >
            <img 
              src="/farcaster-arch-icon.png" 
              alt="Farcaster" 
              className="w-3.5 h-3.5"
            />
            Share
          </button>
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
              ${totalValue > 0 ? totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
              {balanceData.tokens.length} token{balanceData.tokens.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>

      {/* Token List */}
      <div className="space-y-1 overflow-hidden w-full">
        {balanceData.tokens.map((token, index) => (
          <div key={`${token.token_address}-${index}`} className="w-full max-w-full overflow-hidden">
            <TokenRow
              token={token}
              index={index}
            />
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-600">
        Showing top {balanceData.tokens.length} legitimate holdings on Base network
      </div>
    </div>
  );
}