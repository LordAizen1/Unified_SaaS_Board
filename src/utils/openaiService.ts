import axios from 'axios';
import { OpenAIUsageData, OpenAIUsageSummary } from '../types/openai';

// Use relative URL that will be handled by Vite's proxy
const API_URL = '/api/openai/usage';

export class OpenAIService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getUsageData(startDate: string, endDate: string): Promise<OpenAIUsageData> {
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

      // Transform the response to match our expected format
      const transformedData: OpenAIUsageData = {
        object: 'list',
        data: response.data.data.map((item: any) => ({
          id: item.id,
          object: 'usage',
          created: new Date(item.date).getTime(),
          model: item.model,
          usage: {
            prompt_tokens: item.prompt_tokens || 0,
            completion_tokens: item.completion_tokens || 0,
            total_tokens: item.total_tokens || 0,
          },
          cost: item.cost || 0,
        })),
      };

      return transformedData;
    } catch (error) {
      console.error('Error fetching OpenAI usage data:', error);
      throw error;
    }
  }

  calculateUsageSummary(data: OpenAIUsageData): OpenAIUsageSummary {
    const summary: OpenAIUsageSummary = {
      totalCost: 0,
      totalTokens: 0,
      usageByModel: {},
    };

    data.data.forEach(item => {
      const { model, usage, cost } = item;
      
      // Update total cost and tokens
      summary.totalCost += cost;
      summary.totalTokens += usage.total_tokens;

      // Update model-specific usage
      if (!summary.usageByModel[model]) {
        summary.usageByModel[model] = {
          cost: 0,
          tokens: 0,
        };
      }
      summary.usageByModel[model].cost += cost;
      summary.usageByModel[model].tokens += usage.total_tokens;
    });

    return summary;
  }
} 