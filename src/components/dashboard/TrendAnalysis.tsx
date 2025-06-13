import React, { useMemo } from 'react';
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
import { Download, TrendingUp, Calendar, Activity } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { filterExpenses, generateTrendData } from '../../utils/dataTransformers';
import mockData from '../../utils/mockData';
import { useAWSCosts } from '../../context/AWSCostContext';
import { format, parseISO, isValid } from 'date-fns';
import { Expense, Environment } from '../../types';

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

const TrendAnalysis: React.FC = () => {
  const { filters } = useFilters();
  const { theme } = useTheme();
  const { costSummary: awsCostSummary } = useAWSCosts();
  
  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    const mockFiltered = filterExpenses(mockData.expenses, filters);
    let combined: Expense[] = [...mockFiltered];

    if (awsCostSummary) {
      // Iterate through daily AWS costs and create Expense objects for each service on each day
      Object.entries(awsCostSummary.costsByDate).forEach(([date, dailyServiceCosts]) => {
        const awsCategory = mockData.categories.find(cat => cat.name === 'Cloud Infrastructure');
        if (awsCategory) {
          dailyServiceCosts.forEach(item => {
            combined.push({
              id: `aws-${item.serviceName}-${date}`,
              timestamp: date,
              amount: parseFloat(item.cost.toFixed(2)),
              serviceId: item.serviceName,
              serviceName: item.serviceName,
              categoryId: awsCategory.id,
              categoryName: awsCategory.name,
              teamId: 'aws-team',
              teamName: 'Cloud Providers',
              projectId: 'aws-project',
              projectName: 'AWS Metrics',
              environment: 'prod' as Environment,
              tags: ['aws', 'cloud'],
              usageMetrics: [],
            });
          });
        }
      });
    }
    return combined;
  }, [filters, awsCostSummary]);
  
  // Generate monthly trend data
  const trendData = useMemo(() => {
    const startDate = filters.dateRange[0];
    const endDate = filters.dateRange[1];
    const numMonths = ((endDate.getFullYear() - startDate.getFullYear()) * 12) + (endDate.getMonth() - startDate.getMonth()) + 1;
    
    // Ensure numMonths is positive and reasonable, default to 6 if calculation is off
    const monthsToGenerate = Math.max(1, Math.min(12, numMonths));

    return generateTrendData(filteredExpenses, monthsToGenerate, endDate);
  }, [filteredExpenses, filters.dateRange]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Export chart as PNG
  const exportChart = () => {
    const canvas = document.getElementById('trend-analysis-chart') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'trend-analysis.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };

  // Calculate trend metrics
  const trendMetrics = useMemo(() => {
    if (trendData.length < 2) return null;
    
    const currentMonth = trendData[trendData.length - 1];
    const previousMonth = trendData[trendData.length - 2];
    const firstMonth = trendData[0];
    
    const monthlyChange = ((currentMonth.total - previousMonth.total) / previousMonth.total) * 100;
    const overallChange = ((currentMonth.total - firstMonth.total) / firstMonth.total) * 100;
    const averageSpend = trendData.reduce((sum, month) => sum + month.total, 0) / trendData.length;
    
    return {
      monthlyChange,
      overallChange,
      averageSpend,
      currentMonth: currentMonth.total,
      highestMonth: Math.max(...trendData.map(m => m.total)),
      lowestMonth: Math.min(...trendData.map(m => m.total)),
    };
  }, [trendData]);
  
  // Prepare chart data with enhanced styling
  const chartData = useMemo(() => {
    // Get all categories that have data
    const categories = mockData.categories.filter(category => 
      trendData.some(month => month.byCategory[category.id])
    );
    
    return {
      labels: trendData.map(month => month.month),
      datasets: [
        // Total line with gradient
        {
          label: 'Total Spend',
          data: trendData.map(month => month.total),
          borderColor: theme.isDarkMode ? '#60A5FA' : '#3B82F6',
          backgroundColor: (context: any) => {
            const chart = context.chart;
            const {ctx, chartArea} = chart;
            if (!chartArea) return null;
            
            const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            gradient.addColorStop(0, theme.isDarkMode ? 'rgba(96, 165, 250, 0.3)' : 'rgba(59, 130, 246, 0.3)');
            gradient.addColorStop(1, theme.isDarkMode ? 'rgba(96, 165, 250, 0.05)' : 'rgba(59, 130, 246, 0.05)');
            return gradient;
          },
          borderWidth: 3,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: theme.isDarkMode ? '#60A5FA' : '#3B82F6',
          pointBorderColor: theme.isDarkMode ? '#1F2937' : '#FFFFFF',
          pointBorderWidth: 2,
          fill: true,
          yAxisID: 'y',
        },
        // Category lines with enhanced styling
        ...categories.map((category, index) => ({
          label: category.name,
          data: trendData.map(month => month.byCategory[category.id] || 0),
          borderColor: category.color,
          backgroundColor: category.color + '15',
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: category.color,
          pointBorderColor: theme.isDarkMode ? '#1F2937' : '#FFFFFF',
          pointBorderWidth: 1,
          fill: false,
          yAxisID: 'y1',
          borderDash: index % 2 === 1 ? [5, 5] : [],
        })),
      ],
    };
  }, [trendData, theme.isDarkMode]);
  
  // Chart options with enhanced styling
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index' as const,
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            boxWidth: 12,
            padding: 20,
            color: theme.isDarkMode ? '#D1D5DB' : '#4B5563',
            font: {
              size: 12,
              weight: '500',
            },
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: theme.isDarkMode ? '#1f2937' : '#ffffff',
          titleColor: theme.isDarkMode ? '#f9fafb' : '#111827',
          bodyColor: theme.isDarkMode ? '#d1d5db' : '#374151',
          borderColor: theme.isDarkMode ? '#374151' : '#e5e7eb',
          borderWidth: 1,
          cornerRadius: 8,
          displayColors: true,
          callbacks: {
            label: (context: any) => {
              const value = context.raw;
              return ` ${context.dataset.label}: ${formatCurrency(value)}`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: {
            display: false,
            drawBorder: false,
          },
          ticks: {
            color: theme.isDarkMode ? '#9CA3AF' : '#6B7280',
            font: {
              size: 11,
              weight: '500',
            },
          },
        },
        y: {
          type: 'linear' as const,
          display: true,
          position: 'left' as const,
          grid: {
            color: theme.isDarkMode ? '#374151' : '#E5E7EB',
            drawBorder: false,
          },
          ticks: {
            color: theme.isDarkMode ? '#9CA3AF' : '#6B7280',
            font: {
              size: 11,
              weight: '500',
            },
            callback: function(value: number | string) {
              return formatCurrency(Number(value));
            },
          },
        },
        y1: {
          type: 'linear' as const,
          display: false,
          position: 'right' as const,
          grid: {
            drawOnChartArea: false,
          },
        },
      },
      elements: {
        point: {
          hoverBorderWidth: 3,
        },
        line: {
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const,
        },
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart' as const,
      },
    };
  }, [theme.isDarkMode]);
  
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
              Trend Analysis
            </h2>
            <p className={`text-sm ${
              theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Spending trends by category over time
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

        {/* Trend Metrics */}
        {trendMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${
                  trendMetrics.monthlyChange >= 0 ? 'text-red-500' : 'text-green-500'
                }`} />
                <span className={`text-sm font-medium ${
                  theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Monthly Change
                </span>
              </div>
              <div className={`text-lg font-bold ${
                trendMetrics.monthlyChange >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {trendMetrics.monthlyChange >= 0 ? '+' : ''}{trendMetrics.monthlyChange.toFixed(1)}%
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Activity className={`w-4 h-4 ${
                  theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-sm font-medium ${
                  theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Average Spend
                </span>
              </div>
              <div className={`text-lg font-bold ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatCurrency(trendMetrics.averageSpend)}
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar className={`w-4 h-4 ${
                  theme.isDarkMode ? 'text-purple-400' : 'text-purple-600'
                }`} />
                <span className={`text-sm font-medium ${
                  theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Current Month
                </span>
              </div>
              <div className={`text-lg font-bold ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatCurrency(trendMetrics.currentMonth)}
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className={`w-4 h-4 ${
                  trendMetrics.overallChange >= 0 ? 'text-orange-500' : 'text-green-500'
                }`} />
                <span className={`text-sm font-medium ${
                  theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Period Change
                </span>
              </div>
              <div className={`text-lg font-bold ${
                trendMetrics.overallChange >= 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'
              }`}>
                {trendMetrics.overallChange >= 0 ? '+' : ''}{trendMetrics.overallChange.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
        
        <div className="h-96" id="trend-analysis-chart">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;