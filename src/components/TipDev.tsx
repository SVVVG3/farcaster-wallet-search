'use client';

import { useEffect } from 'react';
import { useAccount, useWriteContract } from 'wagmi';
import { parseUnits } from 'viem';
import { USDC_CONTRACT_ADDRESS, TIP_ADDRESS } from '@/lib/wagmi';

// ERC-20 transfer function ABI
const ERC20_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

interface TipDevProps {
  onTransactionSuccess?: () => void;
}

export default function TipDev({ onTransactionSuccess }: TipDevProps) {
  const { isConnected } = useAccount();
  const { writeContract, isPending, isSuccess } = useWriteContract();

  // Show GIF when transaction is successful
  useEffect(() => {
    if (isSuccess && onTransactionSuccess) {
      onTransactionSuccess();
    }
  }, [isSuccess, onTransactionSuccess]);

  // Don't render if tip address is not configured
  if (!TIP_ADDRESS || TIP_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  const handleTip = () => {
    if (!isConnected) {
      alert('Please connect your wallet through Farcaster first.');
      return;
    }

    // Send 1 USDC (6 decimals)
    const amount = parseUnits('1', 6);
    
    writeContract({
      address: USDC_CONTRACT_ADDRESS as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [TIP_ADDRESS as `0x${string}`, amount],
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleTip}
        disabled={isPending}
        className="px-2 py-1 text-xs font-medium rounded transition-all duration-200 
                   flex items-center gap-1 min-h-[24px]
                   bg-gradient-to-r from-cyan-500 to-teal-600 text-white
                   hover:from-cyan-600 hover:to-teal-700
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transform hover:scale-105 active:scale-95"
        style={{
          background: isPending 
            ? 'linear-gradient(to right, #06b6d4, #0891b2)' 
            : 'linear-gradient(to right, #08c0b7, #0891b2)'
        }}
        onMouseEnter={(e) => !isPending && (e.currentTarget.style.background = 'linear-gradient(to right, #06a8a0, #0e7490)')}
        onMouseLeave={(e) => !isPending && (e.currentTarget.style.background = 'linear-gradient(to right, #08c0b7, #0891b2)')}
      >
        {isPending ? (
          <>
            <div className="w-2.5 h-2.5 border border-white border-t-transparent rounded-full animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span className="text-xs">💚</span>
            <span>Tip 1 USDC</span>
          </>
        )}
      </button>
    </div>
  );
}
