/**
 * Client-safe validation utilities for wallet addresses
 * This file doesn't import any Node.js-specific libraries
 */

/**
 * Validate if a string is a valid Ethereum address
 * @param address - The address to validate
 * @returns boolean indicating if the address is valid
 */
export function isValidEthereumAddress(address: string): boolean {
  // Basic Ethereum address validation (0x followed by 40 hex characters)
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Validate if a string is a valid Solana address
 * @param address - The address to validate  
 * @returns boolean indicating if the address is valid
 */
export function isValidSolanaAddress(address: string): boolean {
  // Basic Solana address validation (base58 string, 32-44 characters)
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

/**
 * Validate if a string is a valid Farcaster username
 * @param username - The username to validate
 * @returns boolean indicating if the username is valid
 */
export function isValidFarcasterUsername(username: string): boolean {
  // Farcaster usernames: alphanumeric, hyphens, underscores, dots, 1-15 characters
  // Can end with .eth for ENS names
  return /^[a-zA-Z0-9._-]{1,15}(\.eth)?$/.test(username);
}

/**
 * Validate if a string is a valid Farcaster ID (FID)
 * @param fid - The FID to validate
 * @returns boolean indicating if the FID is valid
 */
export function isValidFID(fid: string): boolean {
  // FIDs are positive integers
  return /^\d+$/.test(fid) && parseInt(fid) > 0;
}

/**
 * Validate if a string is a valid X (Twitter) username
 * @param username - The X username to validate
 * @returns boolean indicating if the username is valid
 */
export function isValidXUsername(username: string): boolean {
  // X usernames: 1-15 characters, alphanumeric and underscores only
  // Can start with underscore, letter, or number
  return /^[a-zA-Z0-9_]{1,15}$/.test(username);
}

/**
 * Validate if a string is a valid wallet address (Ethereum or Solana)
 * @param address - The address to validate
 * @returns object with validation result and address type
 */
export function validateWalletAddress(address: string): { 
  isValid: boolean; 
  type: 'ethereum' | 'solana' | null; 
  error?: string 
} {
  if (!address || address.trim().length === 0) {
    return { isValid: false, type: null, error: 'Address is required' };
  }

  const trimmedAddress = address.trim();

  if (isValidEthereumAddress(trimmedAddress)) {
    return { isValid: true, type: 'ethereum' };
  }

  if (isValidSolanaAddress(trimmedAddress)) {
    return { isValid: true, type: 'solana' };
  }

  return { 
    isValid: false, 
    type: null, 
    error: 'Invalid address format. Must be a valid Ethereum (0x...) or Solana address.' 
  };
}

/**
 * Validate if a string is a valid username
 * @param username - The username to validate
 * @returns object with validation result and username type
 */
export function validateUsername(username: string): { 
  isValid: boolean; 
  type: 'farcaster' | null; 
  error?: string 
} {
  if (!username || username.trim().length === 0) {
    return { isValid: false, type: null, error: 'Username is required' };
  }

  const trimmedUsername = username.trim();

  if (isValidFarcasterUsername(trimmedUsername)) {
    return { isValid: true, type: 'farcaster' };
  }

  return { 
    isValid: false, 
    type: null, 
    error: 'Invalid username format. Must be a valid Farcaster username (1-15 characters, alphanumeric, ., -, _).' 
  };
}

/**
 * Validate if a string is either a valid wallet address, username, FID, or X username
 * @param input - The input to validate
 * @returns object with validation result and input type
 */
export function validateAddressOrUsername(input: string): { 
  isValid: boolean; 
  type: 'ethereum' | 'solana' | 'farcaster' | 'fid' | 'x_username' | null; 
  error?: string 
} {
  if (!input || input.trim().length === 0) {
    return { isValid: false, type: null, error: 'Input is required' };
  }

  const trimmedInput = input.trim();

  // First try wallet address validation
  const addressValidation = validateWalletAddress(trimmedInput);
  if (addressValidation.isValid) {
    return addressValidation;
  }

  // Check for FID (numeric)
  if (isValidFID(trimmedInput)) {
    return { isValid: true, type: 'fid' };
  }

  // Check Farcaster username first (since this app is primarily for Farcaster)
  const usernameValidation = validateUsername(trimmedInput);
  if (usernameValidation.isValid) {
    return usernameValidation;
  }

  // Then check for X username (for inputs that don't match Farcaster pattern)
  if (isValidXUsername(trimmedInput)) {
    return { isValid: true, type: 'x_username' };
  }

  return { 
    isValid: false, 
    type: null, 
    error: 'Invalid format. Must be a valid wallet address (Ethereum/Solana), Farcaster username, FID, or X username.' 
  };
}

/**
 * Get the appropriate blockchain explorer URL for an address
 * @param address - The wallet address
 * @returns Object with explorer URL and address type
 */
export function getExplorerUrl(address: string): { url: string; type: 'ethereum' | 'solana' | 'unknown' } {
  if (isValidEthereumAddress(address)) {
    return {
      url: `https://basescan.org/address/${address}`,
      type: 'ethereum'
    };
  }
  
  if (isValidSolanaAddress(address)) {
    return {
      url: `https://solscan.io/account/${address}`,
      type: 'solana'
    };
  }
  
  return {
    url: '',
    type: 'unknown'
  };
}

/**
 * Open blockchain explorer for the given address
 * @param address - The wallet address to view
 */
export function openExplorer(address: string): void {
  const { url } = getExplorerUrl(address);
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
} 