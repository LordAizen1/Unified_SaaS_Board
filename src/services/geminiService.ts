import { GeminiBillingData } from '../types/gemini';

const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1';

export const fetchGeminiBillingData = async (
  apiKey: string,
  startDate?: string,
  endDate?: string
): Promise<GeminiBillingData> => {
  try {
    // Placeholder: Adjust endpoint and params as needed for Gemini's API
    const url = `${GEMINI_API_URL}/usage` +
      (startDate && endDate ? `?start_date=${startDate}&end_date=${endDate}` : '');
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Gemini billing data');
    }

    const data = await response.json();
    return {
      totalCost: data.total_cost || 0,
      usageByModel: data.usage_by_model || {},
      usageHistory: data.usage_history || [],
    };
  } catch (error) {
    console.error('Error fetching Gemini billing data:', error);
    throw error;
  }
}; 