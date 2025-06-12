import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import { AWSService } from '../utils/awsService';
import { AWSCostSummary } from '../types/aws';

interface AWSCostContextType {
  costSummary: AWSCostSummary | null;
  isLoading: boolean;
  error: string | null;
  fetchAWSCosts: (accessKeyId: string, secretAccessKey: string, startDate: string, endDate: string) => Promise<void>;
}

const AWSCostContext = createContext<AWSCostContextType | undefined>(undefined);

export const AWSCostProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [costSummary, setCostSummary] = useState<AWSCostSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAWSCosts = useCallback(async (accessKeyId: string, secretAccessKey: string, startDate: string, endDate: string) => {
    setIsLoading(true);
    setError(null);
    setCostSummary(null); // Clear previous data

    try {
      const service = new AWSService(accessKeyId, secretAccessKey);
      const data = await service.getCostData(startDate, endDate);
      const summary = service.calculateCostSummary(data);
      setCostSummary(summary);
    } catch (err) {
      console.error('Error in AWSCostProvider fetching AWS cost data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch AWS cost data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AWSCostContext.Provider value={{ costSummary, isLoading, error, fetchAWSCosts }}>
      {children}
    </AWSCostContext.Provider>
  );
};

export const useAWSCosts = () => {
  const context = useContext(AWSCostContext);
  if (context === undefined) {
    throw new Error('useAWSCosts must be used within an AWSCostProvider');
  }
  return context;
}; 