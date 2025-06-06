import axios from 'axios';
import { AWSCostData, AWSCostSummary } from '../types/aws';

const API_URL = '/api/aws/costs';

export class AWSService {
  private accessKeyId: string;
  private secretAccessKey: string;
  private region: string;

  constructor(accessKeyId: string, secretAccessKey: string, region: string) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
  }

  async getCostData(startDate: string, endDate: string): Promise<AWSCostData> {
    try {
      const response = await axios.get(API_URL, {
        headers: {
          'x-aws-access-key': this.accessKeyId,
          'x-aws-secret-key': this.secretAccessKey,
          'x-aws-region': this.region,
          'Content-Type': 'application/json',
        },
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching AWS cost data:', error);
      throw error;
    }
  }

  calculateCostSummary(data: AWSCostData): AWSCostSummary {
    const summary: AWSCostSummary = {
      totalCost: parseFloat(data.Total.UnblendedCost.Amount),
      costsByService: {},
      timeRange: {
        start: data.TimePeriod.Start,
        end: data.TimePeriod.End,
      },
    };

    data.Groups.forEach(group => {
      const serviceName = group.Keys[0];
      const cost = parseFloat(group.Metrics.UnblendedCost.Amount);
      const unit = group.Metrics.UnblendedCost.Unit;

      summary.costsByService[serviceName] = {
        cost,
        unit,
      };
    });

    return summary;
  }
} 