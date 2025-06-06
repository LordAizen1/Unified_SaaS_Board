import axios from 'axios';
import { CursorUsageData, CursorUsageSummary } from '../types/cursor';

const API_URL = '/api/cursor/usage';

export class CursorService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getUsageData(startDate: string, endDate: string): Promise<CursorUsageData> {
    try {
      const response = await axios.get(API_URL, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
        },
        params: {
          start_date: startDate,
          end_date: endDate,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error fetching Cursor AI usage data:', error);
      throw error;
    }
  }

  calculateUsageSummary(data: CursorUsageData): CursorUsageSummary {
    return {
      totalTokens: data.usage.total_tokens,
      totalCost: data.usage.total_cost,
      currency: data.usage.currency,
      costsByService: data.usage.services,
      timeRange: data.timeRange,
    };
  }
} 