import React, { useState } from 'react';
import { useOpenAI } from '../context/OpenAIContext';
import { format } from 'date-fns';

export const OpenAIUsage: React.FC = () => {
  const { apiKey, setApiKey, usageSummary, fetchUsageData, isLoading, error } = useOpenAI();
  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsageData(startDate, endDate);
  };

  const isProjectKey = apiKey.startsWith('sk-proj-');

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">OpenAI Usage</h2>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your OpenAI API key"
          />
          {isProjectKey && (
            <p className="mt-2 text-sm text-red-600">
              ⚠️ You're using a project API key. This endpoint requires an organization API key.
              <br />
              Please get an organization API key from{' '}
              <a 
                href="https://platform.openai.com/account/org-settings" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                OpenAI Organization Settings
              </a>
            </p>
          )}
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
          disabled={isLoading || !apiKey || isProjectKey}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fetch Usage Data'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          <h3 className="font-medium">Error</h3>
          <p>{error}</p>
          {error.includes('organization API key') && (
            <p className="mt-2">
              Please get an organization API key from{' '}
              <a 
                href="https://platform.openai.com/account/org-settings" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-indigo-600 hover:text-indigo-500 underline"
              >
                OpenAI Organization Settings
              </a>
            </p>
          )}
        </div>
      )}

      {usageSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Total Cost</h3>
              <p className="text-2xl font-bold text-indigo-600">
                ${usageSummary.totalCost.toFixed(2)}
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
            <h3 className="text-lg font-medium text-gray-900 mb-4">Usage by Model</h3>
            <div className="space-y-4">
              {Object.entries(usageSummary.usageByModel).map(([model, data]) => (
                <div key={model} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{model}</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Cost</p>
                      <p className="text-lg font-semibold text-indigo-600">
                        ${data.cost.toFixed(2)}
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
        </div>
      )}
    </div>
  );
}; 