import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download, TrendingDown, TrendingUp } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { calculateMoMChange, filterExpenses } from '../../utils/dataTransformers';
import mockData from '../../utils/mockData';
import { Line } from 'react-chartjs-2';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip
} from 'chart.js';
import { useAWSCosts } from '../../context/AWSCostContext';
import { format, parseISO, isValid } from 'date-fns';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const SpendOverview: React.FC = () => {
  const { filters } = useFilters();
  const { theme } = useTheme();
  const { costSummary: awsCostSummary, isLoading: awsLoading, error: awsError } = useAWSCosts();
  const [showDetails, setShowDetails] = useState(false);
  
  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(mockData.expenses, filters);
  }, [filters]);
  
  // Calculate total spend
  const totalSpend = useMemo(() => {
    const mockTotal = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    const awsTotal = awsCostSummary ? awsCostSummary.totalCost : 0;
    return mockTotal + awsTotal;
  }, [filteredExpenses, awsCostSummary]);
  
  // Calculate MoM change
  const momChange = useMemo(() => {
    return calculateMoMChange(filteredExpenses);
  }, [filteredExpenses]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Helper to format dates, handling invalid dates
  const formatDate = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (!isValid(date)) {
        return 'N/A';
      }
      return format(date, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  // Generate daily spend data for the mini chart
  const dailySpendData = useMemo(() => {
    const dailyTotals: Record<string, number> = {};
    const startDate = filters.dateRange[0];
    const endDate = filters.dateRange[1];

    if (!startDate || !endDate || !isValid(startDate) || !isValid(endDate)) {
      return { labels: [], data: [] };
    }

    const dates: Date[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    
    // Initialize all days within the selected range with 0
    dates.forEach(date => {
      const dateString = format(date, 'yyyy-MM-dd');
      dailyTotals[dateString] = 0;
    });
    
    // Sum expenses by day
    filteredExpenses.forEach(expense => {
      const expenseDate = new Date(expense.timestamp);
      const dateString = format(expenseDate, 'yyyy-MM-dd');
      if (dailyTotals[dateString] !== undefined) {
        dailyTotals[dateString] += expense.amount;
      }
    });

    // Add AWS costs to daily totals if available
    if (awsCostSummary && awsCostSummary.timeRange.start && awsCostSummary.timeRange.end) {
      const awsStartDate = parseISO(awsCostSummary.timeRange.start);
      const awsEndDate = parseISO(awsCostSummary.timeRange.end);

      if (isValid(awsStartDate) && isValid(awsEndDate)) {
        // Iterate through dates within the AWS cost summary time range
        // and use the actual daily costs from awsCostSummary.costsByDate
        for (let d = new Date(awsStartDate); d <= awsEndDate; d.setDate(d.getDate() + 1)) {
          const dateString = format(d, 'yyyy-MM-dd');
          const dailyAwsServiceCosts = awsCostSummary.costsByDate[dateString];
          let dailyTotalAwsCost = 0;

          if (dailyAwsServiceCosts && Array.isArray(dailyAwsServiceCosts)) {
            dailyAwsServiceCosts.forEach(item => {
              dailyTotalAwsCost += item.cost;
            });
          }

          if (dailyTotals[dateString] !== undefined) {
            dailyTotals[dateString] += dailyTotalAwsCost;
          } else if (d >= startDate && d <= endDate) { 
            // Only add if within the selected filter range and not already initialized from mock data
            dailyTotals[dateString] = dailyTotalAwsCost;
          }
        }
      }
    }

    // Convert to arrays for chart, ensuring dates are sorted
    const sortedLabels = Object.keys(dailyTotals).sort();
    const data = sortedLabels.map(label => dailyTotals[label]);
    
    return { labels: sortedLabels, data };
  }, [filteredExpenses, awsCostSummary, filters.dateRange]);
  
  // Chart options and data
  const chartData = {
    labels: dailySpendData.labels,
    datasets: [
      {
        label: 'Daily Spend',
        data: dailySpendData.data,
        borderColor: theme.isDarkMode ? '#60a5fa' : '#3b82f6',
        backgroundColor: theme.isDarkMode 
          ? 'rgba(96, 165, 250, 0.1)' 
          : 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 0,
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
    scales: {
      x: {
        display: false,
      },
      y: {
        display: false,
      },
    },
    elements: {
      line: {
        borderWidth: 2,
      },
    },
  };
  
  // Export chart as PNG
  const exportChart = () => {
    const canvas = document.getElementById('spend-trend-chart') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'spend-trend.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };
  
  return (
    <div className={`rounded-lg overflow-hidden shadow-sm ${
      theme.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } border transition-colors duration-200`}>
      <div className="p-4 sm:p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className={`text-lg font-semibold ${
              theme.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Spend Overview
            </h2>
            <p className={`text-sm ${
              theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Current month vs previous month
            </p>
          </div>
          
          <button
            onClick={exportChart}
            className={`p-2 rounded-md ${
              theme.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } transition-colors duration-150`}
            aria-label="Export chart"
          >
            <Download size={16} />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6 items-center">
          <div className="flex-1">
            <div className={`text-4xl font-bold ${
              theme.isDarkMode ? 'text-white' : 'text-gray-900'
            } mb-2`}>
              {formatCurrency(totalSpend)}
            </div>
            <div className="flex items-center text-sm mb-4">
              {momChange.percentageChange !== 0 && (
                <span className={`flex items-center mr-2 ${
                  momChange.percentageChange > 0 ? 'text-red-500' : 'text-green-500'
                }`}>
                  {momChange.percentageChange > 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                  <span className="ml-1">{Math.abs(momChange.percentageChange).toFixed(1)}%</span>
                </span>
              )}
              <span className={`${theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                vs previous month ({formatCurrency(momChange.previousMonth)})
              </span>
            </div>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`text-sm font-medium flex items-center ${
                theme.isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              }`}
            >
              View Details {showDetails ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
            </button>

            {showDetails && (
              <div className={`mt-6 p-4 rounded-md ${
                theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                <h3 className={`text-md font-semibold mb-3 ${
                  theme.isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Additional Spend Metrics
                </h3>
                <ul className={`text-sm space-y-2 ${
                  theme.isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <li>Mock Data Total: {formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}</li>
                  <li>AWS Total Cost: {awsCostSummary ? formatCurrency(awsCostSummary.totalCost) : 'N/A'}</li>
                  <li>AWS Time Period: {awsCostSummary && awsCostSummary.timeRange.start && awsCostSummary.timeRange.end
                    ? `${formatDate(awsCostSummary.timeRange.start)} - ${formatDate(awsCostSummary.timeRange.end)}`
                    : 'N/A'
                  }</li>
                  {awsLoading && <li>Loading AWS costs...</li>}
                  {awsError && <li className="text-red-400">Error fetching AWS costs: {awsError}</li>}
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex-1 h-40">
            <div className="h-32">
              <Line id="spend-trend-chart" data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendOverview;