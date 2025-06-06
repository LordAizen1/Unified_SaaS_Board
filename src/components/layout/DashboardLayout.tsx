import React from 'react';
import { useTheme } from '../../context/ThemeContext';
import DashboardHeader from './DashboardHeader';
import FilterBar from '../filters/FilterBar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { theme } = useTheme();
  
  return (
    <div className={`min-h-screen flex flex-col ${
      theme.isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    } transition-colors duration-200`}>
      <DashboardHeader />
      
      <main className="flex-grow px-4 md:px-6 lg:px-8 py-6 max-w-screen-2xl mx-auto w-full">
        <div className="mb-6">
          <FilterBar />
        </div>
        
        <div className="space-y-6">
          {children}
        </div>
      </main>
      
      <footer className={`py-4 px-6 ${
        theme.isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-500'
      } border-t ${
        theme.isDarkMode ? 'border-gray-700' : 'border-gray-200'
      } transition-colors duration-200`}>
        <div className="max-w-screen-2xl mx-auto text-sm">
          <p>© 2025 Expense Analytics Dashboard</p>
        </div>
      </footer>
    </div>
  );
};

export default DashboardLayout;