import { useState, useEffect, useCallback, useRef } from 'react';
import { validateUsername, generateUsernameSuggestions } from '../lib/username';
import { UsernameValidation } from '../types/user';

interface UseUsernameValidationOptions {
  debounceMs?: number;
  generateSuggestions?: boolean;
}

export const useUsernameValidation = (options: UseUsernameValidationOptions = {}) => {
  const { debounceMs = 500, generateSuggestions = true } = options;
  
  const [validation, setValidation] = useState<UsernameValidation | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckedUsername, setLastCheckedUsername] = useState<string>('');

  const checkUsername = useCallback(async (username: string) => {
    if (!username || username === lastCheckedUsername) {
      return;
    }

    setIsChecking(true);
    setLastCheckedUsername(username);

    try {
      const result = await validateUsername(username);
      
      // If username is taken and we need suggestions
      if (!result.isAvailable && generateSuggestions && !result.suggestions) {
        result.suggestions = generateUsernameSuggestions(username);
      }
      
      setValidation(result);
    } catch (error) {
      console.error('Error validating username:', error);
      setValidation({
        isValid: false,
        isAvailable: false,
        error: 'Error checking username availability'
      });
    } finally {
      setIsChecking(false);
    }
  }, [lastCheckedUsername, generateSuggestions]);

  // Debounced username checking with cleanup
  const debouncedCheckRef = useRef<NodeJS.Timeout>();

  const validateUsernameInput = useCallback((username: string) => {
    // Clear previous timeout
    if (debouncedCheckRef.current) {
      clearTimeout(debouncedCheckRef.current);
    }

    // Clear previous validation if username changed
    if (username !== lastCheckedUsername) {
      setValidation(null);
    }

    // Start debounced check
    if (username.trim()) {
      debouncedCheckRef.current = setTimeout(() => {
        checkUsername(username.trim());
      }, debounceMs);
    } else {
      setValidation(null);
      setLastCheckedUsername('');
    }
  }, [checkUsername, debounceMs, lastCheckedUsername]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debouncedCheckRef.current) {
        clearTimeout(debouncedCheckRef.current);
      }
    };
  }, []);

  const clearValidation = () => {
    setValidation(null);
    setLastCheckedUsername('');
    setIsChecking(false);
  };

  return {
    validation,
    isChecking,
    validateUsernameInput,
    clearValidation,
    checkUsername: (username: string) => {
      setValidation(null);
      checkUsername(username);
    }
  };
};

// Hook for managing username suggestions
export const useUsernameSuggestions = (baseName: string) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateSuggestions = useCallback(async (name: string) => {
    if (!name) return;

    setIsGenerating(true);
    try {
      const generated = generateUsernameSuggestions(name, 8);
      
      // Check availability for each suggestion
      const availableSuggestions: string[] = [];
      for (const suggestion of generated) {
        const validation = await validateUsername(suggestion);
        if (validation.isAvailable) {
          availableSuggestions.push(suggestion);
        }
        
        // Stop when we have enough suggestions
        if (availableSuggestions.length >= 5) break;
      }
      
      setSuggestions(availableSuggestions);
    } catch (error) {
      console.error('Error generating username suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsGenerating(false);
    }
  }, []);

  useEffect(() => {
    if (baseName) {
      generateSuggestions(baseName);
    }
  }, [baseName, generateSuggestions]);

  return {
    suggestions,
    isGenerating,
    regenerateSuggestions: () => generateSuggestions(baseName)
  };
};
