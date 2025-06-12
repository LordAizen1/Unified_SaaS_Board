import React, { createContext, useContext, useState, useCallback } from 'react';
import { AnthropicCostContextType, AnthropicBillingData } from '../types/anthropic';
import { fetchAnthropicBillingData } from '../services/anthropicService';

interface AnthropicCostContextValue {
  billingData: AnthropicBillingData | null;
  isLoading: boolean;
  error: string | null;
  fetchAnthropicCosts: (apiKey: string, startDate?: string, endDate?: string) => Promise<void>;
}

const AnthropicCostContext = createContext<AnthropicCostContextValue | undefined>(undefined);

export const useAnthropicCosts = () => {
  const context = useContext(AnthropicCostContext);
  if (!context) {
    throw new Error('useAnthropicCosts must be used within an AnthropicCostProvider');
  }
  return context;
};

export const AnthropicCostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [billingData, setBillingData] = useState<AnthropicBillingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnthropicCosts = useCallback(async (apiKey: string, startDate?: string, endDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchAnthropicBillingData(apiKey, startDate, endDate);
      setBillingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Anthropic billing data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AnthropicCostContext.Provider value={{ billingData, isLoading, error, fetchAnthropicCosts }}>
      {children}
    </AnthropicCostContext.Provider>
  );
}; 