'use client';

import { useState, useCallback } from 'react';
import { validateAddressOrUsername } from '@/lib/validation';

interface AddressInputProps {
  onAddressSubmit: (inputs: string[]) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function AddressInput({ onAddressSubmit, isLoading = false, disabled = false }: AddressInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [inputs, setInputs] = useState<string[]>([]);
  const [validation, setValidation] = useState<{ isValid: boolean; type: 'ethereum' | 'solana' | 'farcaster' | null; error?: string } | null>(null);

  const validateInput = useCallback((value: string) => {
    if (!value.trim()) {
      setValidation(null);
      return;
    }

    const result = validateAddressOrUsername(value.trim());
    setValidation(result);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    validateInput(value);
  };

  const handleAddInput = () => {
    const trimmedValue = inputValue.trim();
    if (!trimmedValue) return;

    const result = validateAddressOrUsername(trimmedValue);
    if (!result.isValid) {
      setValidation(result);
      return;
    }

    // Check if input is already added
    if (inputs.some(input => input.toLowerCase() === trimmedValue.toLowerCase())) {
      setValidation({ isValid: false, type: null, error: 'Input already added' });
      return;
    }

    const newInputs = [...inputs, trimmedValue];
    setInputs(newInputs);
    setInputValue('');
    setValidation(null);
  };

  const handleRemoveInput = (index: number) => {
    const newInputs = inputs.filter((_, i) => i !== index);
    setInputs(newInputs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add current input if valid
    if (inputValue.trim()) {
      const result = validateAddressOrUsername(inputValue.trim());
      if (result.isValid && !inputs.some(input => input.toLowerCase() === inputValue.trim().toLowerCase())) {
        const finalInputs = [...inputs, inputValue.trim()];
        onAddressSubmit(finalInputs);
        return;
      }
    }

    // Submit existing inputs
    if (inputs.length > 0) {
      onAddressSubmit(inputs);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim() && validation?.isValid) {
        handleAddInput();
      } else if (inputs.length > 0) {
        handleSubmit(e as React.FormEvent);
      }
    }
  };

  const canSubmit = inputs.length > 0 || (inputValue.trim() && validation?.isValid);

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4">
      <div className="space-y-2">
        <label htmlFor="address-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Wallet Address or Username
        </label>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter Ethereum/Solana addresses or Farcaster usernames to find linked profiles
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <input
              id="address-input"
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="0x..., Solana address, or @username"
              disabled={disabled || isLoading}
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck="false"
              className={`w-full px-4 py-3 border rounded-lg text-sm transition-colors
                ${validation === null 
                  ? 'border-gray-300 dark:border-gray-600' 
                  : validation.isValid 
                    ? 'border-green-500 dark:border-green-400' 
                    : 'border-red-500 dark:border-red-400'
                }
                bg-white dark:bg-gray-800 
                text-gray-900 dark:text-gray-100
                placeholder-gray-500 dark:placeholder-gray-400
                focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            />
          </div>
          
          {inputValue.trim() && validation?.isValid && (
            <button
              type="button"
              onClick={handleAddInput}
              disabled={disabled || isLoading}
              className="px-4 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 
                         rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors
                         disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              Add
            </button>
          )}
        </div>

        {/* Validation feedback */}
        {validation && !validation.isValid && validation.error && (
          <p className="text-sm text-red-600 dark:text-red-400">{validation.error}</p>
        )}

        {validation && validation.isValid && (
          <p className="text-sm text-green-600 dark:text-green-400">
            Valid {validation.type === 'farcaster' ? 'username' : `${validation.type} address`}
          </p>
        )}

        {/* Input list */}
        {inputs.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Items to search ({inputs.length}):
            </p>
            <div className="space-y-1">
              {inputs.map((input, index) => (
                <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 
                                             rounded-lg px-3 py-3 md:py-2">
                  <span className="text-sm font-mono text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">
                    {input}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveInput(index)}
                    disabled={disabled || isLoading}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 
                               dark:hover:text-red-300 transition-colors disabled:opacity-50
                               min-w-[44px] min-h-[44px] flex items-center justify-center
                               rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <span className="text-lg">×</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={!canSubmit || isLoading || disabled}
          className="w-full sm:w-auto px-8 py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-lg 
                     hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors
                     disabled:opacity-50 disabled:cursor-not-allowed
                     font-medium text-sm flex items-center justify-center gap-2
                     min-h-[48px] active:bg-blue-800 dark:active:bg-blue-700"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Searching...
            </>
          ) : (
            'Search Profiles'
          )}
        </button>
      </form>
    </div>
  );
} 