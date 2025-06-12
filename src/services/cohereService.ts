import { CohereBillingData } from '../types/cohere';

const COHERE_API_URL = 'https://api.cohere.ai/v1';

export const fetchCohereBillingData = async (
  apiKey: string,
  startDate?: string,
  endDate?: string
): Promise<CohereBillingData> => {
  try {
    // Placeholder: Adjust endpoint and params as needed for Cohere's API
    const url = `${COHERE_API_URL}/usage` +
      (startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : '');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Cohere billing data');
    }

    const data = await response.json();
    return {
      totalCost: data.total_cost || 0,
      usageByModel: data.usage_by_model || {},
      usageHistory: data.usage_history || [],
    };
  } catch (error) {
    console.error('Error fetching Cohere billing data:', error);
    throw error;
  }
}; 