
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useData } from '../contexts/DataContext';

interface DatePickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (date: Date) => void;
  initialDate?: Date;
  title?: string;
  minDate?: Date;
  maxDate?: Date;
}

const ITEM_HEIGHT = 40; // Height of each wheel item in px

interface WheelProps {
  items: { label: string | number; value: any }[];
  selectedValue: any;
  onChange: (value: any) => void;
}

const Wheel: React.FC<WheelProps> = ({ items, selectedValue, onChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isScrolling = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scroll to selected value on mount or when value changes externally
  useLayoutEffect(() => {
    if (containerRef.current && !isScrolling.current) {
      const index = items.findIndex(item => item.value === selectedValue);
      if (index !== -1) {
        containerRef.current.scrollTop = index * ITEM_HEIGHT;
      }
    }
  }, [selectedValue, items]);

  const handleScroll = () => {
    if (!containerRef.current) return;
    
    isScrolling.current = true;
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    // Calculate center index
    const scrollTop = containerRef.current.scrollTop;
    const index = Math.round(scrollTop / ITEM_HEIGHT);
    
    // Snap visually by debouncing the state update
    timeoutRef.current = setTimeout(() => {
      isScrolling.current = false;
      if (index >= 0 && index < items.length) {
        // Snap to exact position
        containerRef.current?.scrollTo({
            top: index * ITEM_HEIGHT,
            behavior: 'smooth'
        });
        
        if (items[index].value !== selectedValue) {
            onChange(items[index].value);
        }
      }
    }, 100);
  };

  return (
    <div className="relative h-[200px] w-full overflow-hidden group">
      {/* Selection Highlight / Center Bar */}
      <div className="absolute top-[80px] left-0 right-0 h-[40px] border-t border-b border-gray-200 dark:border-slate-600 pointer-events-none z-10"></div>
      
      {/* Scroll Container */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-auto overflow-x-hidden no-scrollbar snap-y snap-mandatory py-[80px] touch-pan-y"
        onScroll={handleScroll}
      >
        {items.map((item, i) => (
          <div 
            key={i} 
            className={`h-[40px] w-full flex items-center justify-center snap-center transition-all duration-200 select-none cursor-pointer ${
                item.value === selectedValue 
                ? 'text-lg font-bold text-black dark:text-white opacity-100 scale-110' 
                : 'text-base text-gray-400 dark:text-slate-500 opacity-60 scale-95'
            }`}
            onClick={() => {
                containerRef.current?.scrollTo({
                    top: i * ITEM_HEIGHT,
                    behavior: 'smooth'
                });
                onChange(item.value);
            }}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
};

const DatePicker: React.FC<DatePickerProps> = ({ isOpen, onClose, onSelect, initialDate, title = 'Date', minDate, maxDate }) => {
  const { t } = useData();
  const [selectedDate, setSelectedDate] = useState(initialDate || new Date());

  useEffect(() => {
    if (isOpen && initialDate) {
        setSelectedDate(initialDate);
    }
  }, [isOpen, initialDate]);

  const months = [
    { label: 'January', value: 0 },
    { label: 'February', value: 1 },
    { label: 'March', value: 2 },
    { label: 'April', value: 3 },
    { label: 'May', value: 4 },
    { label: 'June', value: 5 },
    { label: 'July', value: 6 },
    { label: 'August', value: 7 },
    { label: 'September', value: 8 },
    { label: 'October', value: 9 },
    { label: 'November', value: 10 },
    { label: 'December', value: 11 },
  ];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 40 }, (_, i) => {
      const val = currentYear - 20 + i;
      return { label: val, value: val };
  });

  const days = Array.from({ length: getDaysInMonth(selectedDate.getFullYear(), selectedDate.getMonth()) }, (_, i) => {
      return { label: i + 1, value: i + 1 };
  });

  const handleMonthChange = (monthIndex: number) => {
      const newDate = new Date(selectedDate);
      newDate.setMonth(monthIndex);
      // Adjust if day is out of range (e.g., Feb 30)
      const daysInNewMonth = getDaysInMonth(newDate.getFullYear(), monthIndex);
      if (newDate.getDate() > daysInNewMonth) {
          newDate.setDate(daysInNewMonth);
      }
      setSelectedDate(newDate);
  };

  const handleDayChange = (day: number) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(day);
      setSelectedDate(newDate);
  };

  const handleYearChange = (year: number) => {
      const newDate = new Date(selectedDate);
      newDate.setFullYear(year);
       // Adjust for leap years if needed
       const daysInNewMonth = getDaysInMonth(year, newDate.getMonth());
       if (newDate.getDate() > daysInNewMonth) {
           newDate.setDate(daysInNewMonth);
       }
      setSelectedDate(newDate);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 w-[90%] max-w-sm rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800">
            <span className="text-gray-900 dark:text-white font-medium text-lg">{title}</span>
            <span className="text-blue-600 dark:text-blue-400 font-medium text-lg">
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
        </div>

        {/* Picker Body */}
        <div className="relative grid grid-cols-3 gap-0 bg-gray-50 dark:bg-slate-900/50 h-[220px]">
            {/* Gradient Overlays for Fade Effect */}
            <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white via-white/80 to-transparent dark:from-slate-800 dark:via-slate-800/80 pointer-events-none z-10"></div>
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-800 dark:via-slate-800/80 pointer-events-none z-10"></div>

            <Wheel 
                items={months.map(m => ({ label: m.label, value: m.value }))}
                selectedValue={selectedDate.getMonth()}
                onChange={handleMonthChange}
            />
            <Wheel 
                items={days}
                selectedValue={selectedDate.getDate()}
                onChange={handleDayChange}
            />
            <Wheel 
                items={years}
                selectedValue={selectedDate.getFullYear()}
                onChange={handleYearChange}
            />
        </div>

        {/* Footer Actions */}
        <div className="grid grid-cols-2 border-t border-gray-100 dark:border-slate-700">
            <button 
                onClick={onClose}
                className="py-4 text-gray-500 dark:text-slate-400 font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
                {t('Cancel')}
            </button>
            <button 
                onClick={() => {
                    onSelect(selectedDate);
                    onClose();
                }}
                className="py-4 text-blue-600 dark:text-blue-400 font-bold hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border-l border-gray-100 dark:border-slate-700"
            >
                {t('Confirm')}
            </button>
        </div>
      </div>
    </div>
  );
};

export default DatePicker;
