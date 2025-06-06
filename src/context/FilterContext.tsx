import { addMonths, subMonths } from 'date-fns';
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Environment, FilterState } from '../types';

interface FilterContextType {
  filters: FilterState;
  setDateRange: (range: [Date, Date]) => void;
  setCategories: (categories: string[]) => void;
  setTeams: (teams: string[]) => void;
  setProjects: (projects: string[]) => void;
  setEnvironments: (environments: Environment[]) => void;
  setSearchQuery: (query: string) => void;
  resetFilters: () => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

// Default filter state
const defaultFilters: FilterState = {
  dateRange: [subMonths(new Date(), 6), new Date()],
  categories: [],
  teams: [],
  projects: [],
  environments: ['dev', 'staging', 'prod'],
  searchQuery: '',
};

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<FilterState>(defaultFilters);
  
  // Filter update handlers
  const setDateRange = useCallback((range: [Date, Date]) => {
    setFilters(prev => ({ ...prev, dateRange: range }));
  }, []);
  
  const setCategories = useCallback((categories: string[]) => {
    setFilters(prev => ({ ...prev, categories }));
  }, []);
  
  const setTeams = useCallback((teams: string[]) => {
    setFilters(prev => ({ ...prev, teams }));
  }, []);
  
  const setProjects = useCallback((projects: string[]) => {
    setFilters(prev => ({ ...prev, projects }));
  }, []);
  
  const setEnvironments = useCallback((environments: Environment[]) => {
    setFilters(prev => ({ ...prev, environments }));
  }, []);
  
  const setSearchQuery = useCallback((searchQuery: string) => {
    setFilters(prev => ({ ...prev, searchQuery }));
  }, []);
  
  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);
  
  // Load filters from localStorage on mount
  useEffect(() => {
    try {
      const savedFilters = localStorage.getItem('expenseFilters');
      if (savedFilters) {
        const parsedFilters = JSON.parse(savedFilters);
        // Convert date strings back to Date objects
        parsedFilters.dateRange = [
          new Date(parsedFilters.dateRange[0]),
          new Date(parsedFilters.dateRange[1])
        ];
        setFilters(parsedFilters);
      }
    } catch (error) {
      console.error('Error loading filters from localStorage:', error);
    }
  }, []);
  
  // Save filters to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('expenseFilters', JSON.stringify(filters));
    } catch (error) {
      console.error('Error saving filters to localStorage:', error);
    }
  }, [filters]);
  
  return (
    <FilterContext.Provider
      value={{
        filters,
        setDateRange,
        setCategories,
        setTeams,
        setProjects,
        setEnvironments,
        setSearchQuery,
        resetFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = (): FilterContextType => {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
};