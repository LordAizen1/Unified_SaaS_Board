import React, { useState } from 'react';
import { CursorService } from '../utils/cursorService';
import { CursorUsageSummary } from '../types/cursor';
import { format } from 'date-fns';

export const CursorUsage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [usageSummary, setUsageSummary] = useState<CursorUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const service = new CursorService(apiKey);
      const data = await service.getUsageData(startDate, endDate);
      const summary = service.calculateUsageSummary(data);
      setUsageSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching Cursor AI usage data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">Cursor AI Usage</h2>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Cursor AI API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your Cursor AI API Key"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading || !apiKey}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fetch Usage Data'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          <h3 className="font-medium">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {usageSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Total Cost</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {usageSummary.currency} {usageSummary.totalCost.toFixed(2)}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Total Tokens</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {usageSummary.totalTokens.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Usage by Service</h3>
            <div className="space-y-4">
              {Object.entries(usageSummary.costsByService).map(([service, data]) => (
                <div key={service} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{service}</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Cost</p>
                      <p className="text-lg font-semibold text-indigo-600">
                        {usageSummary.currency} {data.cost.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tokens</p>
                      <p className="text-lg font-semibold text-indigo-600">
                        {data.tokens.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900">Time Period</h3>
            <p className="text-sm text-gray-600">
              {format(new Date(usageSummary.timeRange.start), 'MMM d, yyyy')} - {format(new Date(usageSummary.timeRange.end), 'MMM d, yyyy')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}; 