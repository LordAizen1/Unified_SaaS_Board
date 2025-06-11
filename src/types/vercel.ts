export interface VercelCostData {
  usage: VercelUsageData[];
  period: {
    start: string;
    end: string;
  };
}

export interface VercelUsageData {
  timestamp: string;
  service: string;
  cost: {
    amount: number;
    currency: string;
  };
  usage: {
    value: number;
    unit: string;
  };
}

export interface VercelCostSummary {
  totalCost: number;
  costsByService: {
    [service: string]: {
      cost: number;
      unit: string;
    };
  };
  costsByDate: Record<string, { serviceName: string; cost: number; }[]>;
  timeRange: {
    start: string;
    end: string;
  };
} 