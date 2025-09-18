import { NeynarAPIClient } from '@neynar/nodejs-sdk';

// Initialize the Neynar client
const client = new NeynarAPIClient({ apiKey: process.env.NEYNAR_API_KEY! });

export interface BankrData {
  username: string;
  platform: string;
  accountId: string;
  evmAddress: string;
  solanaAddress: string;
  bankrClub: boolean;
}

export interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  profile: {
    bio: {
      text: string;
    };
  };
  follower_count: number;
  following_count: number;
  verifications: string[];
  verified_addresses: {
    eth_addresses: string[];
    sol_addresses: string[];
    primary?: {
      eth_address: string | null;
      sol_address: string | null;
    };
  };
  verified_accounts: Array<{
    platform: string;
    username: string;
  }>;
  custody_address: string;
  power_badge?: boolean;
  pro?: {
    status: 'subscribed' | 'unsubscribed' | 'inactive';
    subscribed_at?: string;
    expires_at?: string;
  };
  score?: number;
  bankrData?: {
    farcaster: BankrData | null;
    twitter: BankrData | null;
  };
}

export interface SearchResult {
  users: FarcasterUser[];
  searchedInputs: string[];
  notFoundInputs: string[];
}

export interface UsernameSearchResult {
  users: FarcasterUser[];
  searchedUsernames: string[];
  notFoundUsernames: string[];
}

export interface FIDSearchResult {
  users: FarcasterUser[];
  searchedFIDs: string[];
  notFoundFIDs: string[];
}

export interface XUsernameSearchResult {
  users: FarcasterUser[];
  searchedXUsernames: string[];
  notFoundXUsernames: string[];
}

/**
 * Search for Farcaster users by wallet addresses (Ethereum or Solana)
 * @param addresses - Array of wallet addresses to search for
 * @returns Promise with search results
 */
export async function searchUsersByAddresses(addresses: string[]): Promise<SearchResult> {
  try {
    console.log('Searching for users with addresses:', addresses);
    
    // Try SDK first, fallback to direct API if it fails
    try {
      const response = await client.fetchBulkUsersByEthOrSolAddress({
        addresses: addresses
      });

      console.log('SDK API Response:', response);

      // Extract users from the response - API returns { "address": [users] } format
      const allUsers: FarcasterUser[] = [];
      const foundAddresses: string[] = [];
      
      for (const [address, users] of Object.entries(response)) {
        if (Array.isArray(users) && users.length > 0) {
          allUsers.push(...(users as FarcasterUser[]));
          foundAddresses.push(address);
        }
      }
      
      // Find addresses that didn't return any users
      const notFoundAddresses = addresses.filter(addr => 
        !foundAddresses.some(foundAddr => 
          foundAddr.toLowerCase() === addr.toLowerCase()
        )
      );

      return {
        users: allUsers,
        searchedInputs: addresses,
        notFoundInputs: notFoundAddresses
      };
    } catch (sdkError) {
      console.log('SDK failed, falling back to direct API call:', sdkError);
      
      // Fallback to direct REST API call
      const addressesParam = addresses.join(',');
      const url = `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${encodeURIComponent(addressesParam)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': process.env.NEYNAR_API_KEY!
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Direct API Response:', data);

      // Extract users from the response - API returns { "address": [users] } format
      const allUsers: FarcasterUser[] = [];
      const foundAddresses: string[] = [];
      
      for (const [address, users] of Object.entries(data)) {
        if (Array.isArray(users) && users.length > 0) {
          allUsers.push(...(users as FarcasterUser[]));
          foundAddresses.push(address);
        }
      }
      
      // Find addresses that didn't return any users
      const notFoundAddresses = addresses.filter(addr => 
        !foundAddresses.some(foundAddr => 
          foundAddr.toLowerCase() === addr.toLowerCase()
        )
      );

      return {
        users: allUsers,
        searchedInputs: addresses,
        notFoundInputs: notFoundAddresses
      };
    }
  } catch (error) {
    console.error('Error searching for users by addresses:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to search users: ${error.message}`
        : 'Failed to search users'
    );
  }
}

