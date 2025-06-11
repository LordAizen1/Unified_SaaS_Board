import axios from 'axios';
import { VercelCostData, VercelCostSummary } from '../types/vercel';

const API_URL = '/api/vercel/costs';

export class VercelService {
  private apiToken: string;
  private teamId: string;

  constructor(apiToken: string, teamId: string) {
    this.apiToken = apiToken;
    this.teamId = teamId;
  }

  async getCostData(startDate: string, endDate: string): Promise<VercelCostData> {
    try {
      const response = await axios.get(API_URL, {
        headers: {
          'x-vercel-token': this.apiToken,
          'x-vercel-team-id': this.teamId,
          'Content-Type': 'application/json',
        },
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      if (!response.data || !response.data.usage || response.data.usage.length === 0) {
        throw new Error('No cost data found for the selected period. This might mean no costs were incurred or the date range is invalid.');
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching Vercel cost data:', error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Vercel API token. Please check your credentials.');
        } else if (error.response?.status === 403) {
          throw new Error('Insufficient permissions. Please ensure your Vercel token has the necessary permissions.');
        } else if (error.response?.data?.error) {
          throw new Error(error.response.data.error);
        }
      }
      throw error;
    }
  }

  calculateCostSummary(data: VercelCostData): VercelCostSummary {
    try {
      // Initialize summary with default values
      const summary: VercelCostSummary = {
        totalCost: 0,
        costsByService: {},
        costsByDate: {},
        timeRange: {
          start: data.period.start,
          end: data.period.end,
        },
      };

      data.usage.forEach(usageData => {
        const date = usageData.timestamp.split('T')[0]; // Get just the date part
        const serviceName = usageData.service;
        const cost = usageData.cost.amount;
        const unit = usageData.cost.currency;

        // Aggregate costs by service for the entire period
        if (!summary.costsByService[serviceName]) {
          summary.costsByService[serviceName] = { cost: 0, unit };
        }
        summary.costsByService[serviceName].cost += cost;
        summary.totalCost += cost;

        // Add daily service cost to costsByDate
        if (!summary.costsByDate[date]) {
          summary.costsByDate[date] = [];
        }
        summary.costsByDate[date].push({ serviceName, cost });
      });

      return summary;
    } catch (error) {
      console.error('Error calculating Vercel cost summary:', error);
      throw error;
    }
  }
} 