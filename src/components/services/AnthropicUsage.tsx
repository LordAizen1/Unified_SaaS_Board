import React, { useState, useEffect } from 'react';
import { format, subDays, startOfDay, isValid, parseISO } from 'date-fns';
import { useAnthropicCosts } from '../../context/AnthropicCostContext';
import { useTheme } from '../../context/ThemeContext';
import { Skeleton } from '../ui/skeleton';
import { Alert, AlertDescription } from '../ui/alert';
import { AlertCircle } from 'lucide-react';
import anthropicLogo from '../../assets/logos/anthropic.png';

export const AnthropicUsage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [startDate, setStartDate] = useState(() => format(subDays(startOfDay(new Date()), 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));
  const [dateError, setDateError] = useState<string | null>(null);
  const { theme } = useTheme();

  const { billingData, isLoading, error, fetchAnthropicCosts } = useAnthropicCosts();

  useEffect(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const today = startOfDay(new Date());
    if (!isValid(start) || !isValid(end)) {
      setDateError('Invalid date format');
      return;
    }
    if (start > end) {
      setDateError('Start date cannot be after end date');
      return;
    }
    if (end > today) {
      setDateError('End date cannot be in the future');
      return;
    }
    setDateError(null);
  }, [startDate, endDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (dateError) return;
    fetchAnthropicCosts(apiKey, startDate, endDate);
  };

  return (
    <div className={`p-6 rounded-lg shadow-lg ${theme.isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
      <h2 className={`flex items-center text-2xl font-bold mb-6 ${theme.isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        <img src={anthropicLogo} alt="Anthropic Logo" className="w-6 h-6 mr-2" />
        Anthropic Usage
      </h2>
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className={`block text-sm font-medium ${theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Anthropic API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${theme.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            placeholder="Enter your Anthropic API Key"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block text-sm font-medium ${theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              max={endDate}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${theme.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium ${theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate}
              max={format(startOfDay(new Date()), 'yyyy-MM-dd')}
              className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${theme.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || !apiKey || !!dateError}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fetch Usage Data'}
        </button>
      </form>
      {dateError && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          <h3 className="font-medium">Date Error</h3>
          <p>{dateError}</p>
        </div>
      )}
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
          <Skeleton className="h-4 w-[300px]" />
        </div>
      ) : billingData ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
            <p className="text-2xl font-bold">${billingData.totalCost.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-2">Usage by Model</p>
            <div className="space-y-2">
              {Object.entries(billingData.usageByModel).map(([model, usage]) => (
                <div key={model} className="flex justify-between items-center">
                  <span className="text-sm">{model}</span>
                  <div className="text-right">
                    <p className="text-sm">${usage.cost.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">
                      {usage.inputTokens.toLocaleString()} input / {usage.outputTokens.toLocaleString()} output tokens
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}; 