/**
 * Search for Farcaster users by FIDs (Farcaster IDs)
 * @param fids - Array of FIDs to search for
 * @returns Promise with search results
 */
export async function searchUsersByFIDs(fids: string[]): Promise<FIDSearchResult> {
  try {
    console.log('Searching for users with FIDs:', fids);
    
    // Try SDK first, fallback to direct API if it fails
    try {
      const response = await client.fetchBulkUsers({
        fids: fids.map(fid => parseInt(fid))
      });

      console.log('SDK API Response for FIDs:', response);

      const allUsers: FarcasterUser[] = (response.users || []) as FarcasterUser[];
      const foundFIDs: string[] = allUsers.map(user => user.fid.toString());
      
      // Find FIDs that didn't return any users
      const notFoundFIDs = fids.filter(fid => 
        !foundFIDs.includes(fid)
      );

      return {
        users: allUsers,
        searchedFIDs: fids,
        notFoundFIDs
      };
    } catch (sdkError) {
      console.log('SDK failed for FIDs, falling back to direct API call:', sdkError);
      
      // Fallback to direct REST API call
      const fidsParam = fids.join(',');
      const url = `https://api.neynar.com/v2/farcaster/user/bulk?fids=${encodeURIComponent(fidsParam)}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'accept': 'application/json',
          'api_key': process.env.NEYNAR_API_KEY!
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Direct API Response for FIDs:', data);

      const allUsers: FarcasterUser[] = data.users || [];
      const foundFIDs: string[] = allUsers.map(user => user.fid.toString());
      
      // Find FIDs that didn't return any users
      const notFoundFIDs = fids.filter(fid => 
        !foundFIDs.includes(fid)
      );

      return {
        users: allUsers,
        searchedFIDs: fids,
        notFoundFIDs
      };
    }
  } catch (error) {
    console.error('Error searching for users by FIDs:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to search users: ${error.message}`
        : 'Failed to search users'
    );
  }
}

/**
 * Search for Farcaster users by X (Twitter) usernames
 * @param xUsernames - Array of X usernames to search for
 * @returns Promise with search results
 */
