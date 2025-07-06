'use client';

import Image from 'next/image';
import { useState } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { FarcasterUser } from '@/lib/neynar';
import { getExplorerUrl } from '@/lib/validation';

interface ProfileDisplayProps {
  users: FarcasterUser[];
  searchedAddresses: string[];
  notFoundAddresses: string[];
}



function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}

function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function UserProfile({ user, copiedAddress, copyToClipboard }: { 
  user: FarcasterUser; 
  copiedAddress: string | null;
  copyToClipboard: (text: string) => void;
}) {
  // Check if we're in a mini app environment using SDK context
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
        console.log('📳 Triggering Farcaster haptic feedback');
        await sdk.haptics.impactOccurred('medium');
      } else {
        console.log('❌ Not in mini app or haptics not available');
      }
    } catch (error) {
      console.error('❌ Haptic feedback failed:', error);
    }
  };

  const handleExternalLink = async (url: string) => {
    console.log('🔗 Opening external link:', url);
    await triggerHaptic();
    
    // Only use SDK if we're in mini app environment
    if (await isInMiniApp()) {
      try {
        if (sdk && sdk.actions && sdk.actions.openUrl) {
          console.log('✅ Using SDK to open URL');
          await sdk.actions.openUrl(url);
          return;
        }
      } catch (error) {
        console.error('❌ Failed to open external URL with SDK:', error);
      }
    }
    
    // Fallback to window.open for desktop browsers
    console.log('🌐 Using window.open fallback');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const openExplorerExternal = (address: string) => {
    const { url } = getExplorerUrl(address);
    if (url) {
      handleExternalLink(url);
    }
  };

  const scrollToBankrAddresses = () => {
    triggerHaptic();
    // Scroll to the very bottom of the page
    window.scrollTo({ 
      top: document.documentElement.scrollHeight, 
      behavior: 'smooth' 
    });
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-6 space-y-4">
      {/* Header with avatar and basic info */}
      <div className="flex items-start space-x-4">
        <div className="relative">
          <Image
            src={user.pfp_url || '/default-avatar.png'}
            alt={`${user.display_name || user.username}'s avatar`}
            width={80}
            height={80}
            className="rounded-full ring-2 ring-gray-200 dark:ring-gray-600"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/default-avatar.png';
            }}
          />
          {user.pro?.status === 'subscribed' && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5">
              <Image
                src="/FarcasterProBadge.png?v=20250103"
                alt="Farcaster Pro"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 flex-wrap">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white truncate">
              {user.display_name || user.username}
            </h3>
          </div>
          
          <p className="text-gray-600 dark:text-gray-400 font-mono text-sm">
            @{user.username}
          </p>
          
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            FID: {user.fid}
          </p>
          
          {/* Follower stats */}
          <div className="flex items-center space-x-4 mt-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatNumber(user.follower_count)}
              </span> followers
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatNumber(user.following_count)}
              </span> following
            </span>
            {user.score && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Neynar Score: <span className="font-semibold text-gray-900 dark:text-white">
                  {user.score.toFixed(2)}
                </span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Bio */}
      {user.profile?.bio?.text && (
        <div className="space-y-2 border-t border-gray-200 dark:border-gray-600 pt-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</h4>
            <div className="flex flex-wrap gap-2">
              {user.pro?.status === 'subscribed' && (
                <span className="px-3 py-0.5 text-gray-900 dark:text-white text-xs font-bold rounded-full flex items-center space-x-1.5 bg-gray-100 dark:bg-gray-700">
                  <Image
                    src="/FarcasterProBadge.png?v=20250103"
                    alt="Farcaster Pro"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                  />
                  <span>Farcaster Pro</span>
                </span>
              )}
              {(user.bankrData?.farcaster?.bankrClub || user.bankrData?.twitter?.bankrClub) && (
                <button
                  onClick={scrollToBankrAddresses}
                  className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white 
                           text-xs font-bold rounded-full shadow-lg flex items-center space-x-1 
                           hover:from-yellow-500 hover:to-orange-600 transition-all duration-200 
                           cursor-pointer"
                >
                  <Image
                    src="/BankrLogo.png"
                    alt="Bankr"
                    width={16}
                    height={13}
                    className="w-4 h-3"
                  />
                  <span>BANKR CLUB</span>
                </button>
              )}
            </div>
          </div>
          <p className="text-gray-900 dark:text-white text-sm leading-relaxed">
            {user.profile.bio.text}
          </p>
        </div>
      )}

      {/* Connected Accounts */}
      {user.verified_accounts && user.verified_accounts.length > 0 && (
        <div className="space-y-2 border-t border-gray-200 dark:border-gray-600 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Connected Accounts</h4>
          <div className="space-y-1">
            {user.verified_accounts.map((account, index) => {
              const isXAccount = account.platform.toLowerCase() === 'x';
              const profileUrl = isXAccount ? `https://x.com/${account.username}` : null;
              
              return (
                <div key={index} className="flex items-center space-x-2 bg-gray-50 dark:bg-gray-700 
                                           rounded-lg px-3 py-2">
                  <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 
                                 text-xs font-medium rounded capitalize">
                    {account.platform}
                  </span>
                  {isXAccount && profileUrl ? (
                    <button
                      onClick={() => handleExternalLink(profileUrl)}
                      className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                               transition-colors cursor-pointer hover:underline"
                    >
                      @{account.username}
                    </button>
                  ) : (
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      @{account.username}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verified Addresses */}
      {(user.verified_addresses?.eth_addresses?.length > 0 || user.verified_addresses?.sol_addresses?.length > 0) && (
        <div className="space-y-2 border-t border-gray-200 dark:border-gray-600 pt-4" data-section="verified-addresses">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Verified Addresses</h4>
          <div className="space-y-1">
            {user.verified_addresses.eth_addresses?.map((address, index) => (
              <div key={`eth-${index}`} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 
                                                   rounded-lg px-3 py-3 md:py-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 
                                 text-xs font-medium rounded">
                    ETH
                  </span>
                  <button
                    onClick={() => openExplorerExternal(address)}
                    className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                             transition-colors cursor-pointer hover:underline truncate"
                    title="View on BaseScan"
                  >
                    {truncateAddress(address)}
                  </button>
                  {user.verified_addresses.primary?.eth_address === address && (
                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 
                                   text-xs font-medium rounded">
                      Primary
                    </span>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(address)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors 
                           min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md ml-2
                           hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500"
                  title="Copy address"
                >
                  <span className="text-lg">
                    {copiedAddress === address ? '✅' : '📋'}
                  </span>
                </button>
              </div>
            ))}
            
            {user.verified_addresses.sol_addresses?.map((address, index) => (
              <div key={`sol-${index}`} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 
                                                   rounded-lg px-3 py-3 md:py-2">
                <div className="flex items-center space-x-2 flex-1 min-w-0">
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 
                                 text-xs font-medium rounded">
                    SOL
                  </span>
                  <button
                    onClick={() => openExplorerExternal(address)}
                    className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                             transition-colors cursor-pointer hover:underline truncate"
                    title="View on Solscan"
                  >
                    {truncateAddress(address)}
                  </button>
                  {user.verified_addresses.primary?.sol_address === address && (
                    <span className="px-1.5 py-0.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 
                                   text-xs font-medium rounded">
                      Primary
                    </span>
                  )}
                </div>
                <button
                  onClick={() => copyToClipboard(address)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors 
                           min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md ml-2
                           hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500"
                  title="Copy address"
                >
                  <span className="text-lg">
                    {copiedAddress === address ? '✅' : '📋'}
                  </span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custody Address */}
      {user.custody_address && (
        <div className="space-y-2 border-t border-gray-200 dark:border-gray-600 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Custody Address</h4>
          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg px-3 py-3 md:py-2">
            <div className="flex items-center space-x-2 flex-1 min-w-0">
              <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 
                             text-xs font-medium rounded">
                Custody
              </span>
              <button
                onClick={() => openExplorerExternal(user.custody_address)}
                className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                         transition-colors cursor-pointer hover:underline truncate"
                title="View on BaseScan"
              >
                {truncateAddress(user.custody_address)}
              </button>
            </div>
            <button
              onClick={() => copyToClipboard(user.custody_address)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors 
                       min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md ml-2
                       hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500"
              title="Copy address"
            >
              <span className="text-lg">
                {copiedAddress === user.custody_address ? '✅' : '📋'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Bankr Wallet Information */}
      {(user.bankrData?.farcaster || user.bankrData?.twitter) && (
        <div className="space-y-2 border-t border-gray-200 dark:border-gray-600 pt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
            <Image
              src="/BankrLogo.png"
              alt="Bankr"
              width={20}
              height={16}
              className="w-5 h-4"
            />
            <span>Bankr Wallets</span>
          </h4>
          
          {/* Farcaster Bankr Wallet */}
          {user.bankrData?.farcaster && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Farcaster Bankr</span>
                {user.bankrData.farcaster.bankrClub && (
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 
                                 text-xs font-medium rounded">
                    Club Member
                  </span>
                )}
              </div>
              
              {user.bankrData.farcaster.evmAddress && (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 
                               rounded-lg px-3 py-3 md:py-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 
                                   text-xs font-medium rounded">
                      FC ETH
                    </span>
                    <button
                      onClick={() => openExplorerExternal(user.bankrData?.farcaster?.evmAddress || '')}
                      className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                               transition-colors cursor-pointer hover:underline truncate"
                      title="View on BaseScan"
                    >
                      {truncateAddress(user.bankrData?.farcaster?.evmAddress || '')}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(user.bankrData?.farcaster?.evmAddress || '')}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors 
                             min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md ml-2
                             hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500"
                    title="Copy address"
                  >
                    <span className="text-lg">
                      {copiedAddress === (user.bankrData?.farcaster?.evmAddress || '') ? '✅' : '📋'}
                    </span>
                  </button>
                </div>
              )}
              
              {user.bankrData.farcaster.solanaAddress && (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 
                               rounded-lg px-3 py-3 md:py-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 
                                   text-xs font-medium rounded">
                      FC SOL
                    </span>
                    <button
                      onClick={() => openExplorerExternal(user.bankrData?.farcaster?.solanaAddress || '')}
                      className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                               transition-colors cursor-pointer hover:underline truncate"
                      title="View on Solscan"
                    >
                      {truncateAddress(user.bankrData?.farcaster?.solanaAddress || '')}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(user.bankrData?.farcaster?.solanaAddress || '')}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors 
                             min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md ml-2
                             hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500"
                    title="Copy address"
                  >
                    <span className="text-lg">
                      {copiedAddress === (user.bankrData?.farcaster?.solanaAddress || '') ? '✅' : '📋'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* X Bankr Wallet */}
          {user.bankrData?.twitter && (
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">X Bankr</span>
                {user.bankrData.twitter.bankrClub && (
                  <span className="px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 
                                 text-xs font-medium rounded">
                    Club Member
                  </span>
                )}
              </div>
              
              {user.bankrData.twitter.evmAddress && (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 
                               rounded-lg px-3 py-3 md:py-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 
                                   text-xs font-medium rounded">
                      𝕏 ETH
                    </span>
                    <button
                      onClick={() => openExplorerExternal(user.bankrData?.twitter?.evmAddress || '')}
                      className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                               transition-colors cursor-pointer hover:underline truncate"
                      title="View on BaseScan"
                    >
                      {truncateAddress(user.bankrData?.twitter?.evmAddress || '')}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(user.bankrData?.twitter?.evmAddress || '')}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors 
                             min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md ml-2
                             hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500"
                    title="Copy address"
                  >
                    <span className="text-lg">
                      {copiedAddress === (user.bankrData?.twitter?.evmAddress || '') ? '✅' : '📋'}
                    </span>
                  </button>
                </div>
              )}
              
              {user.bankrData.twitter.solanaAddress && (
                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 
                               rounded-lg px-3 py-3 md:py-2">
                  <div className="flex items-center space-x-2 flex-1 min-w-0">
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 
                                   text-xs font-medium rounded">
                      𝕏 SOL
                    </span>
                    <button
                      onClick={() => openExplorerExternal(user.bankrData?.twitter?.solanaAddress || '')}
                      className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 
                               transition-colors cursor-pointer hover:underline truncate"
                      title="View on Solscan"
                    >
                      {truncateAddress(user.bankrData?.twitter?.solanaAddress || '')}
                    </button>
                  </div>
                  <button
                    onClick={() => copyToClipboard(user.bankrData?.twitter?.solanaAddress || '')}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors 
                             min-w-[44px] min-h-[44px] flex items-center justify-center rounded-md ml-2
                             hover:bg-gray-100 dark:hover:bg-gray-600 active:bg-gray-200 dark:active:bg-gray-500"
                    title="Copy address"
                  >
                    <span className="text-lg">
                      {copiedAddress === (user.bankrData?.twitter?.solanaAddress || '') ? '✅' : '📋'}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfileDisplay({ users, notFoundAddresses }: ProfileDisplayProps) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Check if we're in a mini app environment using SDK context
  const isInMiniApp = async () => {
    try {
      if (!sdk || !sdk.context) return false;
      const context = await sdk.context;
      return context && context.client && typeof context.client.clientFid === 'number';
    } catch {
      return false;
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      console.log('📋 Copied to clipboard:', text);
      
      // Add haptic feedback using proper Farcaster SDK
      try {
        if ((await isInMiniApp()) && sdk && sdk.haptics) {
          console.log('📳 Triggering Farcaster haptic feedback for copy');
          await sdk.haptics.impactOccurred('light');
        } else {
          console.log('❌ Not in mini app or haptics not available for copy');
        }
      } catch (error) {
        console.error('❌ Haptic feedback failed for copy:', error);
      }
      
      // Show checkmark for this specific address (replaces any previous checkmark)
      setCopiedAddress(text);
      
      // Reset checkmark after 2 seconds
      setTimeout(() => {
        setCopiedAddress(prev => prev === text ? null : prev);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  if (users.length === 0 && notFoundAddresses.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Found profiles */}
      {users.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Found Profiles ({users.length})
          </h3>
          <div className="grid gap-6">
            {users.map((user, index) => (
              <UserProfile 
                key={`${user.fid}-${index}`} 
                user={user} 
                copiedAddress={copiedAddress}
                copyToClipboard={copyToClipboard}
              />
            ))}
          </div>
        </div>
      )}

      {/* Not found addresses */}
      {notFoundAddresses.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            No Profiles Found
          </h3>
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              The following addresses don&apos;t have linked Farcaster profiles:
            </p>
            <div className="space-y-2">
              {notFoundAddresses.map((notFoundItem, index) => (
                <div key={index} className="flex items-center justify-between bg-white dark:bg-gray-700 
                                           rounded-lg px-3 py-2 border border-gray-200 dark:border-gray-600">
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300">
                    {notFoundItem}
                  </span>
                  <button
                    onClick={() => copyToClipboard(notFoundItem)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    title="Copy address"
                  >
                    {copiedAddress === notFoundItem ? '✅' : '📋'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 