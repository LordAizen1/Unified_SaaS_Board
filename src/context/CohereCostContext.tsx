import React, { createContext, useContext, useState, useCallback } from 'react';
import { CohereBillingData } from '../types/cohere';
import { fetchCohereBillingData } from '../services/cohereService';

interface CohereCostContextValue {
  billingData: CohereBillingData | null;
  isLoading: boolean;
  error: string | null;
  fetchCohereCosts: (apiKey: string, startDate?: string, endDate?: string) => Promise<void>;
}

const CohereCostContext = createContext<CohereCostContextValue | undefined>(undefined);

export const useCohereCosts = () => {
  const context = useContext(CohereCostContext);
  if (!context) {
    throw new Error('useCohereCosts must be used within a CohereCostProvider');
  }
  return context;
};

export const CohereCostProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [billingData, setBillingData] = useState<CohereBillingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCohereCosts = useCallback(async (apiKey: string, startDate?: string, endDate?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCohereBillingData(apiKey, startDate, endDate);
      setBillingData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch Cohere billing data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <CohereCostContext.Provider value={{ billingData, isLoading, error, fetchCohereCosts }}>
      {children}
    </CohereCostContext.Provider>
  );
}; 