export async function searchUsersByXUsernames(xUsernames: string[]): Promise<XUsernameSearchResult> {
  try {
    console.log('Searching for users with X usernames:', xUsernames);
    
    const allUsers: FarcasterUser[] = [];
    const foundXUsernames: string[] = [];
    const notFoundXUsernames: string[] = [];

    // Search for each X username individually
    for (const xUsername of xUsernames) {
      try {
        console.log(`Searching for X username: ${xUsername}`);
        
        // Direct API call - no SDK method available for this endpoint
        const url = `https://api.neynar.com/v2/farcaster/user/by_x_username/?x_username=${encodeURIComponent(xUsername)}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'accept': 'application/json',
            'x-api-key': process.env.NEYNAR_API_KEY!
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log(`X username search response for ${xUsername}:`, data);

          // API returns an object with users array: {"users": [...]}
          if (data && data.users && Array.isArray(data.users) && data.users.length > 0) {
            // Add all users who have verified this X username
            data.users.forEach((user: FarcasterUser) => {
              allUsers.push(user);
            });
            foundXUsernames.push(xUsername);
          } else {
            notFoundXUsernames.push(xUsername);
          }
        } else if (response.status === 404) {
          // User not found
          console.log(`X username ${xUsername} not found`);
          notFoundXUsernames.push(xUsername);
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (error) {
        console.error(`Error searching for X username ${xUsername}:`, error);
        notFoundXUsernames.push(xUsername);
      }
    }

    return {
      users: allUsers,
      searchedXUsernames: xUsernames,
      notFoundXUsernames
    };
  } catch (error) {
    console.error('Error searching for users by X usernames:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to search users: ${error.message}`
        : 'Failed to search users'
    );
  }
}

/**
 * Search for Farcaster users by usernames
 * @param usernames - Array of usernames to search for
 * @returns Promise with search results
 */
export async function searchUsersByUsernames(usernames: string[]): Promise<UsernameSearchResult> {
  try {
    console.log('Searching for users with usernames:', usernames);
    
    const allUsers: FarcasterUser[] = [];
    const foundUsernames: string[] = [];
    const notFoundUsernames: string[] = [];

    // Search for each username individually
    for (const username of usernames) {
      try {
        console.log(`Looking up user by username: ${username}`);
        
        // Use the Neynar SDK to lookup user by exact username
        // Note: viewerFid is optional but may help with response format
        const response = await client.lookupUserByUsername({ 
          username: username,
          viewerFid: 1 // Using FID 1 as a default viewer
        });
        
        console.log(`Username lookup response for ${username}:`, JSON.stringify(response, null, 2));

        // Check if user was found in response
        if (response && response.user && response.user.fid) {
          console.log(`Found user for ${username}:`, response.user.username, 'FID:', response.user.fid);
          allUsers.push(response.user as FarcasterUser);
          foundUsernames.push(username);
        } else {
          console.log(`No user found for ${username}. Response structure:`, Object.keys(response || {}));
          notFoundUsernames.push(username);
        }
      } catch (error) {
        console.error(`Error looking up username ${username}:`, error);
        
        // Log more details about the error
        if (error instanceof Error) {
          console.error(`Error message: ${error.message}`);
          console.error(`Error stack: ${error.stack}`);
        }
        
        // Check if it's a 404 (user not found) vs other errors
        if (error && typeof error === 'object' && 'status' in error) {
          console.error(`HTTP Status: ${(error as { status: unknown }).status}`);
        }
        
        notFoundUsernames.push(username);
      }
    }

    return {
      users: allUsers,
      searchedUsernames: usernames,
      notFoundUsernames
    };
  } catch (error) {
    console.error('Error searching for users by usernames:', error);
    throw new Error(
      error instanceof Error 
        ? `Failed to search users: ${error.message}`
        : 'Failed to search users'
    );
  }
}

// Token Balance Interfaces
export interface TokenBalance {
  token_address: string;
  token_name: string;
  token_symbol: string; 
  balance: string;
  balance_formatted?: string;
  price_usd?: number;
  value_usd?: number;
  logo_url?: string;
}

export interface UserBalanceResponse {
  user_balance: {
    fid: number;
    tokens: TokenBalance[];
    total_value_usd?: number;
  };
}

export interface TokenBalanceResult {
  fid: number;
  tokens: TokenBalance[];
  total_value_usd: number;
  error?: string;
}

// Function to fetch token balances for specific addresses using Base network APIs
async function fetchTokenBalancesForAddresses(addresses: string[]): Promise<TokenBalance[]> {
  const allTokens: TokenBalance[] = [];
  
  for (const address of addresses) {
    console.log(`Fetching token balances for Bankr address: ${address}`);
    
    try {
      // For now, we'll use a simple approach - in a production app you might want to use
      // services like Moralis, Alchemy, or other token balance APIs
      // This is a placeholder that returns empty results for Bankr addresses
      console.log(`⚠️ Token balance fetching for individual addresses (${address}) not yet implemented`);
      console.log(`📝 This would require integration with services like Moralis or Alchemy`);
      
      // TODO: Implement token balance fetching for individual addresses
      // Example services that could be used:
      // - Moralis API
      // - Alchemy API  
      // - Base network RPC calls
      // - DexScreener API (limited)
      
    } catch (error) {
      console.error(`Error fetching token balances for address ${address}:`, error);
    }
  }
  
  return allTokens;
}

/**
 * Fetch token balances for a user by their FID
 * Returns top 10 tokens sorted by USD value (highest first)
 * Includes balances from both verified addresses (via Neynar) and Bankr wallets
 * @param fid - Farcaster ID of the user
 * @param bankrAddresses - Optional array of Bankr wallet addresses to include
 * @returns Promise with token balance results
 */
export async function fetchUserTokenBalances(fid: number, bankrAddresses: string[] = []): Promise<TokenBalanceResult> {
    // Get token logo URL from multiple sources with fallbacks
  const getTokenLogoUrl = async (tokenAddress: string, symbol: string): Promise<string | undefined> => {
    if (!tokenAddress || tokenAddress === 'native') {
      // Handle native tokens
      if (symbol === 'ETH') {
        return 'https://assets.coingecko.com/coins/images/279/small/ethereum.png';
      }
      return undefined;
    }
    
    // Convert to lowercase for consistency (most services expect lowercase)
    const lowerCaseAddress = tokenAddress.toLowerCase();
    
    // For well-known tokens, use reliable logo URLs
    const knownTokenLogos: { [key: string]: string } = {
      // Major tokens with reliable logos
      '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913': 'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png', // USDC
      '0x4200000000000000000000000000000000000006': 'https://assets.coingecko.com/coins/images/2518/small/weth.png', // WETH
      '0x940181a94a35a4569e4529a3cdfb74e38fd98631': 'https://assets.coingecko.com/coins/images/31745/small/token.png', // AERO 
      '0x4ed4e862860bed51a9570b96d89af5e1b0efefed': 'https://assets.coingecko.com/coins/images/34515/small/android-chrome-512x512.png', // DEGEN
      '0x0578d8a44db98b23bf096a382e016e29a5ce0ffe': 'https://assets.coingecko.com/coins/images/36617/small/higher.jpg', // HIGHER
      '0x8c9037d1ef5c6d1f6816278c7aaf5491d24cd527': 'https://assets.coingecko.com/coins/images/38013/small/Frame_20_%281%29.png', // MOXIE
      '0x1111111111166b7fe7bd91427724b487980afc69': 'https://assets.coingecko.com/coins/images/31622/small/zora-logo-200x200.png', // ZORA
    };
    
    // Check if we have a known logo for this token
    if (knownTokenLogos[lowerCaseAddress]) {
      return knownTokenLogos[lowerCaseAddress];
    }
    
    // Try DexScreener API for token logo
    try {
      const dexScreenerUrl = `https://api.dexscreener.com/tokens/v1/base/${tokenAddress}`;
      const response = await fetch(dexScreenerUrl);
      
      if (response.ok) {
        const data = await response.json();
        // DexScreener returns an array of pairs, we want the first one with info
        if (Array.isArray(data) && data.length > 0) {
          for (const pair of data) {
            if (pair.info && pair.info.imageUrl) {
              console.log(`🎯 Found DexScreener logo for ${symbol}: ${pair.info.imageUrl}`);
              return pair.info.imageUrl;
            }
          }
        }
      }
    } catch (error) {
      console.log(`⚠️ DexScreener API failed for ${symbol}:`, error);
    }
    
    // Fall back to TrustWallet with proper checksum case
    const checksumAddress = tokenAddress; // Keep original case for now
    return `https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/base/assets/${checksumAddress}/logo.png`;
  };

  try {
    console.log(`Fetching token balances for FID: ${fid}`);

    const response = await client.fetchUserBalance({
      fid: fid,
      networks: ['base'] // Currently only 'base' network is supported
    });

    console.log(`Token balance response for FID ${fid}:`, JSON.stringify(response, null, 2));

    if (!response || !response.user_balance) {
      console.log(`No balance data found for FID ${fid}`);
      return {
        fid,
        tokens: [],
        total_value_usd: 0
      };
    }

    const balanceData = response.user_balance;
    
    // Extract tokens from all verified addresses
    const addressBalances = (balanceData as { address_balances?: unknown[] }).address_balances || [];
    console.log(`Found ${addressBalances.length} verified addresses for FID ${fid}`);
    
    // Flatten all token balances across all addresses
    const allTokens: TokenBalance[] = [];
    
    for (const addressBalance of addressBalances) {
      const addressBalanceData = addressBalance as { 
        token_balances?: unknown[]; 
        verified_address?: { address?: string } 
      };
      const tokenBalances = addressBalanceData.token_balances || [];
      console.log(`Address ${addressBalanceData.verified_address?.address}: ${tokenBalances.length} tokens`);
      
      for (const tokenBalance of tokenBalances) {
        const tokenBalanceData = tokenBalance as { 
          token?: { name?: string; symbol?: string; contract_address?: string };
          balance?: { in_token?: number; in_usdc?: number }
        };
        const token = tokenBalanceData.token;
        const balance = tokenBalanceData.balance;

        // Map to our TokenBalance interface (temporarily without logo)
        const mappedToken: TokenBalance = {
          token_address: token?.contract_address || 'native',
          token_name: token?.name || token?.symbol || 'Unknown',
          token_symbol: token?.symbol || 'UNKNOWN',
          balance: balance?.in_token?.toString() || '0',
          value_usd: balance?.in_usdc || 0,
          logo_url: undefined, // Will be populated later
        };
        
        allTokens.push(mappedToken);
      }
    }

    console.log(`Found ${allTokens.length} total tokens across all addresses for FID ${fid}`);

    // Fetch token balances for Bankr wallet addresses (if any)
    if (bankrAddresses.length > 0) {
      console.log(`Fetching token balances for ${bankrAddresses.length} Bankr wallet addresses`);
      const bankrTokens = await fetchTokenBalancesForAddresses(bankrAddresses);
      console.log(`Found ${bankrTokens.length} tokens from Bankr wallets`);
      
      // Add Bankr tokens to the combined list
      allTokens.push(...bankrTokens);
      console.log(`Combined total: ${allTokens.length} tokens (${allTokens.length - bankrTokens.length} from Neynar + ${bankrTokens.length} from Bankr)`);
    } else {
      console.log(`No Bankr wallet addresses provided for FID ${fid}`);
    }

    // Aggregate tokens by contract address (combine same tokens from different wallets)
    const tokenGroups = new Map<string, TokenBalance>();

    for (const token of allTokens) {
      // Use contract address as key (lowercase for consistency)
      const key = token.token_address.toLowerCase();
      
      if (tokenGroups.has(key)) {
        // Aggregate with existing token
        const existing = tokenGroups.get(key)!;
        const existingBalance = parseFloat(existing.balance) || 0;
        const newTokenBalance = parseFloat(token.balance) || 0;
        const combinedBalance = existingBalance + newTokenBalance;
        const combinedValue = (existing.value_usd || 0) + (token.value_usd || 0);
        
        // Update the aggregated token
        existing.balance = combinedBalance.toString();
        existing.value_usd = combinedValue;
        
        console.log(`📊 Aggregated ${existing.token_symbol}: ${existingBalance} + ${newTokenBalance} = ${combinedBalance} (${existing.token_name})`);
      } else {
        // First occurrence of this token
        tokenGroups.set(key, { ...token });
      }
    }

    // Convert aggregated tokens back to array
    const aggregatedTokens = Array.from(tokenGroups.values());
    console.log(`After aggregation: ${aggregatedTokens.length} unique tokens for FID ${fid} (reduced from ${allTokens.length} individual entries)`);

    // Populate token logos (async operation)
    console.log(`🖼️ Fetching logos for ${aggregatedTokens.length} tokens...`);
    await Promise.all(aggregatedTokens.map(async (token) => {
      try {
        const logoUrl = await getTokenLogoUrl(token.token_address, token.token_symbol);
        token.logo_url = logoUrl;
        if (logoUrl) {
          console.log(`✅ Logo found for ${token.token_symbol}: ${logoUrl}`);
        }
      } catch (error) {
        console.log(`❌ Failed to get logo for ${token.token_symbol}:`, error);
      }
    }));

    // Filter out known scam/fake tokens using targeted approach
    const isLikelyScamToken = (token: TokenBalance): boolean => {
      const value = token.value_usd || 0;
      const balance = parseFloat(token.balance) || 0;
      const nameToCheck = (token.token_name || '').toLowerCase();
      const symbolToCheck = (token.token_symbol || '').toLowerCase();
      const contractAddress = (token.token_address || '').toLowerCase();
      
      // Known scam token contracts, names, and symbols to blacklist
      const knownScamTokens = {
        // Contract addresses of known scam tokens
        contracts: [
          '0xc44a4f600f434c887be43449c8084ea0a08517b9', // PHY - Phylactery
          '0xe9d43de0898df63ba125384240699f7e4bae61d9', // DRINK - Jelly Drink
          '0xad20b837d28eff66af55ef0962c6bdb7c7888cb8', // HBK - Hoe Benk
          '0xe3c84123d49cbfdfdfc94b9254525832eaca11f7', // Fake AERO with "visit" in symbol
          '0xc7507de6824cdd759da0d08c0ddcc1a50bd0f26d', // FLIP - !!🏆👉flip gg👈
        ],
        // Token names and symbols
        names: ['phylactery', 'jelly drink', 'hoe benk', 'cappa juice', '!!🏆👉flip gg👈'],
        symbols: ['phy', 'drink', 'hbk', 'juice', 'flip'],
        // Suspicious keywords in names/symbols
        suspiciousKeywords: [
          'visit', 'swap', 'claim', 'airdrop', 'free', 'bonus',
          'winner', 'reward', 'gift', 'promo', '.com', '.xyz', '.to'
        ]
      };

      // DeFi staking/wrapped tokens to filter out
      const defiStakingTokens = {
        contracts: [
          '0xa0e430870c4604ccfc7b38ca7845b1ff653d0ff1', // mwETH - Moonwell Flagship ETH
          '0xc1256ae5ff1cf2719d4937adb3bbccab2e00a2ca', // mwUSDC - Moonwell Flagship USDC
        ],
        symbols: ['mweth', 'mwusdc'],
        nameKeywords: ['moonwell flagship', 'staked', 'wrapped', 'yield', 'vault']
      };
      
      // Check scam token contract addresses
      if (knownScamTokens.contracts.includes(contractAddress)) {
        console.log(`Filtering known scam contract: ${token.token_name} (${token.token_symbol}) - ${contractAddress}`);
        return true;
      }
      
      // Check DeFi staking token contract addresses
      if (defiStakingTokens.contracts.includes(contractAddress)) {
        console.log(`Filtering DeFi staking token: ${token.token_name} (${token.token_symbol}) - ${contractAddress}`);
        return true;
      }
      
      // Check exact name/symbol matches for scam tokens
      if (knownScamTokens.names.some(scam => nameToCheck === scam) ||
          knownScamTokens.symbols.some(scam => symbolToCheck === scam)) {
        console.log(`Filtering known scam token: ${token.token_name} (${token.token_symbol})`);
        return true;
      }
      
      // Check DeFi staking token symbols
      if (defiStakingTokens.symbols.some(symbol => symbolToCheck === symbol)) {
        console.log(`Filtering DeFi staking token by symbol: ${token.token_name} (${token.token_symbol})`);
        return true;
      }
      
      // Check DeFi staking token name keywords
      if (defiStakingTokens.nameKeywords.some(keyword => nameToCheck.includes(keyword))) {
        console.log(`Filtering DeFi staking token by name keyword: ${token.token_name} (${token.token_symbol})`);
        return true;
      }
      
      // Check for suspicious keywords in names/symbols
      if (knownScamTokens.suspiciousKeywords.some(keyword => 
        nameToCheck.includes(keyword) || symbolToCheck.includes(keyword)
      )) {
        console.log(`Filtering suspicious keyword token: ${token.token_name} (${token.token_symbol})`);
        return true;
      }
      
      // Filter extremely suspicious scenarios only
      // 1. Tokens with impossibly high total values from tiny holdings
      if (value > 10000000 && balance < 100) { // $10M+ from less than 100 tokens
        console.log(`Filtering impossibly valued token: ${token.token_name} (${token.token_symbol}) - $${value.toLocaleString()} from ${balance} tokens`);
        return true;
      }
      
      // 2. Tokens with per-token value over $1M (even BTC is ~$100K)
      const pricePerToken = balance > 0 ? value / balance : 0;
      if (pricePerToken > 1000000) {
        console.log(`Filtering extremely overvalued token: ${token.token_name} (${token.token_symbol}) - $${pricePerToken.toLocaleString()} per token`);
        return true;
      }
      
      return false;
    };

    // Log all tokens before filtering to debug mintedmerch issue
    console.log('🔍 All tokens before filtering:');
    aggregatedTokens.forEach((token, index) => {
      if (token.token_symbol?.toLowerCase().includes('minted') || 
          token.token_name?.toLowerCase().includes('minted') ||
          token.token_address?.toLowerCase() === '0x774eaefe73df7959496ac92a77279a8d7d690b07') {
        console.log(`🎯 FOUND MINTEDMERCH TOKEN: ${token.token_name} (${token.token_symbol}) - Address: ${token.token_address}, Balance: ${token.balance}, USD Value: ${token.value_usd}`);
      }
    });

    // Filter out scam tokens and sort by USD value (descending) and take top 20
    const tokensWithValue = aggregatedTokens
      .filter((token: TokenBalance) => {
        const hasValue = token.value_usd && token.value_usd > 0;
        const isMintedMerch = token.token_address?.toLowerCase() === '0x774eaefe73df7959496ac92a77279a8d7d690b07';
        
        // Always include mintedmerch token even without USD pricing
        if (isMintedMerch) {
          console.log(`🎯 KEEPING MINTEDMERCH TOKEN: ${token.token_name} (${token.token_symbol}) - Balance: ${token.balance}, USD Value: ${token.value_usd}`);
          // Calculate USD value manually if missing
          if (!token.value_usd && token.balance) {
            const balance = parseFloat(token.balance);
            const pricePerToken = 0.000004235; // From DexScreener
            token.value_usd = balance * pricePerToken;
            console.log(`💰 Calculated USD value for mintedmerch: $${token.value_usd.toFixed(2)}`);
          }
          return true;
        }
        
        if (!hasValue && (token.token_symbol?.toLowerCase().includes('minted') || 
                         token.token_name?.toLowerCase().includes('minted'))) {
          console.log(`❌ OTHER MINTED TOKEN FILTERED OUT - No USD value: ${token.token_name} (${token.token_symbol}) - USD Value: ${token.value_usd}`);
        }
        return hasValue;
      });
    
    const filteredTokens = tokensWithValue
      .filter((token: TokenBalance) => !isLikelyScamToken(token)); // Remove scam tokens
    
    console.log(`After scam filtering: ${filteredTokens.length} legitimate tokens remaining for FID ${fid}`);
    
    const sortedTokens = filteredTokens
      .sort((a: TokenBalance, b: TokenBalance) => (b.value_usd || 0) - (a.value_usd || 0))
      .slice(0, 20); // Top 20 to include more tokens like $mintedmerch

    // Calculate total USD value
    const totalValueUsd = sortedTokens.reduce((sum: number, token: TokenBalance) => sum + (token.value_usd || 0), 0);

    console.log(`Returning ${sortedTokens.length} top tokens for FID ${fid}, total value: $${totalValueUsd.toFixed(2)}`);

    return {
      fid,
      tokens: sortedTokens,
      total_value_usd: totalValueUsd
    };

  } catch (error) {
    console.error(`Error fetching token balances for FID ${fid}:`, error);
    
    // Return empty result with error for graceful degradation
    return {
      fid,
      tokens: [],
      total_value_usd: 0,
      error: error instanceof Error ? error.message : 'Failed to fetch token balances'
    };
  }
}

 