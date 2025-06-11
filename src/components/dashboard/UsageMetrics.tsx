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
import { calculateUnitEconomics, filterExpenses } from '../../utils/dataTransformers';
import mockData from '../../utils/mockData';
import { useAWSCosts } from '../../context/AWSCostContext';
import { useVercelCosts } from '../../context/VercelCostContext';
import { Expense, Environment } from '../../types';
import { AWSCostSummary } from '../../types/aws';

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
  const { costSummary: awsCostSummary } = useAWSCosts();
  const { costSummary: vercelCostSummary } = useVercelCosts();
  const [selectedService, setSelectedService] = useState<string>('all-services');

  // Define the main services for the dropdown
  const mainServices = useMemo(() => {
    return [
      { id: 'all-services', name: 'All Services' }, // Option for aggregated view
      { id: 'aws', name: 'AWS' },
      { id: 'vercel', name: 'Vercel' },
      { id: 'gcp', name: 'GCP' },
      { id: 'anthropic', name: 'Anthropic' },
      { id: 'datadog', name: 'Datadog' },
      { id: 'openai', name: 'OpenAI' },
    ];
  }, []);

  // Combine mock, AWS, and Vercel expenses for usage metrics
  const combinedExpenses = useMemo(() => {
    let allRawExpenses: Expense[] = [...mockData.expenses];

    // Add AWS expenses
    if (awsCostSummary) {
      Object.entries(awsCostSummary.costsByDate).forEach(([date, dailyServiceCosts]) => {
        dailyServiceCosts.forEach(item => {
          const awsCategory = mockData.categories.find(cat => cat.name === 'Cloud Infrastructure');
          if (awsCategory) {
            allRawExpenses.push({
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
              tags: ['aws', 'cloud', 'usage'],
              usageMetrics: [
                { type: `aws-${item.serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-cost`, value: 1 }
              ],
            });
          }
        });
      });
    }

    // Add Vercel expenses
    if (vercelCostSummary) {
      Object.entries(vercelCostSummary.costsByDate).forEach(([date, dailyServiceCosts]) => {
        dailyServiceCosts.forEach(item => {
          const vercelCategory = mockData.categories.find(cat => cat.name === 'Cloud Infrastructure');
          if (vercelCategory) {
            allRawExpenses.push({
              id: `vercel-${item.serviceName}-${date}`,
              timestamp: date,
              amount: parseFloat(item.cost.toFixed(2)),
              serviceId: item.serviceName,
              serviceName: item.serviceName,
              categoryId: vercelCategory.id,
              categoryName: vercelCategory.name,
              teamId: 'vercel-team',
              teamName: 'Cloud Providers',
              projectId: 'vercel-project',
              projectName: 'Vercel Metrics',
              environment: 'prod' as Environment,
              tags: ['vercel', 'cloud', 'usage'],
              usageMetrics: [
                { type: `vercel-${item.serviceName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-cost`, value: 1 }
              ],
            });
          }
        });
      });
    }

    const filteredCombined = filterExpenses(allRawExpenses, filters);
    return filteredCombined;
  }, [filters, awsCostSummary, vercelCostSummary]);

  // Get service options for the dropdown
  const serviceOptions = useMemo(() => {
    return mainServices;
  }, [mainServices]);

  // Filter expenses by selected service
  const serviceExpenses = useMemo(() => {
    let filtered: Expense[] = [];
    if (selectedService === 'all-services') {
      filtered = combinedExpenses;
    } else if (selectedService === 'aws') {
      filtered = combinedExpenses.filter(expense => 
        expense.categoryId === 'cat-1' && expense.tags.includes('aws')
      );
    } else if (selectedService === 'vercel') {
      filtered = combinedExpenses.filter(expense => 
        expense.categoryId === 'cat-1' && expense.tags.includes('vercel')
      );
    } else if (selectedService === 'gcp') {
      filtered = combinedExpenses.filter(expense => expense.serviceId === 'gcp');
    } else if (selectedService === 'anthropic') {
      filtered = combinedExpenses.filter(expense => expense.serviceId === 'anthropic');
    } else if (selectedService === 'datadog') {
      filtered = combinedExpenses.filter(expense => expense.serviceId === 'datadog');
    } else if (selectedService === 'openai') {
      filtered = combinedExpenses.filter(expense => expense.serviceId === 'openai');
    }
    return filtered;
  }, [combinedExpenses, selectedService]);

  // Calculate unit economics based on the filtered service expenses
  const unitEconomics = useMemo(() => {
    if (selectedService === 'all-services') {
      // Aggregate costs by main service categories
      const aggregatedCosts: Record<string, number> = {};

      mainServices.filter(s => s.id !== 'all-services').forEach(mainService => {
        let totalCostForMainService = 0;
        if (mainService.id === 'aws') {
          combinedExpenses.filter(expense => expense.categoryId === 'cat-1').forEach(expense => {
            totalCostForMainService += expense.amount;
          });
        } else if (mainService.id === 'gcp') {
          combinedExpenses.filter(expense => expense.serviceId === 'gcp').forEach(expense => {
            totalCostForMainService += expense.amount;
          });
        } else if (mainService.id === 'anthropic') {
          combinedExpenses.filter(expense => expense.serviceId === 'anthropic').forEach(expense => {
            totalCostForMainService += expense.amount;
          });
        } else if (mainService.id === 'datadog') {
          combinedExpenses.filter(expense => expense.serviceId === 'datadog').forEach(expense => {
            totalCostForMainService += expense.amount;
          });
        } else if (mainService.id === 'openai') {
          combinedExpenses.filter(expense => expense.serviceId === 'openai').forEach(expense => {
            totalCostForMainService += expense.amount;
          });
        } else {
           // For other mock data services, if they exist outside the main categories
           combinedExpenses.filter(expense => {
            const service = mockData.services.find(s => s.id === expense.serviceId);
            // Ensure we're only including mock services not explicitly listed as main services
            return service && !mainServices.some(ms => ms.id === expense.serviceId);
           }).forEach(expense => {
              totalCostForMainService += expense.amount;
           });
        }
        aggregatedCosts[mainService.name] = totalCostForMainService;
      });
      return aggregatedCosts;

    } else {
      // When a specific main service is selected, calculate unit economics for its sub-services.
      const subServiceCosts: Record<string, number> = {}; // Changed to number for simplicity
      serviceExpenses.forEach(expense => {
        // Group by sub-service name
        subServiceCosts[expense.serviceName] = (subServiceCosts[expense.serviceName] || 0) + expense.amount;
      });
      return subServiceCosts;
    }
  }, [combinedExpenses, serviceExpenses, selectedService, mainServices]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: amount < 0.01 && amount !== 0 ? 6 : 0,
      maximumFractionDigits: amount < 0.01 && amount !== 0 ? 6 : 0,
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
  
  // Get service name for title/label
  const getDisplayTitle = useMemo(() => {
    if (selectedService === 'all-services') {
      return 'All Services';
    }
    return mainServices.find(s => s.id === selectedService)?.name || 'Selected Service';
  }, [selectedService, mainServices]);

  const getDisplayValue = useMemo(() => {
    const total = Object.values(unitEconomics).reduce((sum, cost) => sum + cost, 0);
    return formatCurrency(total);
  }, [unitEconomics, formatCurrency]);

  // Prepare chart data
  const chartData = useMemo(() => {
    const labels = Object.keys(unitEconomics);
    const data = Object.values(unitEconomics);
    
    const datasetLabel = selectedService === 'all-services'
      ? 'Cost per Main Service'
      : `${getDisplayTitle} - Cost per Sub-Service`;

    return {
      labels: labels,
      datasets: [
        {
          label: datasetLabel,
          data: data,
          backgroundColor: theme.isDarkMode ? '#3B82F680' : '#3B82F6',
          borderColor: '#2563EB',
          borderWidth: 1,
        },
      ],
    };
  }, [unitEconomics, selectedService, getDisplayTitle, theme.isDarkMode]);
  
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
              const label = context.label;
              return ` ${label}: ${formatCurrency(value)}`;
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
            callback: function(value: number | string) {
              return formatCurrency(Number(value));
            },
          },
        },
      },
    };
  }, [theme.isDarkMode, formatCurrency]);
  
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
              Cost per unit analysis
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className={`block w-full rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${theme.isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300'}`}
            >
              {serviceOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>

            <button
              onClick={exportChart}
              className={`p-2 rounded-md ${theme.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors duration-150`}
              aria-label="Export chart"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <div className={`p-4 rounded-md shadow ${theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <p className={`text-sm font-medium ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Total {getDisplayTitle} Cost</p>
            <p className={`text-xl font-bold ${theme.isDarkMode ? 'text-white' : 'text-gray-900'}`}>{getDisplayValue}</p>
          </div>
        </div>

        <div className="h-80">
          {Object.keys(unitEconomics).length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className={`flex items-center justify-center h-full ${theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              No usage metrics available for the selected service/period.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageMetrics;