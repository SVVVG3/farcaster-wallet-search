interface BankrResponse {
  username: string;
  platform: string;
  accountId: string;
  evmAddress: string;
  solanaAddress: string;
  bankrClub: boolean;
}

export async function getBankrWalletData(
  username: string,
  platform: 'twitter' | 'farcaster'
): Promise<BankrResponse | null> {
  try {
    const response = await fetch(
      `https://api-staging.bankr.bot/public/wallet?username=${encodeURIComponent(username)}&platform=${platform}`
    );

    if (!response.ok) {
      if (response.status === 404) {
        return null; // User not found, which is expected for many users
      }
      throw new Error(`Bankr API error: ${response.status}`);
    }

    const data: BankrResponse = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Bankr wallet data:', error);
    return null;
  }
}

export async function getBankrDataForFarcasterUser(username: string): Promise<BankrResponse | null> {
  return getBankrWalletData(username, 'farcaster');
} 