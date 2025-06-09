import React, { useMemo, useState } from 'react';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { filterExpenses, generateCostAllocationData } from '../../utils/dataTransformers';
import { mockData, categories } from '../../utils/mockData.ts';
import { Category, CostAllocationNode, Expense } from '../../types';
import { useAWSCosts } from '../../context/AWSCostContext';
import { Chart as ChartJS } from 'chart.js';
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap';
import { Chart } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(TreemapController, TreemapElement);

const CostAllocation: React.FC = () => {
  const { filters } = useFilters();
  const { theme } = useTheme();
  const { costSummary: awsCostSummary } = useAWSCosts();
  const [currentNode, setCurrentNode] = useState<CostAllocationNode | null>(null);
  const [nodePath, setNodePath] = useState<CostAllocationNode[]>([]);
  
  // Filter expenses based on current filters (mock data)
  const filteredMockExpenses = useMemo(() => {
    return filterExpenses(mockData.expenses, filters);
  }, [filters]);

  // Combine mock and AWS expenses
  const combinedExpenses = useMemo(() => {
    let combined: Expense[] = [...filteredMockExpenses];

    if (awsCostSummary) {
      Object.entries(awsCostSummary.costsByService).forEach(([serviceName, data]) => {
        const awsExpense: Expense = {
          id: `aws-${serviceName}-${Date.now()}`,
          timestamp: awsCostSummary.timeRange.end,
          amount: data.cost,
          serviceId: serviceName,
          serviceName: serviceName,
          categoryId: 'cat-1',
          categoryName: 'Cloud Infrastructure',
          teamId: 'aws-team',
          teamName: 'Cloud Providers',
          projectId: 'aws-project',
          projectName: 'AWS Infrastructure',
          environment: 'prod',
          tags: ['aws', 'cloud'],
          usageMetrics: [],
        };
        combined.push(awsExpense);
      });
    }
    console.log('CostAllocation: combinedExpenses:', combined.map(e => ({ serviceName: e.serviceName, amount: e.amount, categoryId: e.categoryId })));
    return combined;
  }, [filteredMockExpenses, awsCostSummary]);
  
  // Generate treemap data from combined expenses
  const treeData = useMemo(() => {
    const data = generateCostAllocationData(combinedExpenses);
    console.log('CostAllocation: treeData:', JSON.stringify(data, null, 2));
    return data;
  }, [combinedExpenses]);
  
  // Current view data (root or drilled down)
  const viewData = useMemo(() => {
    const data = currentNode || treeData;
    console.log('CostAllocation: viewData:', JSON.stringify(data, null, 2));
    return data;
  }, [currentNode, treeData]);
  
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate the percentage of total for a node
  const calculatePercentage = (value: number) => {
    const total = treeData.value;
    return total > 0 ? ((value / total) * 100).toFixed(1) : '0';
  };
  
  // Handle drill down
  const handleDrillDown = (node: CostAllocationNode) => {
    if (node.children && node.children.length > 0) {
      setNodePath([...nodePath, viewData]);
      setCurrentNode(node);
    }
  };
  
  // Handle drill up
  const handleDrillUp = () => {
    if (nodePath.length > 0) {
      const newPath = [...nodePath];
      const parent = newPath.pop();
      setNodePath(newPath);
      setCurrentNode(parent || null);
    }
  };
  
  // Handle reset to root
  const handleReset = () => {
    setNodePath([]);
    setCurrentNode(null);
  };
  
  // Export data as CSV
  const exportCSV = () => {
    const rows: string[][] = [];
    rows.push(['Team', 'Project', 'Category', 'Service', 'Amount']);
    const addData = (node: CostAllocationNode, path: string[] = []) => {
      if (!node.children || node.children.length === 0) {
        const row = [...path, node.name, node.value.toString()];
        rows.push(row);
      } else {
        const newPath = [...path, node.name];
        node.children.forEach(child => {
          addData(child, newPath);
        });
      }
    };
    addData(treeData, []);
    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cost-allocation.csv';
    link.click();
  };
  
  // Treemap Data preparation
  const treemapData = useMemo(() => {
    if (!viewData || !viewData.children) return [];

    const data = viewData.children.map(node => ({
      value: node.value,
      _data: { // Custom data for tooltip and labels
        name: node.name,
        id: node.id,
        path: nodePath.map(n => n.name).join(' / ') + (nodePath.length > 0 ? ' / ' : '') + node.name,
        isLeaf: !node.children || node.children.length === 0,
        children: node.children,
      },
    }));

    return data;
  }, [viewData, nodePath]);

  // Treemap options
  const treemapOptions = useMemo(() => ({
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          title: (items: any) => {
            if (!items || items.length === 0 || !items[0].raw || !items[0].raw._data) {
              return '';
            }
            return items[0].raw._data.path;
          },
          label: (item: any) => {
            if (!item.raw || !item.raw._data) {
              return '';
            }
            const data = item.raw._data;
            const name = data.name || 'N/A';
            const value = data.value !== undefined && !isNaN(data.value) ? data.value : 0;

            return [
              `Name: ${name}`,
              `Amount: ${formatCurrency(value)}`,
              `Percentage: ${calculatePercentage(value)}%`,
            ];
          },
        },
      },
      legend: {
        display: false,
      },
    },
    onClick: (e: any, elements: any) => {
      if (elements.length > 0) {
        const clickedElement = elements[0];
        const rawData = clickedElement.element?.$context?.raw?._data;
        if (rawData && !rawData.isLeaf) {
          handleDrillDown(rawData); // Pass the clickedNodeData directly
        }
      }
    },
    parsing: {
      key: 'value',
      children: 'children'
    },
    color: {
      tree: true,
      // Callback to determine background color based on category
      // For root and team levels, we might want a different color strategy
      // For project and category levels, use category colors from mockData
      // For service leaves, use a default/gradient color if no specific category color applies
      // Note: `context.raw` refers to the original data object for the current node
      // `context.dataIndex` refers to the index in the current data array
      // `context.dataset.data[context.dataIndex]` gives the value
      // `context.dataset.data[context.dataIndex]._data` gives our custom data
      // Treemap nodes have an `_data` property with the original `CostAllocationNode`
      // For children of a node, context.raw._data contains the relevant properties
      
      // The `value` property will be the `amount` of the Expense
      // The `_data` property will be our custom object from `treemapData` useMemo
      
      // New logic for color based on node level and category
      // Using a slightly different approach for context as it's ChartJS Treemap specific
      // context.raw.categoryId might not be directly available for intermediate nodes
      // We rely on the _data.id or _data.categoryId of the deepest available node

      // Treemap context.raw provides the item from `treemapData`
      getBackgroundColor: (context: any) => {
        if (!context.raw || !context.raw._data) return theme.isDarkMode ? '#4B5563' : '#E5E7EB';
        const nodeData = context.raw._data;

        if (nodeData.isLeaf) {
          // For leaf nodes (services), try to get category color
          const category = categories.find((cat: Category) => cat.id === nodeData.categoryId);
          return category?.color || (theme.isDarkMode ? '#60a5fa' : '#3B82F6'); // Default blue for leaves
        } else if (nodeData.children && nodeData.children.length > 0) {
          // For parent nodes, try to find a representative category color from children
          const firstChildCategory = categories.find((cat: Category) => cat.id === nodeData.children[0].categoryId);
          return firstChildCategory?.color + '80' || (theme.isDarkMode ? '#4B556360' : '#E5E7EB60'); // Lighter shade for parents
        }
        return theme.isDarkMode ? '#4B5563' : '#E5E7EB'; // Fallback
      },
    },
    labels: {
      align: 'left',
      display: true,
      formatter: (context: any) => {
        if (!context.raw || !context.raw._data) return '';
        const data = context.raw._data;
        const name = data.name || 'N/A';
        const value = data.value !== undefined && !isNaN(data.value) ? data.value : 0;

        if (value === 0 && !data.children) return ''; // Hide labels for zero-value leaf nodes

        return [
          name,
          formatCurrency(value),
        ];
      },
      font: {
        size: 12,
      },
      color: theme.isDarkMode ? '#F9FAFB' : '#111827',
    },
  }), [formatCurrency, calculatePercentage, handleDrillDown, theme.isDarkMode]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!combinedExpenses.length) return {
      datasets: [{
        data: [],
        tree: []
      }]
    };

    // Group expenses by category first, then by service
    const categoryGroups = new Map<string, { 
      value: number; 
      children: { 
        id: string; 
        value: number; 
        name: string;
        category: string;
      }[] 
    }>();

    combinedExpenses.forEach(expense => {
      const category = expense.categoryName;
      const service = expense.serviceName;
      const amount = expense.amount;

      if (!categoryGroups.has(category)) {
        categoryGroups.set(category, { value: 0, children: [] });
      }

      const categoryGroup = categoryGroups.get(category)!;
      categoryGroup.value += amount;

      const existingService = categoryGroup.children.find(s => s.name === service);
      if (existingService) {
        existingService.value += amount;
      } else {
        categoryGroup.children.push({
          id: expense.serviceId,
          value: amount,
          name: service,
          category: category
        });
      }
    });

    // Convert to treemap data structure
    const tree = Array.from(categoryGroups.entries()).map(([category, data]) => ({
      id: category,
      value: data.value,
      name: category,
      children: data.children
    }));

    return {
      datasets: [{
        data: [],
        tree,
        key: 'value',
        groups: ['name'],
        spacing: 2,
        backgroundColor: (context: any) => {
          const data = context.raw;
          if (!data) return theme.isDarkMode ? '#374151' : '#E5E7EB';
          return getCategoryColor(data.category || data.name);
        },
        borderWidth: 1,
        borderColor: theme.isDarkMode ? '#374151' : '#E5E7EB',
        labels: {
          display: true,
          align: 'center' as const,
          formatter: (ctx: any) => {
            const data = ctx.raw;
            if (!data) return '';
            return [
              data.name,
              formatCurrency(data.value)
            ];
          },
          color: theme.isDarkMode ? '#F3F4F6' : '#1F2937',
          font: {
            size: 12,
            weight: 'bold' as const
          },
          padding: 8
        }
      }]
    };
  }, [combinedExpenses, theme.isDarkMode]);

  // Chart options
  const chartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            title: (context: any) => {
              const data = context[0].raw;
              return data.name;
            },
            label: (context: any) => {
              const data = context.raw;
              return `Cost: ${formatCurrency(data.value)}`;
            }
          }
        }
      },
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      }
    };
  }, [theme.isDarkMode]);

  // Color scheme for categories
  const getCategoryColor = (category: string) => {
    const colors = {
      'Cloud Infrastructure': theme.isDarkMode ? '#3B82F6' : '#60A5FA',
      'AI/ML Services': theme.isDarkMode ? '#10B981' : '#34D399',
      'Observability': theme.isDarkMode ? '#8B5CF6' : '#A78BFA'
    };
    return colors[category as keyof typeof colors] || (theme.isDarkMode ? '#6B7280' : '#9CA3AF');
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
              Cost Allocation
            </h2>
            <p className={`text-sm ${
              theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {nodePath.length > 0 ? (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleDrillUp}
                    className="text-blue-500 hover:text-blue-600"
                  >
                    ← Back
                  </button>
                  <span>
                    {nodePath.map((node, index) => (
                      <span key={node.id}>
                        {index > 0 && ' / '}
                        {node.name}
                      </span>
                    ))}
                  </span>
                </div>
              ) : (
                'Cost distribution by category and service'
              )}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {nodePath.length > 0 && (
              <button
                onClick={handleReset}
                className={`p-2 rounded-md ${
                  theme.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } transition-colors duration-150`}
                aria-label="Reset view"
              >
                <ZoomIn size={16} />
              </button>
            )}
            
            <button
              onClick={exportCSV}
              className={`p-2 rounded-md ${
                theme.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              } transition-colors duration-150`}
              aria-label="Export data"
            >
              <Download size={16} />
            </button>
          </div>
        </div>
        
        <div className="h-[400px] relative">
          {chartData.datasets[0].tree.length > 0 ? (
            <Chart
              type="treemap"
              data={chartData}
              options={{
                ...chartOptions,
                onClick: (event, elements) => {
                  if (elements && elements.length > 0) {
                    const element = elements[0];
                    const datasetIndex = element.datasetIndex;
                    const index = element.index;
                    const data = chartData.datasets[datasetIndex].tree[index];
                    if (data && data.children) {
                      handleDrillDown(data);
                    }
                  }
                }
              }}
              id="cost-allocation-chart"
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center ${
              theme.isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              No cost data available
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostAllocation;