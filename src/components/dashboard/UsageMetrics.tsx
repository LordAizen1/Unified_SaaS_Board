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
import { Download, Filter, BarChart3, Zap, DollarSign } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { calculateUnitEconomics, filterExpenses } from '../../utils/dataTransformers';
import mockData from '../../utils/mockData';
import { useAWSCosts } from '../../context/AWSCostContext';
import { useVercelCosts } from '../../context/VercelCostContext';
import { Expense, Environment } from '../../types';

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
      { id: 'all-services', name: 'All Services' },
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
      const subServiceCosts: Record<string, number> = {};
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

  // Enhanced color palette for bars
  const generateBarColors = (count: number) => {
    const baseColors = [
      '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
      '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
    ];
    
    return Array.from({ length: count }, (_, i) => {
      const baseColor = baseColors[i % baseColors.length];
      return {
        backgroundColor: baseColor + '80', // 50% opacity
        borderColor: baseColor,
        hoverBackgroundColor: baseColor + 'CC', // 80% opacity
        hoverBorderColor: baseColor,
      };
    });
  };

  // Prepare chart data with enhanced styling
  const chartData = useMemo(() => {
    const labels = Object.keys(unitEconomics);
    const data = Object.values(unitEconomics);
    const colors = generateBarColors(labels.length);
    
    const datasetLabel = selectedService === 'all-services'
      ? 'Cost per Main Service'
      : `${getDisplayTitle} - Cost per Sub-Service`;

    return {
      labels: labels,
      datasets: [
        {
          label: datasetLabel,
          data: data,
          backgroundColor: colors.map(c => c.backgroundColor),
          borderColor: colors.map(c => c.borderColor),
          hoverBackgroundColor: colors.map(c => c.hoverBackgroundColor),
          hoverBorderColor: colors.map(c => c.hoverBorderColor),
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
  }, [unitEconomics, selectedService, getDisplayTitle]);
  
  // Chart options with enhanced styling
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
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
            font: {
              size: 11,
              weight: '500',
            },
            maxRotation: 45,
          },
        },
        y: {
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
      },
      animation: {
        duration: 1000,
        easing: 'easeInOutQuart' as const,
      },
      elements: {
        bar: {
          borderWidth: 2,
        },
      },
    };
  }, [theme.isDarkMode, formatCurrency]);

  // Calculate additional metrics
  const additionalMetrics = useMemo(() => {
    const values = Object.values(unitEconomics);
    if (values.length === 0) return null;
    
    const total = values.reduce((sum, val) => sum + val, 0);
    const average = total / values.length;
    const highest = Math.max(...values);
    const lowest = Math.min(...values);
    
    return { total, average, highest, lowest };
  }, [unitEconomics]);
  
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
              Usage Metrics
            </h2>
            <p className={`text-sm ${
              theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Cost analysis by service
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
              theme.isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <Filter className={`w-4 h-4 ${
                theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <select
                value={selectedService}
                onChange={(e) => setSelectedService(e.target.value)}
                className={`bg-transparent border-none text-sm font-medium focus:outline-none ${
                  theme.isDarkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {serviceOptions.map(option => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
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
        </div>
        
        {/* Metrics Summary */}
        {additionalMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className={`w-4 h-4 ${
                  theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`} />
                <span className={`text-sm font-medium ${
                  theme.isDarkMode ? 'text-blue-300' : 'text-blue-700'
                }`}>
                  Total Cost
                </span>
              </div>
              <div className={`text-lg font-bold ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatCurrency(additionalMetrics.total)}
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className={`w-4 h-4 ${
                  theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <span className={`text-sm font-medium ${
                  theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Average
                </span>
              </div>
              <div className={`text-lg font-bold ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatCurrency(additionalMetrics.average)}
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-green-500/10 border-green-500/20' : 'bg-green-50 border-green-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <Zap className={`w-4 h-4 ${
                  theme.isDarkMode ? 'text-green-400' : 'text-green-600'
                }`} />
                <span className={`text-sm font-medium ${
                  theme.isDarkMode ? 'text-green-300' : 'text-green-700'
                }`}>
                  Highest
                </span>
              </div>
              <div className={`text-lg font-bold ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatCurrency(additionalMetrics.highest)}
              </div>
            </div>

            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className={`w-4 h-4 ${
                  theme.isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`} />
                <span className={`text-sm font-medium ${
                  theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Lowest
                </span>
              </div>
              <div className={`text-lg font-bold ${
                theme.isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {formatCurrency(additionalMetrics.lowest)}
              </div>
            </div>
          </div>
        )}

        <div className="h-96" id="usage-metrics-chart">
          {Object.keys(unitEconomics).length > 0 ? (
            <Bar data={chartData} options={chartOptions} />
          ) : (
            <div className={`flex items-center justify-center h-full ${
              theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <div className="text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                <p className="text-sm">No usage metrics available for the selected service/period.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UsageMetrics;