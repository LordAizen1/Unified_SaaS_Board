import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { VercelService } from '../utils/vercelService';
import { VercelCostSummary } from '../types/vercel';

interface VercelCostContextType {
  costSummary: VercelCostSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchVercelCosts: (apiToken: string, teamId: string, startDate: string, endDate: string) => Promise<void>;
}

const VercelCostContext = createContext<VercelCostContextType | undefined>(undefined);

export const VercelCostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [costSummary, setCostSummary] = useState<VercelCostSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVercelCosts = useCallback(async (apiToken: string, teamId: string, startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);
    setCostSummary(null); // Clear previous data

    try {
      const service = new VercelService(apiToken, teamId);
      const data = await service.getCostData(startDate, endDate);
      console.log('VercelCostContext: Raw data from getCostData:', data);
      const summary = service.calculateCostSummary(data);
      console.log('VercelCostContext: Calculated summary:', summary);
      setCostSummary(summary);
    } catch (err) {
      console.error('Error in VercelCostProvider fetching Vercel cost data:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred while fetching Vercel cost data.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <VercelCostContext.Provider value={{ costSummary, isLoading, error, fetchVercelCosts }}>
      {children}
    </VercelCostContext.Provider>
  );
};

export const useVercelCosts = () => {
  const context = useContext(VercelCostContext);
  if (context === undefined) {
    throw new Error('useVercelCosts must be used within a VercelCostProvider');
  }
  return context;
}; 