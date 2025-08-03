import { NextRequest, NextResponse } from 'next/server';
import { fetchUserTokenBalances } from '@/lib/neynar';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fidParam = searchParams.get('fid');
    const bankrAddressesParam = searchParams.get('bankrAddresses');

    if (!fidParam) {
      return NextResponse.json(
        { error: 'FID parameter is required' },
        { status: 400 }
      );
    }

    const fid = parseInt(fidParam, 10);
    if (isNaN(fid)) {
      return NextResponse.json(
        { error: 'FID must be a valid number' },
        { status: 400 }
      );
    }

    // Parse Bankr addresses if provided (comma-separated)
    const bankrAddresses: string[] = bankrAddressesParam 
      ? bankrAddressesParam.split(',').map(addr => addr.trim()).filter(addr => addr.length > 0)
      : [];

    console.log(`Balance API: Fetching token balances for FID ${fid}`);
    if (bankrAddresses.length > 0) {
      console.log(`Balance API: Including ${bankrAddresses.length} Bankr addresses: ${bankrAddresses.join(', ')}`);
    }
    
    const balanceResult = await fetchUserTokenBalances(fid, bankrAddresses);
    
    console.log(`Balance API: Returning ${balanceResult.tokens.length} tokens for FID ${fid}`);
    
    return NextResponse.json(balanceResult);

  } catch (error) {
    console.error('Balance API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch token balances',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}