import React, { useMemo, useState } from 'react';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { useTheme } from '../../context/ThemeContext';
import { filterExpenses, generateCostAllocationData } from '../../utils/dataTransformers';
import mockData from '../../utils/mockData';
import { CostAllocationNode } from '../../types';

const CostAllocation: React.FC = () => {
  const { filters } = useFilters();
  const { theme } = useTheme();
  const [currentNode, setCurrentNode] = useState<CostAllocationNode | null>(null);
  const [nodePath, setNodePath] = useState<CostAllocationNode[]>([]);
  
  // Filter expenses based on current filters
  const filteredExpenses = useMemo(() => {
    return filterExpenses(mockData.expenses, filters);
  }, [filters]);
  
  // Generate treemap data
  const treeData = useMemo(() => {
    return generateCostAllocationData(filteredExpenses);
  }, [filteredExpenses]);
  
  // Current view data (root or drilled down)
  const viewData = useMemo(() => {
    return currentNode || treeData;
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
    // Flatten the tree into rows
    const rows: string[][] = [];
    
    // Add header row
    rows.push(['Team', 'Project', 'Category', 'Service', 'Amount']);
    
    // Recursively add data
    const addData = (node: CostAllocationNode, path: string[] = []) => {
      if (!node.children || node.children.length === 0) {
        // Leaf node (service)
        const row = [...path, node.name, node.value.toString()];
        rows.push(row);
      } else {
        // Add this node's name to the path
        const newPath = [...path, node.name];
        
        // Process children
        node.children.forEach(child => {
          addData(child, newPath);
        });
      }
    };
    
    // Start with the root node
    addData(treeData, []);
    
    // Convert to CSV
    const csv = rows.map(row => row.join(',')).join('\n');
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'cost-allocation.csv';
    link.click();
  };
  
  // Calculate column colors
  const getColumnColor = (index: number, value: number, max: number) => {
    // Base colors for each level
    const baseColors = [
      { light: '#3B82F6', dark: '#2563EB' }, // blue
      { light: '#8B5CF6', dark: '#7C3AED' }, // purple
      { light: '#10B981', dark: '#059669' }, // green
      { light: '#F59E0B', dark: '#D97706' }, // amber
    ];
    
    const colorSet = baseColors[index % baseColors.length];
    const intensity = Math.max(0.3, value / max);
    
    return theme.isDarkMode ? 
      colorSet.dark : 
      colorSet.light;
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
              Hierarchical breakdown of expenses
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {nodePath.length > 0 && (
              <button
                onClick={handleDrillUp}
                className={`p-2 rounded-md ${
                  theme.isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                } transition-colors duration-150`}
                aria-label="Zoom out"
              >
                <ZoomOut size={16} />
              </button>
            )}
            
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
        
        {/* Breadcrumb navigation */}
        {nodePath.length > 0 && (
          <div className="mb-4 flex items-center text-sm flex-wrap">
            <button
              onClick={handleReset}
              className={`hover:underline ${
                theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              Root
            </button>
            
            {nodePath.map((node, index) => (
              <React.Fragment key={`${node.id}-${index}`}>
                <span className="mx-2 text-gray-500">/</span>
                <button
                  onClick={() => {
                    setNodePath(nodePath.slice(0, index + 1));
                    setCurrentNode(node);
                  }}
                  className={`hover:underline ${
                    theme.isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}
                >
                  {node.name}
                </button>
              </React.Fragment>
            ))}
            
            <span className="mx-2 text-gray-500">/</span>
            <span className={`font-medium ${
              theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              {viewData.name}
            </span>
          </div>
        )}
        
        {/* Header row */}
        <div className={`grid grid-cols-12 gap-3 mb-3 text-sm font-medium ${
          theme.isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          <div className="col-span-6">Name</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-2 text-right">% of Total</div>
          <div className="col-span-2"></div>
        </div>
        
        {/* Treemap rows */}
        <div className="space-y-3 overflow-y-auto max-h-96">
          {viewData.children && viewData.children.length > 0 ? (
            viewData.children
              .sort((a, b) => b.value - a.value)
              .map((node, index) => {
                const maxValue = viewData.children ? 
                  Math.max(...viewData.children.map(n => n.value)) : 0;
                
                return (
                  <div 
                    key={node.id}
                    className={`grid grid-cols-12 gap-3 items-center p-3 rounded-md ${
                      theme.isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    } hover:bg-opacity-90 transition-colors duration-150 cursor-pointer`}
                    onClick={() => handleDrillDown(node)}
                  >
                    <div className="col-span-6 flex items-center">
                      <div 
                        className="w-3 h-3 rounded-sm mr-2"
                        style={{ backgroundColor: getColumnColor(index, node.value, maxValue) }}
                      ></div>
                      <div className="truncate font-medium dark:text-white">
                        {node.name}
                      </div>
                    </div>
                    <div className="col-span-2 text-right font-medium dark:text-white">
                      {formatCurrency(node.value)}
                    </div>
                    <div className="col-span-2 text-right text-gray-500 dark:text-gray-400">
                      {calculatePercentage(node.value)}%
                    </div>
                    <div className="col-span-2 flex justify-end">
                      {node.children && node.children.length > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDrillDown(node);
                          }}
                          className={`p-1 rounded-md ${
                            theme.isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          } transition-colors duration-150`}
                          aria-label={`Drill down into ${node.name}`}
                        >
                          <ZoomIn size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              No data available for the current filters
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CostAllocation;