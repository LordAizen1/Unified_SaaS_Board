import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { CostExplorer } from '@aws-sdk/client-cost-explorer';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(express.json());

// AWS Cost endpoint
app.get('/api/aws/costs', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const accessKeyId = req.headers['x-aws-access-key'];
    const secretAccessKey = req.headers['x-aws-secret-key'];
    const region = req.headers['x-aws-region'];

    console.log('=== AWS Cost Request Details ===');
    console.log('Query Parameters:', { start_date, end_date });
    console.log('Headers:', {
      'x-aws-access-key': accessKeyId ? 'present' : 'missing',
      'x-aws-secret-key': secretAccessKey ? 'present' : 'missing',
      'x-aws-region': region || 'not specified'
    });

    if (!accessKeyId || !secretAccessKey) {
      console.log('Error: Missing AWS credentials');
      return res.status(401).json({ error: 'AWS credentials are required' });
    }

    if (!start_date || !end_date) {
      console.log('Error: Missing date parameters');
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    console.log('Initializing AWS Cost Explorer client...');
    const costExplorer = new CostExplorer({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region: region || 'us-east-1',
    });

    const results = [];
    let nextToken = undefined;

    do {
      const params = {
        TimePeriod: {
          Start: start_date,
          End: end_date,
        },
        Granularity: 'DAILY',
        Metrics: ['UnblendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE',
          },
        ],
        NextPageToken: nextToken,
      };

      console.log('Making request to AWS Cost Explorer with params:', JSON.stringify(params, null, 2));
      const response = await costExplorer.getCostAndUsage(params);
      console.log('AWS Cost Explorer response received successfully for a page.');

      results.push(...response.ResultsByTime);
      nextToken = response.NextPageToken;

    } while (nextToken);
    
    console.log(`AWS Cost Explorer: Fetched ${results.length} daily entries.`);
    res.json({ ResultsByTime: results });
  } catch (error) {
    console.error('=== AWS Cost Explorer Error ===');
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId,
      httpStatusCode: error.$metadata?.httpStatusCode,
      stack: error.stack
    });

    res.status(error.$metadata?.httpStatusCode || 500).json({
      error: error.message,
      code: error.code,
      requestId: error.$metadata?.requestId,
    });
  }
});

// OpenAI usage endpoint
app.get('/api/openai/usage', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const apiKey = req.headers['x-api-key'];

    console.log('Received request with params:', { start_date, end_date });
    console.log('API Key present:', !!apiKey);

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    // Check if the API key is a project key
    if (apiKey.startsWith('sk-proj-')) {
      return res.status(400).json({
        error: 'Invalid API key type',
        details: 'This endpoint requires an organization API key. Project API keys cannot access usage data. Please use an organization API key from https://platform.openai.com/account/org-settings'
      });
    }

    console.log('Making request to OpenAI API...');
    const response = await axios.get('https://api.openai.com/v1/usage', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      params: {
        start_date,
        end_date,
      },
    });

    console.log('OpenAI API response status:', response.status);
    console.log('Response data:', JSON.stringify(response.data, null, 2));

    res.json(response.data);
  } catch (error) {
    console.error('Detailed error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      headers: error.response?.headers,
    });

    // Provide more helpful error messages
    if (error.response?.status === 401) {
      return res.status(401).json({
        error: 'Authentication failed',
        details: 'The API key is invalid or has been revoked. Please check your API key and try again.'
      });
    }

    if (error.response?.status === 403) {
      return res.status(403).json({
        error: 'Access denied',
        details: 'Your API key does not have permission to access usage data. Please ensure you are using an organization API key with appropriate permissions.'
      });
    }

    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal server error',
      details: error.message,
    });
  }
});

// Cursor AI usage endpoint
app.get('/api/cursor/usage', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const apiKey = req.headers['x-api-key'];

    console.log('Received Cursor AI request with params:', { start_date, end_date });
    console.log('API Key present:', !!apiKey);

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    // TODO: Replace with actual Cursor AI API endpoint when available
    // For now, return mock data
    const mockData = {
      usage: {
        total_tokens: 1500000,
        total_cost: 15.00,
        currency: 'USD',
        services: {
          'code-completion': {
            tokens: 1000000,
            cost: 10.00
          },
          'code-analysis': {
            tokens: 500000,
            cost: 5.00
          }
        }
      },
      timeRange: {
        start: start_date,
        end: end_date
      }
    };

    res.json(mockData);
  } catch (error) {
    console.error('Detailed Cursor AI error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });

    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || 'Internal server error',
      details: error.message,
    });
  }
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`Health check available at http://localhost:${port}/health`);
}); 