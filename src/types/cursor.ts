export interface CursorUsageData {
  usage: {
    total_tokens: number;
    total_cost: number;
    currency: string;
    services: {
      [service: string]: {
        tokens: number;
        cost: number;
      };
    };
  };
  timeRange: {
    start: string;
    end: string;
  };
}

export interface CursorUsageSummary {
  totalTokens: number;
  totalCost: number;
  currency: string;
  costsByService: {
    [service: string]: {
      tokens: number;
      cost: number;
    };
  };
  timeRange: {
    start: string;
    end: string;
  };
} 