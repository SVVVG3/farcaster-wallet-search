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
  score?: number;
  bankrData?: {
    farcaster: BankrData | null;
    twitter: BankrData | null;
  };
}

export interface SearchResult {
  users: FarcasterUser[];
  searchedAddresses: string[];
  notFoundAddresses: string[];
}

export interface UsernameSearchResult {
  users: FarcasterUser[];
  searchedUsernames: string[];
  notFoundUsernames: string[];
}

/**
 * Search for Farcaster users by wallet addresses (Ethereum or Solana)
 * @param addresses - Array of wallet addresses to search for
 * @returns Promise with search results
 */
export async function searchUsersByAddresses(addresses: string[]): Promise<SearchResult> {
  try {
    console.log('Searching for users with addresses:', addresses);
    
    // Use the Neynar SDK to fetch users by addresses
    const response = await client.fetchBulkUsersByEthOrSolAddress({
      addresses: addresses
    });

    console.log('API Response:', response);

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
      searchedAddresses: addresses,
      notFoundAddresses
    };
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
        console.log(`Searching for username: ${username}`);
        
        // Use the Neynar SDK to search for users by username
        const response = await client.searchUser({ q: username, limit: 10 });
        
        console.log(`Username search response for ${username}:`, response);

        // Find exact match or closest match
        const users = response.result?.users || [];
        const exactMatch = users.find(user => 
          user.username.toLowerCase() === username.toLowerCase()
        );

        if (exactMatch) {
          allUsers.push(exactMatch as FarcasterUser);
          foundUsernames.push(username);
        } else if (users.length > 0) {
          // If no exact match, take the first result (best match)
          allUsers.push(users[0] as FarcasterUser);
          foundUsernames.push(username);
        } else {
          notFoundUsernames.push(username);
        }
      } catch (error) {
        console.error(`Error searching for username ${username}:`, error);
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

 