import React, { useEffect, useMemo, useState } from 'react';
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
  const [showDetails, setShowDetails] = useState(false);
  
  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(mockData.expenses, filters);
  }, [filters]);
  
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
  
  // Generate daily spend data for the mini chart
  const dailySpendData = useMemo(() => {
    const dailyTotals: Record<string, number> = {};
    const days = 14; // Show last 14 days
    
    // Initialize all days with 0
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      dailyTotals[dateString] = 0;
    }
    
    // Sum expenses by day
    filteredExpenses.forEach(expense => {
      const dateString = new Date(expense.timestamp).toISOString().split('T')[0];
      if (dailyTotals[dateString] !== undefined) {
        dailyTotals[dateString] += expense.amount;
      }
    });
    
    // Convert to arrays for chart
    const labels = Object.keys(dailyTotals);
    const data = Object.values(dailyTotals);
    
    return { labels, data };
  }, [filteredExpenses]);
  
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-1 md:col-span-2">
            <div className="flex flex-col">
              <div className="text-3xl font-bold mb-2 dark:text-white">
                {formatCurrency(momChange.currentMonth)}
              </div>
              
              <div className="flex items-center">
                <div className={`flex items-center ${
                  momChange.percentageChange < 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {momChange.percentageChange < 0 ? (
                    <TrendingDown size={16} className="mr-1" />
                  ) : (
                    <TrendingUp size={16} className="mr-1" />
                  )}
                  <span className="text-sm font-medium">
                    {Math.abs(momChange.percentageChange).toFixed(1)}%
                  </span>
                </div>
                
                <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                  vs previous month ({formatCurrency(momChange.previousMonth)})
                </span>
              </div>
              
              <button
                onClick={() => setShowDetails(!showDetails)}
                className={`flex items-center text-sm mt-4 ${
                  theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}
              >
                {showDetails ? 'Hide' : 'Show'} details
                {showDetails ? (
                  <ChevronUp size={16} className="ml-1" />
                ) : (
                  <ChevronDown size={16} className="ml-1" />
                )}
              </button>
              
              {showDetails && (
                <div className="mt-4 space-y-3">
                  <div className={`p-3 rounded-md ${
                    theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="text-sm dark:text-gray-300">Daily Average</div>
                      <div className="font-medium dark:text-white">
                        {formatCurrency(momChange.currentMonth / 30)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-md ${
                    theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="text-sm dark:text-gray-300">Projected Monthly</div>
                      <div className="font-medium dark:text-white">
                        {formatCurrency(momChange.currentMonth * 1.1)}
                      </div>
                    </div>
                  </div>
                  
                  <div className={`p-3 rounded-md ${
                    theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex justify-between items-center">
                      <div className="text-sm dark:text-gray-300">Year-to-Date</div>
                      <div className="font-medium dark:text-white">
                        {formatCurrency(momChange.currentMonth * 8.5)}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="h-24">
            <div className="h-full" id="spend-trend-chart">
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpendOverview;