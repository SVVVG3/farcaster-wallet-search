import { NextRequest, NextResponse } from 'next/server';
import { 
  searchUsersByAddresses, 
  searchUsersByUsernames, 
  searchUsersByFIDs, 
  searchUsersByXUsernames, 
  FarcasterUser 
} from '@/lib/neynar';
import { validateAddressOrUsername } from '@/lib/validation';
import { getBankrWalletData } from '@/lib/bankr';

export async function POST(request: NextRequest) {
  try {
    const { inputs } = await request.json();

    // Validate that inputs are provided
    if (!inputs || !Array.isArray(inputs) || inputs.length === 0) {
      return NextResponse.json(
        { error: 'Please provide an array of wallet addresses, usernames, FIDs, or X usernames' },
        { status: 400 }
      );
    }

    // Validate and categorize each input
    const validationResults = inputs.map(input => ({
      input: input,
      ...validateAddressOrUsername(input)
    }));

    // Check if any inputs are invalid
    const invalidInputs = validationResults.filter(result => !result.isValid);
    if (invalidInputs.length > 0) {
      return NextResponse.json(
        { 
          error: 'Invalid inputs provided',
          invalidInputs: invalidInputs.map(result => ({
            input: result.input,
            error: result.error
          }))
        },
        { status: 400 }
      );
    }

    // Separate inputs by type
    const addresses = validationResults
      .filter(result => result.type === 'ethereum' || result.type === 'solana')
      .map(result => result.input);
    
    const usernames = validationResults
      .filter(result => result.type === 'farcaster')
      .map(result => result.input);

    const fids = validationResults
      .filter(result => result.type === 'fid')
      .map(result => result.input);

    const xUsernames = validationResults
      .filter(result => result.type === 'x_username')
      .map(result => result.input);

    const ambiguousUsernames = validationResults
      .filter(result => result.type === 'username')
      .map(result => result.input);

    // Combine results from all search types
    const allUsers: FarcasterUser[] = [];
    const allSearchedInputs: string[] = [];
    const allNotFoundInputs: string[] = [];

    // Search by addresses if any provided
    if (addresses.length > 0) {
      console.log('Searching by addresses:', addresses);
      const addressResults = await searchUsersByAddresses(addresses);
      
      allUsers.push(...addressResults.users);
      allSearchedInputs.push(...addressResults.searchedInputs);
      allNotFoundInputs.push(...addressResults.notFoundInputs);
    }

    // Search by usernames if any provided
    if (usernames.length > 0) {
      console.log('Searching by usernames:', usernames);
      const usernameResults = await searchUsersByUsernames(usernames);
      
      allUsers.push(...usernameResults.users);
      allSearchedInputs.push(...usernameResults.searchedUsernames);
      allNotFoundInputs.push(...usernameResults.notFoundUsernames);
    }

    // Search by FIDs if any provided
    if (fids.length > 0) {
      console.log('Searching by FIDs:', fids);
      const fidResults = await searchUsersByFIDs(fids);
      
      allUsers.push(...fidResults.users);
      allSearchedInputs.push(...fidResults.searchedFIDs);
      allNotFoundInputs.push(...fidResults.notFoundFIDs);
    }

    // Search by X usernames if any provided
    if (xUsernames.length > 0) {
      console.log('Searching by X usernames:', xUsernames);
      const xUsernameResults = await searchUsersByXUsernames(xUsernames);
      
      allUsers.push(...xUsernameResults.users);
      allSearchedInputs.push(...xUsernameResults.searchedXUsernames);
      allNotFoundInputs.push(...xUsernameResults.notFoundXUsernames);
    }

    // Search ambiguous usernames (try Farcaster first, then X username for any not found)
    if (ambiguousUsernames.length > 0) {
      console.log('Searching ambiguous usernames:', ambiguousUsernames);
      
      // First try as Farcaster usernames
      const farcasterResults = await searchUsersByUsernames(ambiguousUsernames);
      allUsers.push(...farcasterResults.users);
      allSearchedInputs.push(...farcasterResults.searchedUsernames);
      
      // For usernames not found as Farcaster usernames, try as X usernames
      const notFoundAsFarcaster = farcasterResults.notFoundUsernames;
      if (notFoundAsFarcaster.length > 0) {
        console.log('Trying not-found usernames as X usernames:', notFoundAsFarcaster);
        const xResults = await searchUsersByXUsernames(notFoundAsFarcaster);
        allUsers.push(...xResults.users);
        allSearchedInputs.push(...xResults.searchedXUsernames);
        
        // Only mark as not found if not found in both searches
        allNotFoundInputs.push(...xResults.notFoundXUsernames);
      }
    }

    // Remove duplicates based on FID (Farcaster ID)
    const uniqueUsers = allUsers.filter((user, index, self) => 
      index === self.findIndex(u => u.fid === user.fid)
    );

    // Enhance results with Bankr wallet data
    const enhancedUsers = await Promise.all(
      uniqueUsers.map(async (user: FarcasterUser) => {
        // Skip users without valid username
        if (!user.username) {
          console.log('Skipping user without username:', user);
          return user;
        }
        
        // Get Bankr wallet data for both Farcaster and Twitter if available
        console.log(`Fetching Bankr data for Farcaster username: ${user.username}`);
        const farcasterBankrData = await getBankrWalletData(user.username, 'farcaster');
        
        // Check if user has a connected Twitter account
        const twitterAccount = user.verified_accounts?.find((account) => 
          account.platform === 'twitter' || account.platform === 'x'
        );
        
        let twitterBankrData = null;
        if (twitterAccount?.username) {
          console.log(`Fetching Bankr data for Twitter username: ${twitterAccount.username}`);
          twitterBankrData = await getBankrWalletData(twitterAccount.username, 'twitter');
        }
        
        // Log results
        if (farcasterBankrData) {
          console.log(`Found Farcaster Bankr data for ${user.username}:`, farcasterBankrData);
        } else {
          console.log(`No Farcaster Bankr data found for ${user.username}`);
        }
        
        if (twitterBankrData) {
          console.log(`Found Twitter Bankr data for ${twitterAccount?.username}:`, twitterBankrData);
        } else if (twitterAccount?.username) {
          console.log(`No Twitter Bankr data found for ${twitterAccount.username}`);
        }
        
        return {
          ...user,
          bankrData: {
            farcaster: farcasterBankrData,
            twitter: twitterBankrData
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      results: {
        users: enhancedUsers,
        searchedInputs: allSearchedInputs,
        notFoundInputs: allNotFoundInputs
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to search for users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: 'Farcaster Wallet Search API',
    usage: 'POST with { "inputs": ["0x...", "username", "123", "twitteruser"] }',
    supportedInputs: [
      'Ethereum addresses (0x...)', 
      'Solana addresses (base58)', 
      'Farcaster usernames',
      'Farcaster IDs (FIDs)',
      'X (Twitter) usernames'
    ]
  });
} 