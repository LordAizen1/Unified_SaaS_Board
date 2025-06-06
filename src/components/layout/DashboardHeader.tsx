import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const DashboardHeader: React.FC = () => {
  const { theme, toggleDarkMode } = useTheme();
  
  return (
    <header className={`sticky top-0 z-10 ${
      theme.isDarkMode ? 'bg-gray-800' : 'bg-white'
    } border-b ${
      theme.isDarkMode ? 'border-gray-700' : 'border-gray-200'
    } transition-colors duration-200`}>
      <div className="max-w-screen-2xl mx-auto px-4 md:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">E</span>
            </div>
            <h1 className={`text-xl font-bold ${
              theme.isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Expense Analytics
            </h1>
          </div>
          
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded-full ${
              theme.isDarkMode 
                ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            } transition-colors duration-150`}
            aria-label={theme.isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme.isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;