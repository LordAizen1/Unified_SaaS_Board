export interface AWSCostData {
  TimePeriod: {
    Start: string;
    End: string;
  };
  Total: {
    UnblendedCost: {
      Amount: string;
      Unit: string;
    };
  };
  Groups: {
    Keys: string[];
    Metrics: {
      UnblendedCost: {
        Amount: string;
        Unit: string;
      };
    };
  }[];
}

export interface AWSCostSummary {
  totalCost: number;
  costsByService: {
    [service: string]: {
      cost: number;
      unit: string;
    };
  };
  timeRange: {
    start: string;
    end: string;
  };
} 