import React, { createContext, useContext, useState, ReactNode } from 'react';
import { OpenAIService } from '../utils/openaiService';
import { OpenAIUsageData, OpenAIUsageSummary } from '../types/openai';

interface OpenAIContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  service: OpenAIService | null;
  usageData: OpenAIUsageData | null;
  usageSummary: OpenAIUsageSummary | null;
  fetchUsageData: (startDate: string, endDate: string) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const OpenAIContext = createContext<OpenAIContextType | undefined>(undefined);

export const OpenAIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [service, setService] = useState<OpenAIService | null>(null);
  const [usageData, setUsageData] = useState<OpenAIUsageData | null>(null);
  const [usageSummary, setUsageSummary] = useState<OpenAIUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetApiKey = (key: string) => {
    setApiKey(key);
    setService(new OpenAIService(key));
  };

  const fetchUsageData = async (startDate: string, endDate: string) => {
    if (!service) {
      setError('OpenAI service not initialized. Please set your API key first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await service.getUsageData(startDate, endDate);
      setUsageData(data);
      const summary = service.calculateUsageSummary(data);
      setUsageSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching usage data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <OpenAIContext.Provider
      value={{
        apiKey,
        setApiKey: handleSetApiKey,
        service,
        usageData,
        usageSummary,
        fetchUsageData,
        isLoading,
        error,
      }}
    >
      {children}
    </OpenAIContext.Provider>
  );
};

export const useOpenAI = () => {
  const context = useContext(OpenAIContext);
  if (context === undefined) {
    throw new Error('useOpenAI must be used within an OpenAIProvider');
  }
  return context;
}; 