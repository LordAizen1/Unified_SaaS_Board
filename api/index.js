import express from 'express';
import axios from 'axios';
import { CostExplorer } from '@aws-sdk/client-cost-explorer';

console.log('API function invoked!'); // Added for Vercel debugging

const app = express();

app.use(express.json());

// AWS Cost endpoint
app.get('/api/aws/costs', async (req, res) => {
  // ... existing code ...
});

// OpenAI usage endpoint
// ... existing code ...

// Vercel Cost endpoint
// ... existing code ...

// Add a health check endpoint
// ... existing code ...

export default app; 