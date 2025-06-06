import React from 'react';
import { Category } from '../../types';
import { useFilters } from '../../context/FilterContext';

interface CategoryFilterProps {
  categories: Category[];
  onClose: () => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ categories, onClose }) => {
  const { filters, setCategories } = useFilters();
  
  const handleCategoryToggle = (categoryId: string) => {
    if (filters.categories.includes(categoryId)) {
      setCategories(filters.categories.filter(id => id !== categoryId));
    } else {
      setCategories([...filters.categories, categoryId]);
    }
  };
  
  const handleSelectAll = () => {
    setCategories(categories.map(category => category.id));
  };
  
  const handleClearAll = () => {
    setCategories([]);
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-900 dark:text-white">Categories</h3>
        <div className="space-x-2 text-xs">
          <button
            onClick={handleSelectAll}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Select All
          </button>
          <span className="text-gray-500">|</span>
          <button
            onClick={handleClearAll}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {categories.map(category => (
          <div key={category.id} className="flex items-center">
            <input
              type="checkbox"
              id={`category-${category.id}`}
              checked={filters.categories.includes(category.id)}
              onChange={() => handleCategoryToggle(category.id)}
              className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4
                dark:bg-gray-700 dark:border-gray-600"
            />
            <label
              htmlFor={`category-${category.id}`}
              className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center"
            >
              <span 
                className="inline-block w-3 h-3 rounded-full mr-2" 
                style={{ backgroundColor: category.color }}
              ></span>
              {category.name}
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

export default CategoryFilter;