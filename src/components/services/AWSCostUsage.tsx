import React, { useState } from 'react';
import { AWSService } from '../../utils/awsService';
import { AWSCostSummary } from '../../types/aws';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';

export const AWSCostUsage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [costSummary, setCostSummary] = useState<AWSCostSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const service = new AWSService(apiKey, secretKey, region);
      const data = await service.getCostData(startDate, endDate);
      const summary = service.calculateCostSummary(data);
      setCostSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching AWS cost data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-lg shadow-lg ${
      theme.isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h2 className={`text-2xl font-bold mb-6 ${
        theme.isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>AWS Cost Usage</h2>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className={`block text-sm font-medium ${
            theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>AWS Access Key ID</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
              theme.isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'border-gray-300'
            }`}
            placeholder="Enter your AWS Access Key ID"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${
            theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>AWS Secret Access Key</label>
          <input
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
              theme.isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'border-gray-300'
            }`}
            placeholder="Enter your AWS Secret Access Key"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${
            theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>AWS Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
              theme.isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'border-gray-300'
            }`}
          >
            <option value="us-east-1">US East (N. Virginia)</option>
            <option value="us-west-2">US West (Oregon)</option>
            <option value="eu-west-1">EU (Ireland)</option>
            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
          </select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${
              theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                theme.isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
              }`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${
              theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
                theme.isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'border-gray-300'
              }`}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !apiKey}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fetch Cost Data'}
        </button>
      </form>

      {error && (
        <div className={`mb-4 p-4 rounded-md ${
          theme.isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'
        }`}>
          <h3 className="font-medium">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {costSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${
              theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-medium ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Total Cost</h3>
              <p className="text-2xl font-bold text-indigo-600">
                ${costSummary.totalCost.toFixed(2)} {costSummary.costsByService[Object.keys(costSummary.costsByService)[0]]?.unit}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-medium ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Time Period</h3>
              <p className={`text-sm ${
                theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>
                {format(new Date(costSummary.timeRange.start), 'MMM d, yyyy')} - {format(new Date(costSummary.timeRange.end), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <div>
            <h3 className={`text-lg font-medium mb-4 ${
              theme.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Costs by Service</h3>
            <div className="space-y-4">
              {Object.entries(costSummary.costsByService).map(([service, data]) => (
                <div key={service} className={`p-4 rounded-lg ${
                  theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-medium ${
                    theme.isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{service}</h4>
                  <div className="mt-2">
                    <p className={`text-sm ${
                      theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>Cost</p>
                    <p className="text-lg font-semibold text-indigo-600">
                      ${data.cost.toFixed(2)} {data.unit}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 