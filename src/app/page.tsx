'use client';

import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import Image from 'next/image';
import AddressInput from '@/components/AddressInput';
import ProfileDisplay from '@/components/ProfileDisplay';
import TipDev from '@/components/TipDev';
import { SearchResult } from '@/lib/neynar';

export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showTipGif, setShowTipGif] = useState(false);

  // Initialize Farcaster Mini App SDK
  useEffect(() => {
    const initializeMiniApp = async () => {
      try {
        // Call ready to hide the splash screen once app is loaded
        await sdk.actions.ready();
        console.log('Farcaster Mini App SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize Farcaster Mini App SDK:', error);
        // If SDK fails, app should still work for web users
      }
    };
    
    // Aggressive zoom prevention for mobile
    const preventZoom = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    const preventWheelZoom = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    
    const preventKeyboardZoom = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '-' || e.key === '0')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const preventGestureZoom = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
    };
    
    // Add event listeners for all zoom prevention
    document.addEventListener('touchstart', preventZoom, { passive: false });
    document.addEventListener('touchmove', preventZoom, { passive: false });
    document.addEventListener('wheel', preventWheelZoom, { passive: false });
    document.addEventListener('keydown', preventKeyboardZoom, { passive: false });
    document.addEventListener('gesturestart', preventGestureZoom, { passive: false });
    document.addEventListener('gesturechange', preventGestureZoom, { passive: false });
    document.addEventListener('gestureend', preventGestureZoom, { passive: false });
    
    initializeMiniApp();
    
    // Cleanup
    return () => {
      document.removeEventListener('touchstart', preventZoom);
      document.removeEventListener('touchmove', preventZoom);
      document.removeEventListener('wheel', preventWheelZoom);
      document.removeEventListener('keydown', preventKeyboardZoom);
      document.removeEventListener('gesturestart', preventGestureZoom);
      document.removeEventListener('gesturechange', preventGestureZoom);
      document.removeEventListener('gestureend', preventGestureZoom);
    };
  }, []);

  const handleSearch = async (inputs: string[]) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await response.json();
      setSearchResults(data.results);
      
      // Scroll to top after search results are loaded
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const triggerHaptic = async () => {
    try {
      const context = await sdk.context;
      if (context && context.client && typeof context.client.clientFid === 'number') {
        await sdk.haptics.impactOccurred('light');
      }
    } catch {
      // Haptics not supported or failed, continue silently
    }
  };

  const handleNewSearch = async () => {
    try {
      await triggerHaptic();
    } catch {
      // Haptics failed, continue with action
    }
    setSearchResults(null);
    setError(null);
  };

  const handleExternalLink = async (url: string) => {
    try {
      await sdk.actions.openUrl(url);
    } catch (error) {
      console.error('Failed to open external URL:', error);
      // Fallback to window.open if SDK fails
      window.open(url, '_blank');
    }
  };

  const handleFarcasterProfile = async () => {
    try {
      // Try to open in Farcaster app first
      await sdk.actions.openUrl('https://farcaster.xyz/svvvg3.eth');
    } catch (error) {
      console.error('Failed to open Farcaster profile:', error);
      // Fallback to external link
      window.open('https://farcaster.xyz/svvvg3.eth', '_blank');
    }
  };

  const handleMyWallets = async () => {
    try {
      await triggerHaptic();
      setIsLoading(true);
      setError(null);

      // Get the connected user's FID from Farcaster context
      const context = await sdk.context;
      console.log('Full SDK context:', context);
      
      if (!context) {
        throw new Error('Unable to get Farcaster context. Please make sure you\'re using this in the Farcaster app.');
      }

      // Try different ways to access the user FID
      let userFid: number | null = null;
      
      // Method 1: context.user.fid (CORRECT - this is the actual user's FID)
      if (context.user && typeof context.user.fid === 'number') {
        userFid = context.user.fid;
        console.log('Found FID via context.user.fid:', userFid);
      }
      // Method 2: context.client.clientFid (fallback - this might be the client app's FID)
      else if (context.client && typeof context.client.clientFid === 'number') {
        userFid = context.client.clientFid;
        console.log('Found FID via context.client.clientFid:', userFid);
      }
      // Method 3: Check if context has fid property (with type safety)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      else if ('fid' in context && typeof (context as any).fid === 'number') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        userFid = (context as any).fid;
        console.log('Found FID via context.fid:', userFid);
      }

      if (!userFid) {
        console.error('Could not find FID in context. Available properties:', Object.keys(context));
        if (context.client) {
          console.error('Client properties:', Object.keys(context.client));
        }
        throw new Error('Unable to get your Farcaster FID. Please make sure you\'re logged into the Farcaster app.');
      }

      console.log('Using FID for search:', userFid);

      // Search for the user's profile using their FID
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: [userFid.toString()] }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch your profile');
      }

      const data = await response.json();
      setSearchResults(data.results);
      
      // Scroll to top after search results are loaded
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('My Wallets error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load your wallets');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTipSuccess = () => {
    // Add small delay to prevent state conflicts
    setTimeout(() => {
      setShowTipGif(true);
    }, 100);
  };

  const handleCloseTipGif = () => {
    setShowTipGif(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 backdrop-blur-sm bg-opacity-95 dark:bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 md:py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="w-20 h-20 flex items-center justify-center">
                <Image
                  src="/WalletSearchLogo.png"
                  alt="Wallet Search"
                  width={80}
                  height={80}
                  className="rounded-lg"
                />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white truncate">
                  Wallet Search
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-xs md:text-sm mb-2">
                  Find Farcaster profiles & all linked wallets!
                </p>
                {/* Tip Dev Section in Header */}
                <div className="flex justify-center">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Enjoying Wallet Search?
                    </span>
                    <TipDev onTransactionSuccess={handleTipSuccess} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {!searchResults ? (
          /* Search Interface */
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3 md:mb-4">
                Search Farcaster Profiles
              </h2>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 md:p-8">
              <AddressInput
                onAddressSubmit={handleSearch}
                isLoading={isLoading}
                disabled={isLoading}
              />
              
              {/* My Wallets Button */}
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleMyWallets}
                  disabled={isLoading}
                  className="w-full px-4 py-3 text-white rounded-lg transition-all duration-200 text-sm font-medium
                           flex items-center justify-center space-x-2 min-h-[48px]
                           disabled:opacity-50 disabled:cursor-not-allowed
                           hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                  style={{ backgroundColor: '#7c65c1' }}
                  onMouseEnter={(e) => !isLoading && (e.currentTarget.style.backgroundColor = '#6b5bb3')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#7c65c1')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img 
                    src="/farcaster-arch-icon.png" 
                    alt="Farcaster" 
                    className="w-4 h-4"
                  />
                  <span>{isLoading ? 'Loading...' : 'My Wallets'}</span>
                </button>
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                  View all wallets and your top token holdings
                </p>
              </div>
            </div>

            {error && (
              <div className="mt-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 
                            rounded-lg p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <span className="text-red-500 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Search Error
                    </h3>
                    <p className="mt-1 text-sm text-red-700 dark:text-red-300">
                      {error}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Features */}
            <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                <div className="flex items-center space-x-3 mb-3 md:mb-4">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 dark:text-green-400 text-2xl">⚡</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Comprehensive Data
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Get complete profile information, all verified addresses (including Bankr), top holdings across all Farcaster connected wallets, and more!
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                <div className="flex items-center space-x-3 mb-3 md:mb-4">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 dark:text-purple-400 text-2xl">🌐</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Flexible Search
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Search by Ethereum (0x...) & Solana addresses, Farcaster & X usernames, and FIDs to find the connected Farcaster profile & wallet info.
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
                <div className="flex items-center space-x-3 mb-3 md:mb-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 text-2xl">🔍</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Multi-Input Search
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Search multiple wallet addresses and usernames at once to find all linked Farcaster profiles efficiently.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Results */
          <ProfileDisplay
            users={searchResults.users}
            searchedInputs={searchResults.searchedInputs}
            notFoundInputs={searchResults.notFoundInputs}
            onNewSearch={handleNewSearch}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-600 dark:text-gray-400">
            <p>
              Powered by{' '}
              <button
                onClick={() => handleExternalLink('https://neynar.com/')}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent p-0 font-inherit"
              >
                Neynar
              </button>
              {' '}&{' '}
              <button
                onClick={() => handleExternalLink('https://bankr.bot/api')}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent p-0 font-inherit"
              >
                Bankr API
              </button>
              {' '}• Vibe Coded w/ love by{' '}
              <button
                onClick={handleFarcasterProfile}
                className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer border-none bg-transparent p-0 font-inherit"
              >
                SVVVG3
              </button>
              {' '}for the Farcaster community 💜
            </p>
          </div>
        </div>
      </footer>

      {/* Tip Success GIF Modal */}
      {showTipGif && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-auto"
          onClick={handleCloseTipGif}
        >
          <div className="min-h-full flex items-center justify-center p-4">
            <div 
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl relative mx-auto my-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src="/ChimpThankYou.GIF" 
                  alt="Thank You!" 
                  className="w-48 h-48 mx-auto rounded-lg"
                  style={{ objectFit: 'cover' }}
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Thank You! 🙏
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your tip helps keep Wallet Search running!
              </p>
              <button
                onClick={handleCloseTipGif}
                className="mt-4 px-4 py-2 text-xs font-medium rounded transition-all duration-200 
                           text-white"
                style={{ backgroundColor: '#08c0b7' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#06a8a0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#08c0b7')}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
