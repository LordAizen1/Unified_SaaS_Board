import React from 'react';
import { Environment } from '../../types';
import { useFilters } from '../../context/FilterContext';

interface EnvironmentFilterProps {
  onClose: () => void;
}

const EnvironmentFilter: React.FC<EnvironmentFilterProps> = ({ onClose }) => {
  const { filters, setEnvironments } = useFilters();
  
  const environments: { value: Environment; label: string; color: string }[] = [
    { value: 'dev', label: 'Development', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
    { value: 'staging', label: 'Staging', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
    { value: 'prod', label: 'Production', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  ];
  
  const handleToggle = (env: Environment) => {
    if (filters.environments.includes(env)) {
      // Prevent deselecting all environments
      if (filters.environments.length > 1) {
        setEnvironments(filters.environments.filter(e => e !== env));
      }
    } else {
      setEnvironments([...filters.environments, env]);
    }
  };
  
  const handleSelectAll = () => {
    setEnvironments(['dev', 'staging', 'prod']);
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white">Environments</h3>
        <button
          onClick={handleSelectAll}
          className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
        >
          Select All
        </button>
      </div>
      
      <div className="space-y-2">
        {environments.map(env => (
          <div key={env.value} className="flex items-center">
            <input
              type="checkbox"
              id={`env-${env.value}`}
              checked={filters.environments.includes(env.value)}
              onChange={() => handleToggle(env.value)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4
                dark:bg-gray-700 dark:border-gray-600"
              disabled={filters.environments.length === 1 && filters.environments.includes(env.value)}
            />
            <label
              htmlFor={`env-${env.value}`}
              className="ml-2 flex items-center"
            >
              <span className={`px-2 py-0.5 rounded-md text-xs ${env.color}`}>
                {env.label}
              </span>
            </label>
          </div>
        ))}
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md
            hover:bg-gray-50 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default EnvironmentFilter;