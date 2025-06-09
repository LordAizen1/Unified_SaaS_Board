import axios from 'axios';
import { AWSCostData, AWSCostSummary, AWSIndividualCostData } from '../types/aws';

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

  async getCostData(startDate: string, endDate: string): Promise<AWSIndividualCostData[]> {
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

      if (!response.data || !response.data.ResultsByTime || response.data.ResultsByTime.length === 0) {
        throw new Error('No cost data found for the selected period. This might mean no costs were incurred or the date range is invalid.');
      }

      // AWS GetCostAndUsage returns data in ResultsByTime array
      return response.data.ResultsByTime;
    } catch (error) {
      console.error('Error fetching AWS cost data:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid AWS credentials. Please check your Access Key ID and Secret Access Key.');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions. Please ensure your AWS credentials have ce:GetCostAndUsage permissions.');
        } else if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw error;
    }
  }

  calculateCostSummary(data: AWSIndividualCostData[]): AWSCostSummary {
    try {
      // Initialize summary with default values
      const summary: AWSCostSummary = {
        totalCost: 0,
        costsByService: {},
        costsByDate: {},
        timeRange: {
          start: data[0]?.TimePeriod?.Start || '',
          end: data[data.length - 1]?.TimePeriod?.End || '',
        },
      };

      data.forEach(dailyData => {
        const date = dailyData.TimePeriod?.Start;
        let dailyTotalCost = 0;

        if (date) {
          summary.costsByDate[date] = []; // Initialize array for this date
        }

        if (dailyData.Groups && Array.isArray(dailyData.Groups)) {
          dailyData.Groups.forEach(group => {
            if (group.Keys?.[0] && group.Metrics?.UnblendedCost) {
              const serviceName = group.Keys[0];
              const cost = parseFloat(group.Metrics.UnblendedCost.Amount) || 0;
              const unit = group.Metrics.UnblendedCost.Unit || 'USD';

              // Aggregate costs by service for the entire period
              if (!summary.costsByService[serviceName]) {
                summary.costsByService[serviceName] = { cost: 0, unit };
              }
              summary.costsByService[serviceName].cost += cost;
              dailyTotalCost += cost;

              // Add daily service cost to costsByDate
              if (date) {
                summary.costsByDate[date].push({ serviceName, cost });
              }
            }
          });
        } else if (dailyData.Total?.UnblendedCost) {
          dailyTotalCost = parseFloat(dailyData.Total.UnblendedCost.Amount) || 0;
          // If no groups, and there's a total, add it as 'Unknown Service' or similar
          if (date) {
            summary.costsByDate[date].push({ serviceName: 'Unknown Service', cost: dailyTotalCost });
          }
        }

        if (date) {
          summary.totalCost += dailyTotalCost;
        }
      });

      return summary;
    } catch (error) {
      console.error('Error calculating cost summary:', error);
      throw new Error('Failed to process AWS cost data');
    }
  }
} 