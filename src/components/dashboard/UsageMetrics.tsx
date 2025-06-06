import React, { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip
} from 'chart.js';
import { Download } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { calculateExpensesByService, calculateUnitEconomics, filterExpenses } from '../../utils/dataTransformers';
import mockData from '../../utils/mockData';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const UsageMetrics: React.FC = () => {
  const { filters } = useFilters();
  const { theme } = useTheme();
  const [selectedService, setSelectedService] = useState<string>('');
  
  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(mockData.expenses, filters);
  }, [filters]);
  
  // Get services for dropdown
  const serviceOptions = useMemo(() => {
    return calculateExpensesByService(filteredExpenses)
      .slice(0, 10); // Only show top 10
  }, [filteredExpenses]);
  
  // Filter expenses by selected service
  const serviceExpenses = useMemo(() => {
    if (!selectedService) {
      return filteredExpenses;
    }
    return filteredExpenses.filter(expense => expense.serviceId === selectedService);
  }, [filteredExpenses, selectedService]);
  
  // Calculate unit economics
  const unitEconomics = useMemo(() => {
    return calculateUnitEconomics(serviceExpenses);
  }, [serviceExpenses]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: amount < 0.01 ? 6 : 2,
      maximumFractionDigits: amount < 0.01 ? 6 : 2,
    }).format(amount);
  };
  
  // Format number with commas
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };
  
  // Export chart as PNG
  const exportChart = () => {
    const canvas = document.getElementById('usage-metrics-chart') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'usage-metrics.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };
  
  // Get service name
  const getServiceName = (serviceId: string) => {
    const service = mockData.services.find(s => s.id === serviceId);
    return service ? service.name : 'All Services';
  };
  
  // Prepare chart data
  const chartData = useMemo(() => {
    const metricTypes = Object.keys(unitEconomics);
    const serviceName = selectedService ? 
      getServiceName(selectedService) : 'All Services';
    
    return {
      labels: metricTypes.map(type => type.replace('-', ' ')),
      datasets: [
        {
          label: `${serviceName} - Cost per Unit`,
          data: metricTypes.map(type => unitEconomics[type]),
          backgroundColor: theme.isDarkMode ? '#3B82F680' : '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 1,
        },
      ],
    };
  }, [unitEconomics, selectedService, theme.isDarkMode]);
  
  // Chart options
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
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
              return ` ${formatCurrency(value)} per unit`;
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
          grid: {
            color: theme.isDarkMode ? '#374151' : '#E5E7EB',
            drawBorder: false,
          },
          ticks: {
            color: theme.isDarkMode ? '#9CA3AF' : '#6B7280',
            callback: (value: number) => {
              return formatCurrency(value);
            },
          },
        },
      },
    };
  }, [theme.isDarkMode]);
  
  // Sum up total usage by metric type
  const totalUsageByType = useMemo(() => {
    const totals: Record<string, number> = {};
    
    serviceExpenses.forEach(expense => {
      expense.usageMetrics.forEach(metric => {
        if (!totals[metric.type]) {
          totals[metric.type] = 0;
        }
        totals[metric.type] += metric.value;
      });
    });
    
    return totals;
  }, [serviceExpenses]);
  
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
              Usage Metrics
            </h2>
            <p className={`text-sm ${
              theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Cost per unit metrics
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
        
        <div className="mb-6">
          <label htmlFor="service-filter" className="block text-sm font-medium mb-1 dark:text-gray-300">
            Select Service
          </label>
          <select
            id="service-filter"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="w-full p-2 border rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="">All Services</option>
            {serviceOptions.map(service => (
              <option key={service.serviceId} value={service.serviceId}>
                {service.serviceName}
              </option>
            ))}
          </select>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {Object.entries(unitEconomics).slice(0, 3).map(([metricType, unitCost]) => (
            <div 
              key={metricType}
              className={`p-4 rounded-md ${
                theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}
            >
              <div className="text-sm mb-1 capitalize dark:text-gray-300">
                {metricType.replace('-', ' ')}
              </div>
              <div className="font-medium text-lg dark:text-white">
                {formatCurrency(unitCost)}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                per unit ({formatNumber(totalUsageByType[metricType] || 0)} units)
              </div>
            </div>
          ))}
        </div>
        
        <div className="h-64 md:h-80" id="usage-metrics-chart">
          <Bar data={chartData} options={chartOptions} />
        </div>
      </div>
    </div>
  );
};

export default UsageMetrics;