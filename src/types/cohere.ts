export interface CohereUsage {
  id: string;
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requestId: string;
}

export interface CohereBillingData {
  totalCost: number;
  usageByModel: {
    [key: string]: {
      inputTokens: number;
      outputTokens: number;
      cost: number;
    };
  };
  usageHistory: CohereUsage[];
} 