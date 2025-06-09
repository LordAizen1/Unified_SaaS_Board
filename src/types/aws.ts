export interface AWSCostData {
  ResultsByTime: AWSIndividualCostData[];
  DimensionValueAttributes: any[]; // Or define a more specific interface if needed
}

export interface AWSIndividualCostData {
  TimePeriod: {
    Start: string;
    End: string;
  };
  Total?: {
    UnblendedCost: {
      Amount: string;
      Unit: string;
    };
  };
  Groups?: {
    Keys: string[];
    Metrics: {
      UnblendedCost: {
        Amount: string;
        Unit: string;
      };
    };
  }[];
  Estimated?: boolean;
}

export interface AWSCostSummary {
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