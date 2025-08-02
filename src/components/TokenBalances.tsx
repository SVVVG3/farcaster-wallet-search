'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

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
}

interface TokenRowProps {
  token: TokenBalance;
  index: number;
}

function TokenRow({ token, index }: TokenRowProps) {
  const formatBalance = (balance: string, decimals: number = 18): string => {
    try {
      const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
      if (balanceNum < 0.0001) return '<0.0001';
      if (balanceNum < 1) return balanceNum.toFixed(4);
      if (balanceNum < 1000) return balanceNum.toFixed(2);
      if (balanceNum < 1000000) return (balanceNum / 1000).toFixed(1) + 'K';
      return (balanceNum / 1000000).toFixed(1) + 'M';
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
    <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors min-w-0">
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
              className="rounded-full absolute inset-0"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Token Info */}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="flex items-center space-x-2 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate flex-1 min-w-0">
              {token.token_name || token.token_symbol}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-mono flex-shrink-0">
              #{index + 1}
            </span>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600 dark:text-gray-300 min-w-0">
            <span className="font-mono truncate">{token.token_symbol}</span>
            <span className="flex-shrink-0">•</span>
            <span className="truncate">{formatBalance(token.balance)}</span>
          </div>
        </div>
      </div>

      {/* USD Value */}
      <div className="text-right flex-shrink-0 ml-3">
        <div className="font-semibold text-gray-900 dark:text-white text-sm whitespace-nowrap">
          {formatUsdValue(token.value_usd || 0)}
        </div>
      </div>
    </div>
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

export default function TokenBalances({ fid, username }: TokenBalancesProps) {
  const [balanceData, setBalanceData] = useState<TokenBalanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log(`TokenBalances: Fetching balances for FID ${fid} (@${username})`);
        
        const response = await fetch(`/api/balance?fid=${fid}`);
        
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
  }, [fid, username]);

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
    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-4 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between min-w-0">
        <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
          Token Holdings
        </h4>
        <div className="text-right flex-shrink-0">
          <div className="text-sm font-semibold text-gray-900 dark:text-white">
            ${totalValue > 0 ? totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {balanceData.tokens.length} token{balanceData.tokens.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Token List */}
      <div className="space-y-1 overflow-hidden">
        {balanceData.tokens.map((token, index) => (
          <TokenRow
            key={`${token.token_address}-${index}`}
            token={token}
            index={index}
          />
        ))}
      </div>

      {/* Footer note */}
      <div className="text-xs text-gray-500 dark:text-gray-400 text-center pt-2 border-t border-gray-200 dark:border-gray-600">
        Showing top {balanceData.tokens.length} legitimate holdings on Base network
      </div>
    </div>
  );
}