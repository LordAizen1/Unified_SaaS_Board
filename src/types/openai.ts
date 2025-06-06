export interface OpenAIUsageData {
  object: string;
  data: {
    id: string;
    object: string;
    created: number;
    model: string;
    usage: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    cost: number;
  }[];
}

export interface OpenAIUsageSummary {
  totalCost: number;
  totalTokens: number;
  usageByModel: {
    [model: string]: {
      cost: number;
      tokens: number;
    };
  };
} 