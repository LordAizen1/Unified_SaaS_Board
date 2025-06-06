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
import { Download } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { filterExpenses, generateTrendData } from '../../utils/dataTransformers';
import mockData from '../../utils/mockData';

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
  
  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(mockData.expenses, filters);
  }, [filters]);
  
  // Generate monthly trend data
  const trendData = useMemo(() => {
    return generateTrendData(filteredExpenses, 6);
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
  
  // Prepare chart data
  const chartData = useMemo(() => {
    // Get all categories that have data
    const categories = mockData.categories.filter(category => 
      trendData.some(month => month.byCategory[category.id])
    );
    
    return {
      labels: trendData.map(month => month.month),
      datasets: [
        // Total line
        {
          label: 'Total',
          data: trendData.map(month => month.total),
          borderColor: theme.isDarkMode ? '#F9FAFB' : '#111827',
          backgroundColor: 'transparent',
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 3,
          pointBackgroundColor: theme.isDarkMode ? '#F9FAFB' : '#111827',
          pointBorderColor: theme.isDarkMode ? '#F9FAFB' : '#111827',
          borderDash: [],
          yAxisID: 'y',
        },
        // Category lines
        ...categories.map(category => ({
          label: category.name,
          data: trendData.map(month => month.byCategory[category.id] || 0),
          borderColor: category.color,
          backgroundColor: category.color + '20', // Add transparency
          borderWidth: 1.5,
          tension: 0.1,
          pointRadius: 0,
          fill: true,
          yAxisID: 'y1',
        })),
      ],
    };
  }, [trendData, theme.isDarkMode]);
  
  // Chart options
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
            padding: 15,
            color: theme.isDarkMode ? '#D1D5DB' : '#4B5563',
          },
        },
        tooltip: {
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
    };
  }, [theme.isDarkMode]);
  
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
              Trend Analysis
            </h2>
            <p className={`text-sm ${
              theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Last 6 months spending by category
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
        
        <div className="h-80" id="trend-analysis-chart">
          <Line data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default TrendAnalysis;