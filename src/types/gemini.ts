export interface GeminiUsage {
  id: string;
  timestamp: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  requestId: string;
}

export interface GeminiBillingData {
  totalCost: number;
  usageByModel: {
    [key: string]: {
      inputTokens: number;
      outputTokens: number;
      cost: number;
    };
  };
  usageHistory: GeminiUsage[];
} 