import React, { useCallback, useState } from 'react';
import { Calendar, CheckSquare, Filter, Search, X } from 'lucide-react';
import { useFilters } from '../../context/FilterContext';
import { format } from 'date-fns';
import mockData from '../../utils/mockData';
import DateRangePicker from './DateRangePicker';
import CategoryFilter from './CategoryFilter';
import TeamProjectFilter from './TeamProjectFilter';
import EnvironmentFilter from './EnvironmentFilter';

const FilterBar: React.FC = () => {
  const { 
    filters, 
    setSearchQuery,
    resetFilters 
  } = useFilters();
  
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(false);
  const [isTeamFilterOpen, setIsTeamFilterOpen] = useState(false);
  const [isEnvironmentFilterOpen, setIsEnvironmentFilterOpen] = useState(false);
  
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, [setSearchQuery]);
  
  // Count active filters (excluding date range and environments which are always set)
  const activeFilterCount = 
    filters.categories.length + 
    filters.teams.length + 
    filters.projects.length + 
    (filters.searchQuery ? 1 : 0);
  
  return (
    <div className="relative">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-gray-400" />
          </div>
          <input
            type="text"
            value={filters.searchQuery}
            onChange={handleSearchChange}
            placeholder="Search expenses..."
            className="w-full pl-10 pr-4 py-2 border rounded-md text-sm
              dark:bg-gray-800 dark:border-gray-700 dark:text-white
              focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
            className="flex items-center gap-1 px-3 py-2 text-sm border rounded-md
              hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800
              transition-colors duration-150"
          >
            <Calendar size={16} />
            <span>
              {format(filters.dateRange[0], 'MMM d, yyyy')} - {format(filters.dateRange[1], 'MMM d, yyyy')}
            </span>
          </button>
          
          <button
            onClick={() => setIsCategoryFilterOpen(!isCategoryFilterOpen)}
            className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-md
              hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800
              transition-colors duration-150 ${
                filters.categories.length > 0 ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : ''
              }`}
          >
            <Filter size={16} />
            <span>Categories {filters.categories.length > 0 ? `(${filters.categories.length})` : ''}</span>
          </button>
          
          <button
            onClick={() => setIsTeamFilterOpen(!isTeamFilterOpen)}
            className={`flex items-center gap-1 px-3 py-2 text-sm border rounded-md
              hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800
              transition-colors duration-150 ${
                filters.teams.length > 0 || filters.projects.length > 0 ? 
                'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' : ''
              }`}
          >
            <CheckSquare size={16} />
            <span>Teams & Projects {
              (filters.teams.length > 0 || filters.projects.length > 0) ? 
              `(${filters.teams.length + filters.projects.length})` : ''
            }</span>
          </button>
          
          <button
            onClick={() => setIsEnvironmentFilterOpen(!isEnvironmentFilterOpen)}
            className="flex items-center gap-1 px-3 py-2 text-sm border rounded-md
              hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800
              transition-colors duration-150"
          >
            <Filter size={16} />
            <span>Environments ({filters.environments.length})</span>
          </button>
          
          {activeFilterCount > 0 && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 border border-red-200
                bg-red-50 rounded-md hover:bg-red-100
                dark:text-red-400 dark:border-red-900 dark:bg-red-900/20 dark:hover:bg-red-900/30
                transition-colors duration-150"
            >
              <X size={16} />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Date Range Picker Dropdown */}
      {isDatePickerOpen && (
        <div className="absolute z-10 mt-2 w-auto bg-white border rounded-md shadow-lg
          dark:bg-gray-800 dark:border-gray-700">
          <DateRangePicker onClose={() => setIsDatePickerOpen(false)} />
        </div>
      )}
      
      {/* Category Filter Dropdown */}
      {isCategoryFilterOpen && (
        <div className="absolute z-10 mt-2 w-64 bg-white border rounded-md shadow-lg
          dark:bg-gray-800 dark:border-gray-700">
          <CategoryFilter 
            categories={mockData.categories}
            onClose={() => setIsCategoryFilterOpen(false)} 
          />
        </div>
      )}
      
      {/* Team/Project Filter Dropdown */}
      {isTeamFilterOpen && (
        <div className="absolute z-10 mt-2 w-72 bg-white border rounded-md shadow-lg
          dark:bg-gray-800 dark:border-gray-700">
          <TeamProjectFilter 
            teams={mockData.teams}
            projects={mockData.projects}
            onClose={() => setIsTeamFilterOpen(false)} 
          />
        </div>
      )}
      
      {/* Environment Filter Dropdown */}
      {isEnvironmentFilterOpen && (
        <div className="absolute z-10 mt-2 w-64 bg-white border rounded-md shadow-lg
          dark:bg-gray-800 dark:border-gray-700">
          <EnvironmentFilter 
            onClose={() => setIsEnvironmentFilterOpen(false)} 
          />
        </div>
      )}
    </div>
  );
};

export default FilterBar;