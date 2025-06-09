import React, { useState, useEffect } from 'react';
import { format, subDays, startOfDay, isValid, parseISO, subMonths } from 'date-fns';
import { useTheme } from '../../context/ThemeContext';
import { useAWSCosts } from '../../context/AWSCostContext';
import { useFilters } from '../../context/FilterContext';

export const AWSCostUsage: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [region, setRegion] = useState('us-east-1');

  const maxPastDate = subMonths(startOfDay(new Date()), 14); // 14 months ago

  // Use local state for dates, allowing direct user input
  const [startDate, setStartDate] = useState(() => {
    const defaultStart = subDays(startOfDay(new Date()), 30);
    return format(defaultStart > maxPastDate ? defaultStart : maxPastDate, 'yyyy-MM-dd');
  });

  const [endDate, setEndDate] = useState(format(startOfDay(new Date()), 'yyyy-MM-dd'));

  const [dateError, setDateError] = useState<string | null>(null);

  const { fetchAWSCosts, isLoading, error } = useAWSCosts();
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
      setDateError(`Start date cannot be older than ${format(maxPastDate, 'MMM d, yyyy')} (AWS limit is 14 months)`);
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

  // Fetch AWS costs automatically when keys or local dates change
  useEffect(() => {
    if (apiKey && secretKey && !dateError) {
      fetchAWSCosts(apiKey, secretKey, region, startDate, endDate);
    }
  }, [apiKey, secretKey, region, startDate, endDate, dateError, fetchAWSCosts]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (dateError) {
      return; // Prevent submission if date validation fails
    }

    // This will trigger the useEffect above
    fetchAWSCosts(apiKey, secretKey, region, startDate, endDate);
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
              max={endDate}
              min={format(maxPastDate, 'yyyy-MM-dd')} // Enforce 14-month limit
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
          disabled={isLoading || !apiKey || !!dateError}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fetch Cost Data'}
        </button>
      </form>

      {(error || dateError) && (
        <div className={`mb-4 p-4 rounded-md ${
          theme.isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-50 text-red-700'
        }`}>
          <h3 className="font-medium">Error</h3>
          <p>{error || dateError}</p>
        </div>
      )}

      {/* Cost summary display removed from here - will be handled by other components using context */}
    </div>
  );
}; 