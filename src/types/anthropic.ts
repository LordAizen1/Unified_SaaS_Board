export interface AnthropicUsage {
  id: string;
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requestId: string;
}

export interface AnthropicBillingData {
  totalCost: number;
  usageByModel: {
    [key: string]: {
      inputTokens: number;
      outputTokens: number;
      cost: number;
    };
  };
  usageHistory: AnthropicUsage[];
}

export interface AnthropicCostContextType {
  billingData: AnthropicBillingData | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
} 