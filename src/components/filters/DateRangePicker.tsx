import { addMonths, format, subMonths } from 'date-fns';
import React from 'react';
import { useFilters } from '../../context/FilterContext';

interface DateRangePickerProps {
  onClose: () => void;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({ onClose }) => {
  const { filters, setDateRange } = useFilters();
  
  // Predefined date ranges
  const dateRanges = [
    { 
      label: 'Last 30 days', 
      range: [subMonths(new Date(), 1), new Date()] as [Date, Date] 
    },
    { 
      label: 'Last 90 days', 
      range: [subMonths(new Date(), 3), new Date()] as [Date, Date] 
    },
    { 
      label: 'Last 6 months', 
      range: [subMonths(new Date(), 6), new Date()] as [Date, Date] 
    },
    { 
      label: 'Last 12 months', 
      range: [subMonths(new Date(), 12), new Date()] as [Date, Date] 
    },
    { 
      label: 'Year to date', 
      range: [new Date(new Date().getFullYear(), 0, 1), new Date()] as [Date, Date] 
    },
    { 
      label: 'All time', 
      range: [subMonths(new Date(), 24), new Date()] as [Date, Date] 
    },
  ];
  
  const handleRangeSelect = (range: [Date, Date]) => {
    setDateRange(range);
    onClose();
  };
  
  // Check if a range is currently selected
  const isRangeSelected = (range: [Date, Date]) => {
    return (
      format(filters.dateRange[0], 'yyyy-MM-dd') === format(range[0], 'yyyy-MM-dd') &&
      format(filters.dateRange[1], 'yyyy-MM-dd') === format(range[1], 'yyyy-MM-dd')
    );
  };
  
  return (
    <div className="p-4">
      <h3 className="font-medium text-gray-900 dark:text-white mb-3">Select Date Range</h3>
      <div className="space-y-2">
        {dateRanges.map((item, index) => (
          <button
            key={index}
            onClick={() => handleRangeSelect(item.range)}
            className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
              isRangeSelected(item.range)
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <div className="font-medium">{item.label}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {format(item.range[0], 'MMM d, yyyy')} - {format(item.range[1], 'MMM d, yyyy')}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateRangePicker;