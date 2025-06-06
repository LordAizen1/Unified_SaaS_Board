import React, { useState } from 'react';
import { AWSService } from '../../utils/awsService';
import { AWSCostSummary } from '../../types/aws';
import { format } from 'date-fns';

export const AWSCostUsage: React.FC = () => {
  const [accessKeyId, setAccessKeyId] = useState('');
  const [secretAccessKey, setSecretAccessKey] = useState('');
  const [region, setRegion] = useState('us-east-1');
  const [startDate, setStartDate] = useState(format(new Date().setDate(new Date().getDate() - 30), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [costSummary, setCostSummary] = useState<AWSCostSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const service = new AWSService(accessKeyId, secretAccessKey, region);
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
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6">AWS Cost Usage</h2>
      
      <form onSubmit={handleSubmit} className="mb-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">AWS Access Key ID</label>
          <input
            type="password"
            value={accessKeyId}
            onChange={(e) => setAccessKeyId(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your AWS Access Key ID"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">AWS Secret Access Key</label>
          <input
            type="password"
            value={secretAccessKey}
            onChange={(e) => setSecretAccessKey(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            placeholder="Enter your AWS Secret Access Key"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">AWS Region</label>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="us-east-1">US East (N. Virginia)</option>
            <option value="us-west-2">US West (Oregon)</option>
            <option value="eu-west-1">EU (Ireland)</option>
            <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
          </select>
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
          disabled={isLoading || !accessKeyId || !secretAccessKey}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Loading...' : 'Fetch Cost Data'}
        </button>
      </form>

      {error && (
        <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
          <h3 className="font-medium">Error</h3>
          <p>{error}</p>
        </div>
      )}

      {costSummary && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Total Cost</h3>
              <p className="text-2xl font-bold text-indigo-600">
                ${costSummary.totalCost.toFixed(2)} {costSummary.costsByService[Object.keys(costSummary.costsByService)[0]]?.unit}
              </p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">Time Period</h3>
              <p className="text-sm text-gray-600">
                {format(new Date(costSummary.timeRange.start), 'MMM d, yyyy')} - {format(new Date(costSummary.timeRange.end), 'MMM d, yyyy')}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Costs by Service</h3>
            <div className="space-y-4">
              {Object.entries(costSummary.costsByService).map(([service, data]) => (
                <div key={service} className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{service}</h4>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Cost</p>
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