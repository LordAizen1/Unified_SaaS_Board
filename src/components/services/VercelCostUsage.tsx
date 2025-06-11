import React, { useState, useEffect } from 'react';
import { format, subDays, startOfDay, isValid, parseISO, subMonths } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { useVercelCosts } from '../../context/VercelCostContext';

export const VercelCostUsage: React.FC = () => {
  const [apiToken, setApiToken] = useState('');
  const [teamId, setTeamId] = useState('');

  const maxPastDate = subMonths(startOfDay(new Date()), 3); // Vercel provides 3 months of usage data

  // Use local state for dates, allowing direct user input
  const [startDate, setStartDate] = useState(() => {
    const defaultStart = subDays(startOfDay(new Date()), 30);
    return format(defaultStart > maxPastDate ? defaultStart : maxPastDate, 'yyyy-MM-dd');
  });

  const [endDate, setEndDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));

  const [dateError, setDateError] = useState<string | null>(null);

  const { fetchVercelCosts, isLoading, error } = useVercelCosts();
  const { theme } = useTheme();

  // Validate dates whenever they change
  useEffect(() => {
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    const today = startOfDay(new Date());

    if (!isValid(start) || !isValid(end)) {
      setDateError('Invalid date format');
      return;
    }

    if (start < maxPastDate) {
      setDateError(`Start date cannot be older than ${format(maxPastDate, 'MMM d, yyyy')} (Vercel limit is 3 months)`);
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
  }, [startDate, endDate, maxPastDate]);

  // Fetch Vercel costs automatically when keys or local dates change
  useEffect(() => {
    if (apiToken && teamId && !dateError) {
      fetchVercelCosts(apiToken, teamId, startDate, endDate);
    }
  }, [apiToken, teamId, startDate, endDate, dateError, fetchVercelCosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dateError) {
      return; // Prevent submission if date validation fails
    }

    // This will trigger the useEffect above
    fetchVercelCosts(apiToken, teamId, startDate, endDate);
  };

  return (
    <div className={`p-6 rounded-lg shadow-lg ${
      theme.isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <h2 className={`text-2xl font-bold mb-6 ${
        theme.isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>Vercel Cost Usage</h2>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className={`block text-sm font-medium ${
            theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Vercel API Token</label>
          <input
            type="password"
            value={apiToken}
            onChange={(e) => setApiToken(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
              theme.isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'border-gray-300'
            }`}
            placeholder="Enter your Vercel API Token"
          />
        </div>

        <div>
          <label className={`block text-sm font-medium ${
            theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>Team ID</label>
          <input
            type="text"
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className={`mt-1 block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
              theme.isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'border-gray-300'
            }`}
            placeholder="Enter your Vercel Team ID"
          />
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
              max={endDate}
              min={format(maxPastDate, 'yyyy-MM-dd')} // Enforce 3-month limit
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
              min={startDate}
              max={format(startOfDay(new Date()), 'yyyy-MM-dd')}
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
          disabled={isLoading || !apiToken || !teamId || !!dateError}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fetch Cost Data'}
        </button>
      </form>

      {dateError && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          <h3 className="font-medium">Date Error</h3>
          <p>{dateError}</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          <h3 className="font-medium">Error</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}; 