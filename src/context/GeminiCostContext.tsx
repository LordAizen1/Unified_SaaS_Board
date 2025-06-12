import React, { createContext, useContext, useState, useCallback } from 'react';
import { GeminiBillingData } from '../types/gemini';
import { fetchGeminiBillingData } from '../services/geminiService';

interface GeminiCostContextValue {
  billingData: GeminiBillingData | null;
  isLoading: boolean;
  error: string | null;
  fetchGeminiCosts: (apiKey: string, startDate?: string, endDate?: string) => Promise<void>;
}

const GeminiCostContext = createContext<GeminiCostContextValue | undefined>(undefined);

export const useGeminiCosts = () => {
  const context = useContext(GeminiCostContext);
  if (!context) {
    throw new Error('useGeminiCosts must be used within a GeminiCostProvider');
  }
  return context;
};

export const GeminiCostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [billingData, setBillingData] = useState<GeminiBillingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGeminiCosts = useCallback(async (apiKey: string, startDate?: string, endDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchGeminiBillingData(apiKey, startDate, endDate);
      setBillingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Gemini billing data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <GeminiCostContext.Provider value={{ billingData, isLoading, error, fetchGeminiCosts }}>
      {children}
    </GeminiCostContext.Provider>
  );
}; 