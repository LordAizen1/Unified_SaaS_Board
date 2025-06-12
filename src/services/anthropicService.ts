import { AnthropicBillingData } from '../types/anthropic';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1';

export const fetchAnthropicBillingData = async (
  apiKey: string,
  startDate?: string,
  endDate?: string
): Promise<AnthropicBillingData> => {
  try {
    // Placeholder: Adjust endpoint and params as needed for Anthropic's API
    const url = `${ANTHROPIC_API_URL}/usage` +
      (startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : '');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Anthropic billing data');
    }

    const data = await response.json();
    return {
      totalCost: data.total_cost || 0,
      usageByModel: data.usage_by_model || {},
      usageHistory: data.usage_history || [],
    };
  } catch (error) {
    console.error('Error fetching Anthropic billing data:', error);
    throw error;
  }
}; 