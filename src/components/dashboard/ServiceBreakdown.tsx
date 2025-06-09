import React, { useCallback, useMemo, useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js';
import { Download } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { calculateExpensesByCategory, calculateExpensesByService, filterExpenses } from '../../utils/dataTransformers';
import { mockData, categories } from '../../utils/mockData.ts';
import { useAWSCosts } from '../../context/AWSCostContext';
import { ExpenseByService, Expense, Environment, Category } from '../../types';

// Register ChartJS components
ChartJS.register(ArcElement, Tooltip, Legend);

const ServiceBreakdown: React.FC = () => {
  const { filters } = useFilters();
  const { theme } = useTheme();
  const { costSummary: awsCostSummary } = useAWSCosts();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(mockData.expenses, filters);
  }, [filters]);
  
  // Calculate expenses by category
  const expensesByCategory = useMemo(() => {
    const allExpenses: Expense[] = [...filteredExpenses];

    // Add AWS expenses to calculate categories if available
    if (awsCostSummary) {
      Object.entries(awsCostSummary.costsByService).forEach(([serviceName, data]) => {
        // Assuming 'aws-category' is defined in mockData or types as 'Cloud Infrastructure'
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
    return calculateExpensesByCategory(allExpenses);
  }, [filteredExpenses, awsCostSummary]);
  
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
          // Check if service already exists from mock data to aggregate costs
          const existingServiceIndex = combinedServices.findIndex(s => s.serviceName === serviceName);
          if (existingServiceIndex !== -1) {
            combinedServices[existingServiceIndex].amount += data.cost;
          } else {
            combinedServices.push({
              serviceId: serviceName, // Using serviceName as ID for AWS services
              serviceName: serviceName,
              amount: data.cost,
            });
          }
        }
      });
    }

    // Sort and limit to top 5
    return combinedServices.sort((a, b) => b.amount - a.amount).slice(0, 5);
  }, [filteredExpenses, selectedCategory, awsCostSummary]);
  
  // Get category name
  const getCategoryName = useCallback((categoryId: string | null) => {
    if (!categoryId) {
      // If no category is selected, return a combined name or the first category if available
      if (expensesByCategory.length > 0) {
        return expensesByCategory.map(cat => cat.categoryName).join(', ');
      }
      return 'All Categories'; // Fallback if no categories exist
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
  
  // Prepare chart data
  const chartData = useMemo(() => {
    return {
      labels: expensesByService.map(service => service.serviceName),
      datasets: [
        {
          data: expensesByService.map(service => service.amount),
          backgroundColor: [
            '#3B82F6', // blue
            '#10B981', // green
            '#8B5CF6', // purple
            '#F59E0B', // amber
            '#EC4899', // pink
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [expensesByService]);
  
  // Chart options
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const value = context.raw;
              return ` ${formatCurrency(value)}`;
            },
          },
        },
      },
      cutout: '65%',
    };
  }, []); // Removed theme.isDarkMode from dependency array as it doesn't affect chart options
  
  // Calculate total amount
  const totalAmount = useMemo(() => {
    return expensesByService.reduce((sum, service) => sum + service.amount, 0);
  }, [expensesByService]);
  
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
            className={`p-2 rounded-md ${
              theme.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            } transition-colors duration-150`}
            aria-label="Export chart"
          >
            <Download size={16} />
          </button>
        </div>
        
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3">
            <div className="mb-4">
              <label htmlFor="category-filter" className="block text-sm font-medium mb-1 dark:text-gray-300">
                Filter by Category
              </label>
              <select
                id="category-filter"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value || null)}
                className="w-full p-2 border rounded-md text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                {expensesByCategory.map(category => (
                  <option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-3">
              <div className={`p-3 rounded-md ${
                theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <div className="text-sm mb-1 dark:text-gray-300">
                  {getCategoryName(selectedCategory)}
                </div>
                <div className="font-medium text-lg dark:text-white">
                  {formatCurrency(totalAmount)}
                </div>
              </div>
              
              {expensesByService.map((service, index) => (
                <div 
                  key={service.serviceId}
                  className={`p-3 rounded-md ${
                    theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center flex-grow min-w-0">
                      <span 
                        className="inline-block w-3 h-3 rounded-full mr-2 flex-shrink-0"
                        style={{ 
                          backgroundColor: [
                            '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899'
                          ][index % 5] 
                        }}
                      ></span>
                      <span className="text-sm truncate dark:text-gray-300">
                        {service.serviceName}
                      </span>
                    </div>
                    <div className="font-medium dark:text-white flex-shrink-0">
                      {formatCurrency(service.amount)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="md:w-2/3 h-80">
            <Doughnut data={chartData} options={chartOptions} id="service-breakdown-chart" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBreakdown;