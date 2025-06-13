import React, { useCallback, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Download, Filter, TrendingUp, BarChart3 } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { calculateExpensesByCategory, calculateExpensesByService, filterExpenses } from '../../utils/dataTransformers';
import { mockData, categories } from '../../utils/mockData.ts';
import { useAWSCosts } from '../../context/AWSCostContext';
import { useVercelCosts } from '../../context/VercelCostContext';
import { ExpenseByService, Expense, Environment, Category } from '../../types';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const ServiceBreakdown: React.FC = () => {
  const { filters } = useFilters();
  const { theme } = useTheme();
  const { costSummary: awsCostSummary } = useAWSCosts();
  const { costSummary: vercelCostSummary } = useVercelCosts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(mockData.expenses, filters);
  }, [filters]);
  
  // Calculate expenses by category
  const expensesByCategory = useMemo(() => {
    const allExpenses: Expense[] = [...filteredExpenses];

    // Add AWS expenses
    if (awsCostSummary) {
      Object.entries(awsCostSummary.costsByService).forEach(([serviceName, data]) => {
        const awsCategory = categories.find((cat: Category) => cat.name === 'Cloud Infrastructure');
        if (awsCategory) {
          allExpenses.push({
            id: `aws-${serviceName}`,
            timestamp: awsCostSummary.timeRange.end,
            amount: data.cost,
            serviceId: serviceName,
            serviceName: serviceName,
            categoryId: awsCategory.id,
            categoryName: awsCategory.name,
            teamId: 'aws-team',
            teamName: 'Cloud Providers',
            projectId: 'aws-project',
            projectName: 'AWS Infrastructure',
            environment: 'prod' as Environment,
            tags: ['aws', 'cloud'],
            usageMetrics: [],
          });
        }
      });
    }

    // Add Vercel expenses
    if (vercelCostSummary) {
      Object.entries(vercelCostSummary.costsByService).forEach(([serviceName, data]) => {
        const vercelCategory = categories.find((cat: Category) => cat.name === 'Cloud Infrastructure');
        if (vercelCategory) {
          allExpenses.push({
            id: `vercel-${serviceName}`,
            timestamp: vercelCostSummary.timeRange.end,
            amount: data.cost,
            serviceId: serviceName,
            serviceName: serviceName,
            categoryId: vercelCategory.id,
            categoryName: vercelCategory.name,
            teamId: 'vercel-team',
            teamName: 'Cloud Providers',
            projectId: 'vercel-project',
            projectName: 'Vercel Infrastructure',
            environment: 'prod' as Environment,
            tags: ['vercel', 'cloud'],
            usageMetrics: [],
          });
        }
      });
    }

    return calculateExpensesByCategory(allExpenses);
  }, [filteredExpenses, awsCostSummary, vercelCostSummary]);
  
  // Calculate expenses by service (filtered by selected category if any)
  const expensesByService = useMemo(() => {
    let combinedServices: ExpenseByService[] = [];

    // Add mock data services
    const mockServices = calculateExpensesByService(
      filteredExpenses,
      selectedCategory || undefined
    );
    combinedServices = [...mockServices];

    // Add AWS services if available and filter by selected category
    if (awsCostSummary) {
      Object.entries(awsCostSummary.costsByService).forEach(([serviceName, data]) => {
        const awsCategory = categories.find((cat: Category) => cat.name === 'Cloud Infrastructure');
        if (awsCategory && (!selectedCategory || selectedCategory === awsCategory.id)) {
          const existingServiceIndex = combinedServices.findIndex(s => s.serviceName === serviceName);
          if (existingServiceIndex !== -1) {
            combinedServices[existingServiceIndex].amount += data.cost;
          } else {
            combinedServices.push({
              serviceId: serviceName,
              serviceName: serviceName,
              amount: data.cost,
            });
          }
        }
      });
    }

    // Add Vercel services if available and filter by selected category
    if (vercelCostSummary) {
      Object.entries(vercelCostSummary.costsByService).forEach(([serviceName, data]) => {
        const vercelCategory = categories.find((cat: Category) => cat.name === 'Cloud Infrastructure');
        if (vercelCategory && (!selectedCategory || selectedCategory === vercelCategory.id)) {
          const existingServiceIndex = combinedServices.findIndex(s => s.serviceName === serviceName);
          if (existingServiceIndex !== -1) {
            combinedServices[existingServiceIndex].amount += data.cost;
          } else {
            combinedServices.push({
              serviceId: serviceName,
              serviceName: serviceName,
              amount: data.cost,
            });
          }
        }
      });
    }

    // Sort and limit to top 5
    return combinedServices.sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [filteredExpenses, selectedCategory, awsCostSummary, vercelCostSummary]);
  
  // Get category name
  const getCategoryName = useCallback((categoryId: string | null) => {
    if (!categoryId) {
      if (expensesByCategory.length > 0) {
        return expensesByCategory.map(cat => cat.categoryName).join(', ');
      }
      return 'All Categories';
    }
    const category = categories.find((c: Category) => c.id === categoryId);
    return category ? category.name : 'Unknown Category';
  }, [expensesByCategory]);
  
  // Set initial selected category if not already set
  React.useEffect(() => {
    if (!selectedCategory && expensesByCategory.length > 0) {
      setSelectedCategory(expensesByCategory[0].categoryId);
    }
  }, [selectedCategory, expensesByCategory]);
  
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
    const canvas = document.getElementById('service-breakdown-chart') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.download = 'service-breakdown.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    }
  };
  
  // Enhanced color palette
  const colorPalette = [
    '#3B82F6', // blue
    '#10B981', // emerald
    '#8B5CF6', // violet
    '#F59E0B', // amber
    '#EF4444', // red
    '#06B6D4', // cyan
    '#84CC16', // lime
    '#F97316', // orange
  ];
  
  // Prepare chart data with enhanced styling
  const chartData = useMemo(() => {
    return {
      labels: expensesByService.map(service => service.serviceName),
      datasets: [
        {
          data: expensesByService.map(service => service.amount),
          backgroundColor: colorPalette.slice(0, expensesByService.length),
          borderWidth: 0,
          hoverBorderWidth: 3,
          hoverBorderColor: theme.isDarkMode ? '#ffffff' : '#000000',
          hoverOffset: 8,
        },
      ],
    };
  }, [expensesByService, theme.isDarkMode]);
  
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
              const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return ` ${formatCurrency(value)} (${percentage}%)`;
            },
          },
        },
      },
      cutout: '65%',
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1000,
      },
    };
  }, [theme.isDarkMode]);
  
  // Calculate total amount
  const totalAmount = useMemo(() => {
    return expensesByService.reduce((sum, service) => sum + service.amount, 0);
  }, [expensesByService]);
  
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
              Service Breakdown
            </h2>
            <p className={`text-sm ${
              theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Top 5 services by spend
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
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left side - Controls and Legend */}
          <div className="space-y-6">
            {/* Category Filter */}
            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2 mb-3">
                <Filter className={`w-4 h-4 ${
                  theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <label htmlFor="category-filter" className={`text-sm font-medium ${
                  theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  Filter by Category
                </label>
              </div>
              <select
                id="category-filter"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className={`w-full p-3 border rounded-lg text-sm transition-colors ${
                  theme.isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 focus:border-blue-500'
                } focus:ring-2 focus:ring-blue-500/20`}
              >
                {expensesByCategory.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Total Summary */}
            <div className={`p-4 rounded-lg border ${
              theme.isDarkMode ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg ${
                  theme.isDarkMode ? 'bg-blue-500/20' : 'bg-blue-100'
                }`}>
                  <BarChart3 className={`w-5 h-5 ${
                    theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`} />
                </div>
                <div>
                  <div className={`text-sm font-medium ${
                    theme.isDarkMode ? 'text-blue-300' : 'text-blue-700'
                  }`}>
                    {getCategoryName(selectedCategory)}
                  </div>
                  <div className={`text-2xl font-bold ${
                    theme.isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {formatCurrency(totalAmount)}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Service List */}
            <div className="space-y-3">
              {expensesByService.map((service, index) => {
                const percentage = totalAmount > 0 ? (service.amount / totalAmount) * 100 : 0;
                return (
                  <div 
                    key={service.serviceId}
                    className={`p-4 rounded-lg border transition-all duration-200 hover:shadow-md ${
                      theme.isDarkMode ? 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3">
                        <span 
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: colorPalette[index % colorPalette.length] }}
                        />
                        <span className={`font-medium ${
                          theme.isDarkMode ? 'text-gray-200' : 'text-gray-800'
                        }`}>
                          {service.serviceName}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${
                          theme.isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatCurrency(service.amount)}
                        </div>
                        <div className={`text-sm ${
                          theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className={`w-full bg-gray-200 rounded-full h-2 ${
                      theme.isDarkMode ? 'bg-gray-600' : 'bg-gray-200'
                    }`}>
                      <div 
                        className="h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: colorPalette[index % colorPalette.length]
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Right side - Chart */}
          <div className="flex items-center justify-center">
            <div className="relative w-80 h-80">
              {expensesByService.length > 0 ? (
                <>
                  <Doughnut data={chartData} options={chartOptions} id="service-breakdown-chart" />
                  {/* Center label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${
                        theme.isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {formatCurrency(totalAmount)}
                      </div>
                      <div className={`text-sm ${
                        theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        Total Spend
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`flex items-center justify-center h-full ${
                  theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No service data available</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBreakdown;