import React, { useState } from 'react';
import { OpenAIService } from '../../utils/openaiService';
import { OpenAIUsageSummary } from '../../types/openai';
import { format } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import openaiLogo from '../../assets/logos/openai.png';

export const OpenAIUsage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [usageSummary, setUsageSummary] = useState<OpenAIUsageSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const service = new OpenAIService(apiKey);
      const data = await service.getUsageData(startDate, endDate);
      const summary = service.calculateUsageSummary(data);
      setUsageSummary(summary);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while fetching OpenAI usage data');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-6 rounded-lg shadow-lg ${
      theme.isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h2 className={`flex items-center text-2xl font-bold mb-6 text-gray-900 dark:text-white`}>
        <img src={openaiLogo} alt="OpenAI Logo" className="w-6 h-6 mr-2" />
        OpenAI Usage
      </h2>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className={`block text-sm font-medium ${
            theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>OpenAI API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
              theme.isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'border-gray-300'
            }`}
            placeholder="Enter your OpenAI API Key"
          />
          {apiKey.startsWith('sk-proj-') && (
            <p className={`mt-2 text-sm ${
              theme.isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}>
              Warning: This appears to be a project API key. Usage data requires an organization API key.
            </p>
          )}
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
          disabled={isLoading || !apiKey || apiKey.startsWith('sk-proj-')}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fetch Usage Data'}
        </button>
      </form>

      {error && (
        <div className={`mb-4 p-4 rounded-md ${
          theme.isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'
        }`}>
          <h3 className="font-medium">Error</h3>
          <p>{error}</p>
          {error.includes('organization API key') && (
            <p className="mt-2">
              <a 
                href="https://platform.openai.com/account/org-settings" 
                target="_blank" 
                rel="noopener noreferrer"
                className={`${
                  theme.isDarkMode ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-500'
                }`}
              >
                Get your organization API key →
              </a>
            </p>
          )}
        </div>
      )}

      {usageSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className={`p-4 rounded-lg ${
              theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-medium ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Total Cost</h3>
              <p className="text-2xl font-bold text-indigo-600">
                ${usageSummary.totalCost.toFixed(2)}
              </p>
            </div>
            <div className={`p-4 rounded-lg ${
              theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <h3 className={`text-lg font-medium ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>Total Tokens</h3>
              <p className="text-2xl font-bold text-indigo-600">
                {usageSummary.totalTokens.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <h3 className={`text-lg font-medium mb-4 ${
              theme.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Usage by Model</h3>
            <div className="space-y-4">
              {Object.entries(usageSummary.usageByModel).map(([model, data]) => (
                <div key={model} className={`p-4 rounded-lg ${
                  theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <h4 className={`font-medium ${
                    theme.isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>{model}</h4>
                  <div className="mt-2 grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-sm ${
                        theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Cost</p>
                      <p className="text-lg font-semibold text-indigo-600">
                        ${data.cost.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className={`text-sm ${
                        theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Tokens</p>
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