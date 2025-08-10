'use client';

import { useState } from 'react';
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

export default function TipDev() {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const { isConnected } = useAccount();
  const { writeContract } = useWriteContract();

  // Don't render if tip address is not configured
  if (!TIP_ADDRESS || TIP_ADDRESS === '0x0000000000000000000000000000000000000000') {
    return null;
  }

  const handleTip = async () => {
    if (!isConnected) {
      alert('Please connect your wallet through Farcaster first.');
      return;
    }

    try {
      setIsLoading(true);
      
      // Send 1 USDC (6 decimals)
      const amount = parseUnits('1', 6);
      
      await writeContract({
        address: USDC_CONTRACT_ADDRESS as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [TIP_ADDRESS as `0x${string}`, amount],
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error('Tip transaction failed:', error);
      alert('Transaction failed. Please make sure you have enough USDC and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleTip}
        disabled={isLoading}
        className="px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 
                   flex items-center gap-1.5 min-h-[32px]
                   bg-gradient-to-r from-green-500 to-emerald-600 text-white
                   hover:from-green-600 hover:to-emerald-700
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transform hover:scale-105 active:scale-95"
      >
        {isLoading ? (
          <>
            <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Sending...</span>
          </>
        ) : (
          <>
            <span className="text-sm">💚</span>
            <span>Tip 1 USDC</span>
          </>
        )}
      </button>
      
      {showSuccess && (
        <div className="text-xs text-green-600 dark:text-green-400 font-medium animate-fade-in">
          Thank you! 🙏
        </div>
      )}
    </div>
  );
}
