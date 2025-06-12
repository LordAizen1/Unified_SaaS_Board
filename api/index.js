import express from 'express';
import axios from 'axios';
import { CostExplorer } from '@aws-sdk/client-cost-explorer';

console.log('API function initialized (module load)!'); // Added for Vercel debugging

const app = express();

app.use(express.json());

// AWS Cost endpoint
app.get('/api/aws/costs', async (req, res) => {
  console.log('API function invoked for /api/aws/costs!'); // Confirms route hit
  try {
    const { start_date, end_date } = req.query;
    const accessKeyId = req.headers['x-aws-access-key'];
    const secretAccessKey = req.headers['x-aws-secret-key'];

    if (!accessKeyId || !secretAccessKey) {
      console.error('Missing AWS credentials in headers.');
      return res.status(401).json({ error: 'AWS credentials are required' });
    }

    if (!start_date || !end_date) {
      console.error('Missing start_date or end_date in query.');
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    console.log(`Fetching AWS costs from ${start_date} to ${end_date}`);

    const costExplorer = new CostExplorer({
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      region: 'us-east-1', // Default to us-east-1 as region is no longer passed from frontend
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

      console.log('Calling getCostAndUsage with params:', JSON.stringify(params)); // Log params to debug
      const response = await costExplorer.getCostAndUsage(params);
      console.log('Successfully received response from getCostAndUsage. NextPageToken:', response.NextPageToken); // Log success of call
      results.push(...response.ResultsByTime);
      nextToken = response.NextPageToken;

    } while (nextToken);
    
    console.log('Finished fetching all results from AWS. Total results count:', results.length); // Final success log
    res.json({ ResultsByTime: results });
  } catch (error) {
    console.error('=== AWS Cost Explorer Error in catch block ===');
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      requestId: error.$metadata?.requestId,
      httpStatusCode: error.$metadata?.httpStatusCode,
      stack: error.stack
    });

    // More specific error handling based on common AWS SDK errors
    if (error.name === 'InvalidAccessKeyId' || error.name === 'UnrecognizedClientException') {
      res.status(401).json({ error: 'Invalid AWS credentials. Please check your Access Key ID and Secret Access Key.' });
    } else if (error.name === 'AccessDeniedException') {
      res.status(403).json({ error: 'Insufficient permissions. Please ensure your AWS credentials have ce:GetCostAndUsage permissions.' });
    } else if (error.name === 'ThrottlingException') {
      res.status(429).json({ error: 'AWS API rate limit exceeded. Please wait a moment and try again.' });
    } else {
      res.status(error.$metadata?.httpStatusCode || 500).json({
        error: error.message || 'Internal server error',
        code: error.code,
        requestId: error.$metadata?.requestId,
      });
    }
  }
});

// OpenAI usage endpoint
app.get('/api/openai/usage', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const apiKey = req.headers['x-api-key'];

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

// Vercel Cost endpoint
app.get('/api/vercel/costs', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    const apiToken = req.headers['x-vercel-token'];
    const teamId = req.headers['x-vercel-team-id'];

    if (!apiToken) {
      return res.status(401).json({ error: 'Vercel API token is required' });
    }

    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const response = await axios.get(`https://api.vercel.com/v2/usage`, {
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      params: {
        teamId,
        from: start_date,
        to: end_date,
      },
    });

    if (!response.data || !response.data.usage) {
      return res.status(404).json({ error: 'No usage data found for the selected period' });
    }

    res.json({
      usage: response.data.usage,
      period: {
        start: start_date,
        end: end_date,
      },
    });
  } catch (error) {
    console.error('=== Vercel API Error ===');
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });

    res.status(error.response?.status || 500).json({
      error: error.response?.data?.error || error.message,
    });
  }
});

// Add a health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app; 