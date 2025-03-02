import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronRight, ChevronDown, X } from 'lucide-react';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';

export type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

export type DateRangePreset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom';

interface DateRangePickerProps {
  dateRange: DateRange;
  onDateRangeChange: (range: DateRange) => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  dateRange,
  onDateRangeChange,
  className = ''
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const datePickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateRangeChange = (preset: DateRangePreset) => {
    if (preset === 'custom') {
      setDateRangePreset('custom');
      return;
    }

    const now = new Date();
    let start: Date;
    let end: Date;
    let label: string;
    
    switch (preset) {
      case 'today':
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        label = 'Today';
        break;
      case 'yesterday':
        const yesterday = subDays(now, 1);
        start = new Date(yesterday);
        start.setHours(0, 0, 0, 0);
        end = new Date(yesterday);
        end.setHours(23, 59, 59, 999);
        label = 'Yesterday';
        break;
      case 'thisWeek':
        start = startOfWeek(now, { weekStartsOn: 1 });
        end = new Date(now);
        label = 'This Week';
        break;
      case 'lastWeek':
        const lastWeek = subDays(now, 7);
        start = startOfWeek(lastWeek, { weekStartsOn: 1 });
        end = endOfWeek(lastWeek, { weekStartsOn: 1 });
        label = 'Last Week';
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = new Date(now);
        label = 'This Month';
        break;
      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        label = 'Last Month';
        break;
      case 'thisYear':
        start = startOfYear(now);
        end = new Date(now);
        label = 'This Year';
        break;
      case 'lastYear':
        const lastYear = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        start = startOfYear(lastYear);
        end = endOfYear(lastYear);
        label = 'Last Year';
        break;
      case 'allTime':
        start = new Date('0001-01-01');
        end = new Date('9999-12-31');
        label = 'All Time';
        break;
      default:
        start = startOfMonth(now);
        end = new Date(now);
        label = 'This Month';
    }
    
    setDateRangePreset(preset);
    onDateRangeChange({ start, end, label });
    setShowDatePicker(false);
  };

  const applyCustomDateRange = () => {
    if (!customStartDate || !customEndDate) {
      return;
    }
    
    // Create new date objects and set proper times
    const start = new Date(customStartDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(customEndDate);
    end.setHours(23, 59, 59, 999);
    
    // Ensure end date is not before start date
    if (end < start) {
      return;
    }
    
    onDateRangeChange({
      start,
      end,
      label: `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
    });
    
    setShowDatePicker(false);
  };

  return (
    <div className={`relative date-range-picker ${className}`} ref={datePickerRef}>
      <button
        onClick={() => setShowDatePicker(!showDatePicker)}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-700 border border-gray-700 rounded-md hover:bg-gray-650 text-white text-xs min-w-[180px]"
      >
        <Calendar size={14} className="text-gray-400" />
        <span className="flex-1 text-left truncate">{dateRange.label}</span>
        <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showDatePicker ? 'rotate-180' : ''}`} />
      </button>

      {showDatePicker && (
        <div 
          className="absolute right-0 mt-2 w-72 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center p-3 border-b border-gray-700">
            <h3 className="text-sm font-medium text-white">Date Range</h3>
            <button
              onClick={() => setShowDatePicker(false)}
              className="p-1 hover:bg-gray-700 rounded-md"
            >
              <X size={14} className="text-gray-400" />
            </button>
          </div>
          <div className="p-3 border-b border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleDateRangeChange('today')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                Today
              </button>
              <button
                onClick={() => handleDateRangeChange('yesterday')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'yesterday' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                Yesterday
              </button>
              <button
                onClick={() => handleDateRangeChange('thisWeek')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'thisWeek' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                This Week
              </button>
              <button
                onClick={() => handleDateRangeChange('lastWeek')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'lastWeek' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                Last Week
              </button>
              <button
                onClick={() => handleDateRangeChange('thisMonth')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'thisMonth' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                This Month
              </button>
              <button
                onClick={() => handleDateRangeChange('lastMonth')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'lastMonth' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                Last Month
              </button>
              <button
                onClick={() => handleDateRangeChange('thisYear')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'thisYear' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                This Year
              </button>
              <button
                onClick={() => handleDateRangeChange('lastYear')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'lastYear' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                Last Year
              </button>
              <button
                onClick={() => handleDateRangeChange('allTime')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'allTime' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                All Time
              </button>
              <button
                onClick={() => setDateRangePreset('custom')}
                className={`px-3 py-2 text-xs rounded-md transition-colors ${dateRangePreset === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
              >
                Custom Range
              </button>
            </div>
          </div>

          {dateRangePreset === 'custom' && (
            <div className="p-3" onClick={(e) => e.stopPropagation()}>
              <div className="space-y-3">
                <div className="relative">
                  <label htmlFor="startDate" className="block text-xs font-medium text-gray-400 mb-1">
                    Start Date
                  </label>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      id="startDate"
                      value={customStartDate}
                      max={customEndDate}
                      onChange={(e) => {
                        e.stopPropagation();
                        setCustomStartDate(e.target.value);
                      }}
                      onFocus={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label htmlFor="endDate" className="block text-xs font-medium text-gray-400 mb-1">
                    End Date
                  </label>
                  <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="date"
                      id="endDate"
                      value={customEndDate}
                      min={customStartDate}
                      onChange={(e) => {
                        e.stopPropagation();
                        setCustomEndDate(e.target.value);
                      }}
                      onFocus={(e) => e.stopPropagation()}
                      onClick={(e) => e.stopPropagation()}
                      className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDateRangePreset('thisMonth');
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-700 hover:bg-gray-650 text-gray-300 rounded-md transition-colors text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      applyCustomDateRange();
                    }}
                    disabled={!customStartDate || !customEndDate}
                    className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply Range
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 