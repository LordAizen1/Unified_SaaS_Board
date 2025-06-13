import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Download, TrendingDown, TrendingUp, DollarSign, Calendar, Target } from 'lucide-react';
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
        pointHoverRadius: 4,
        borderWidth: 2,
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
        enabled: true,
        backgroundColor: theme.isDarkMode ? '#1f2937' : '#ffffff',
        titleColor: theme.isDarkMode ? '#f9fafb' : '#111827',
        bodyColor: theme.isDarkMode ? '#d1d5db' : '#374151',
        borderColor: theme.isDarkMode ? '#374151' : '#e5e7eb',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false,
        callbacks: {
          title: (context: any) => {
            const date = new Date(context[0].label);
            return format(date, 'MMM d, yyyy');
          },
          label: (context: any) => {
            return `Spend: ${formatCurrency(context.raw)}`;
          },
        },
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
    interaction: {
      intersect: false,
      mode: 'index' as const,
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

  // Calculate budget progress (mock data for demonstration)
  const monthlyBudget = 50000; // $50k monthly budget
  const budgetProgress = (totalSpend / monthlyBudget) * 100;
  const isOverBudget = budgetProgress > 100;
  
  return (
    <div className={`rounded-xl overflow-hidden shadow-lg border ${
      theme.isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    } transition-all duration-200 hover:shadow-xl`}>
      <div className="p-6 sm:p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className={`text-xl font-bold ${
              theme.isDarkMode ? 'text-white' : 'text-gray-900'
            } mb-2`}>
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
            className={`p-3 rounded-lg ${
              theme.isDarkMode ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-600'
            } transition-all duration-150`}
            aria-label="Export chart"
          >
            <Download size={18} />
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Left side - Metrics */}
          <div className="space-y-6">
            {/* Main spend amount */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  theme.isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'
                }`}>
                  <DollarSign className={`w-6 h-6 ${
                    theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <p className={`text-sm font-medium ${
                    theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    Total Spend
                  </p>
                  <div className={`text-4xl font-bold ${
                    theme.isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {formatCurrency(totalSpend)}
                  </div>
                </div>
              </div>
              
              {/* MoM Change */}
              {momChange.percentageChange !== 0 && (
                <div className="flex items-center gap-2">
                  <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                    momChange.percentageChange > 0 
                      ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                      : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  }`}>
                    {momChange.percentageChange > 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    <span>{Math.abs(momChange.percentageChange).toFixed(1)}%</span>
                  </div>
                  <span className={`text-sm ${
                    theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    vs last month ({formatCurrency(momChange.previousMonth)})
                  </span>
                </div>
              )}
            </div>

            {/* Budget Progress */}
            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className={`w-4 h-4 ${
                    theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm font-medium ${
                    theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    Monthly Budget
                  </span>
                </div>
                <span className={`text-sm font-medium ${
                  isOverBudget 
                    ? 'text-red-600 dark:text-red-400' 
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {budgetProgress.toFixed(1)}%
                </span>
              </div>
              <div className={`w-full bg-gray-200 rounded-full h-2 ${
                theme.isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
              }`}>
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isOverBudget 
                      ? 'bg-red-500' 
                      : budgetProgress > 80 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(budgetProgress, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className={`text-xs ${
                  theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatCurrency(totalSpend)}
                </span>
                <span className={`text-xs ${
                  theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {formatCurrency(monthlyBudget)}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setShowDetails(!showDetails)}
              className={`text-sm font-medium flex items-center gap-2 ${
                theme.isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
              } transition-colors duration-150`}
            >
              <Calendar size={16} />
              View Details 
              {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showDetails && (
              <div className={`p-4 rounded-lg border ${
                theme.isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h3 className={`text-md font-semibold mb-3 ${
                  theme.isDarkMode ? 'text-white' : 'text-gray-800'
                }`}>
                  Spend Breakdown
                </h3>
                <div className={`space-y-3 text-sm ${
                  theme.isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                  <div className="flex justify-between">
                    <span>Mock Data Total:</span>
                    <span className="font-medium">{formatCurrency(filteredExpenses.reduce((sum, e) => sum + e.amount, 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>AWS Total Cost:</span>
                    <span className="font-medium">{awsCostSummary ? formatCurrency(awsCostSummary.totalCost) : 'N/A'}</span>
                  </div>
                  {awsCostSummary && (
                    <div className="flex justify-between">
                      <span>AWS Period:</span>
                      <span className="font-medium">
                        {awsCostSummary.timeRange.start && awsCostSummary.timeRange.end
                          ? `${formatDate(awsCostSummary.timeRange.start)} - ${formatDate(awsCostSummary.timeRange.end)}`
                          : 'N/A'
                        }
                      </span>
                    </div>
                  )}
                  {awsLoading && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Loading AWS costs...</span>
                    </div>
                  )}
                  {awsError && (
                    <div className="text-red-400 text-xs">
                      Error: {awsError}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Right side - Chart */}
          <div className="h-48 relative">
            <div className={`absolute inset-0 rounded-lg ${
              theme.isDarkMode ? 'bg-gray-700/20' : 'bg-gray-50'
            }`}>
              <Line id="spend-trend-chart" data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendOverview;