
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Trash2, Search, RotateCcw, ArrowRight, ArrowUpDown, Filter, X, AlertCircle } from 'lucide-react';
import { Category, Expense, Income, IncomeCategory } from '../types';
import DatePicker from './DatePicker';

interface ExpenseListProps {
  initialCategory?: Category | 'All';
  onNavigateToBudget?: () => void;
}

type TransactionItem = (Expense & { type: 'expense' }) | (Income & { type: 'income' });
type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

interface SwipeableItemProps {
  item: TransactionItem;
  currency: string;
  onDelete: (id: string, type: 'expense' | 'income') => void;
  t: (key: string) => string;
}

const SwipeableItem: React.FC<SwipeableItemProps> = ({ item, currency, onDelete, t }) => {
  const [offsetX, setOffsetX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef<number>(0);
  const itemRef = useRef<HTMLDivElement>(null);
  
  const DELETE_BTN_WIDTH = 80;
  const THRESHOLD = 40;
  const isExpense = item.type === 'expense';

  // Touch Handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const x = e.touches[0].clientX;
    const diff = x - startX.current;
    
    if (diff < 0 && diff > -150) {
      setOffsetX(diff);
    } else if (diff > 0 && offsetX < 0) {
       setOffsetX(Math.min(0, -DELETE_BTN_WIDTH + diff));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (offsetX < -THRESHOLD) {
      setOffsetX(-DELETE_BTN_WIDTH);
    } else {
      setOffsetX(0);
    }
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    startX.current = e.clientX;
    setIsDragging(true);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const x = e.clientX;
    const diff = x - startX.current;
    
    if (diff < 0 && diff > -150) {
      setOffsetX(diff);
    } else if (diff > 0 && offsetX < 0) {
       setOffsetX(Math.min(0, -DELETE_BTN_WIDTH + diff));
    }
  };

  const handleMouseUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (offsetX < -THRESHOLD) {
      setOffsetX(-DELETE_BTN_WIDTH);
    } else {
      setOffsetX(0);
    }
  };

  const handleMouseLeave = () => {
    if (isDragging) {
        setIsDragging(false);
        setOffsetX(0);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-xl mb-3 select-none">
      <div 
        className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-center rounded-r-xl cursor-pointer"
        style={{ width: `${DELETE_BTN_WIDTH}px` }}
        onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id, item.type);
        }}
      >
        <Trash2 className="text-white" size={20} />
      </div>

      <div
        ref={itemRef}
        className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-50 dark:border-slate-700 flex justify-between items-center relative z-10 transition-transform duration-200 ease-out"
        style={{ 
            transform: `translateX(${offsetX}px)`,
            transition: isDragging ? 'none' : 'transform 0.2s ease-out'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <div className="flex items-center space-x-3 pointer-events-none">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0
            ${!isExpense ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' :
              item.category === 'Food' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
              item.category === 'Transport' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'}
          `}>
            {isExpense ? item.category[0] : (item.category === 'Salary' ? '💰' : '📥')}
          </div>
          <div>
            <div className="font-semibold text-gray-800 dark:text-white line-clamp-1">
                {isExpense ? (item as Expense).description : (item as Income).source}
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400">
                {t(item.category)} • {isExpense ? (item as Expense).paymentMethod : (item as Income).recurrence}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4 pointer-events-none">
          <span className={`font-bold ${isExpense ? 'text-red-600 dark:text-red-400' : 'text-teal-600 dark:text-teal-400'}`}>
            {isExpense ? '-' : '+'}{currency}{item.amount.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

const ExpenseList: React.FC<ExpenseListProps> = ({ initialCategory = 'All', onNavigateToBudget }) => {
  const { expenses, incomes, deleteExpense, restoreExpense, deleteIncome, currency, t } = useData();
  const [filterCategories, setFilterCategories] = useState<string[]>(['All']);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sort and Advanced Filters
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [showFilters, setShowFilters] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');

  // Date Picker State
  const [datePickerConfig, setDatePickerConfig] = useState<{
    isOpen: boolean;
    mode: 'start' | 'end';
    initialDate?: Date;
  }>({ isOpen: false, mode: 'start' });
  
  const [deletedItem, setDeletedItem] = useState<{ item: any, type: 'expense' | 'income' } | null>(null);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Long Press Refs
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  useEffect(() => {
    setFilterCategories([initialCategory]);
  }, [initialCategory]);

  const allTransactions = useMemo(() => {
      const exps = expenses.map(e => ({ ...e, type: 'expense' as const }));
      const incs = incomes.map(i => ({ ...i, type: 'income' as const }));
      return [...exps, ...incs];
  }, [expenses, incomes]);

  // Combined Categories for Pills
  const expenseCategories: Category[] = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Housing', 'Other'];
  const incomeCategories: IncomeCategory[] = ['Salary', 'Rent', 'Interest', 'Business', 'Gift'];
  // Deduplicate 'Other' by using Set
  const allCategoryPills = Array.from(new Set([...expenseCategories, ...incomeCategories]));

  const filteredTransactions = useMemo(() => {
      let result = allTransactions;

      // Category Filter
      if (!filterCategories.includes('All')) {
          result = result.filter(item => filterCategories.includes(item.category));
      }

      // Search Filter
      if (searchTerm) {
          result = result.filter(item => {
              const text = item.type === 'expense' ? (item as Expense).description : (item as Income).source;
              return text.toLowerCase().includes(searchTerm.toLowerCase());
          });
      }

      // Date Range Filter
      if (startDate) {
          result = result.filter(item => item.date >= startDate);
      }
      if (endDate) {
          result = result.filter(item => item.date <= endDate);
      }

      // Amount Range Filter
      if (minAmount) {
          result = result.filter(item => item.amount >= parseFloat(minAmount));
      }
      if (maxAmount) {
          result = result.filter(item => item.amount <= parseFloat(maxAmount));
      }

      // Sorting
      return result.sort((a, b) => {
          switch (sortOption) {
              case 'date-desc':
                  return new Date(b.date).getTime() - new Date(a.date).getTime();
              case 'date-asc':
                  return new Date(a.date).getTime() - new Date(b.date).getTime();
              case 'amount-desc':
                  return b.amount - a.amount;
              case 'amount-asc':
                  return a.amount - b.amount;
              default:
                  return 0;
          }
      });
  }, [allTransactions, filterCategories, searchTerm, startDate, endDate, minAmount, maxAmount, sortOption]);

  // Group by date
  const groupedTransactions: Record<string, typeof allTransactions> = {};
  filteredTransactions.forEach(item => {
      const date = new Date(item.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
      if (!groupedTransactions[date]) groupedTransactions[date] = [];
      groupedTransactions[date].push(item);
  });

  const handleDelete = (id: string, type: 'expense' | 'income') => {
    if (type === 'expense') {
        const item = expenses.find(e => e.id === id);
        if (item) {
            setDeletedItem({ item, type });
            deleteExpense(id);
        }
    } else {
         if (confirm(t("Delete this income entry?"))) {
             deleteIncome(id);
         }
         return; 
    }

    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => {
        setDeletedItem(null);
    }, 4000);
  };

  const handleUndo = () => {
    if (deletedItem && deletedItem.type === 'expense') {
        restoreExpense(deletedItem.item);
        setDeletedItem(null);
        if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    }
  };

  const openDatePicker = (mode: 'start' | 'end') => {
      const currentVal = mode === 'start' ? startDate : endDate;
      const initialDate = currentVal ? new Date(currentVal) : new Date();
      setDatePickerConfig({ isOpen: true, mode, initialDate });
  };

  const handleDateSelect = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth();
      const day = date.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      if (datePickerConfig.mode === 'start') {
          setStartDate(dateStr);
      } else {
          setEndDate(dateStr);
      }
  };

  const resetFilters = () => {
      setStartDate('');
      setEndDate('');
      setMinAmount('');
      setMaxAmount('');
  };

  // --- Category Selection Handlers ---

  const handleCategoryClick = (category: string) => {
    if (category === 'All') {
        setFilterCategories(['All']);
    } else {
        setFilterCategories([category]);
    }
  };

  const handleCategoryLongPress = (category: string) => {
      if (category === 'All') return;

      if (navigator.vibrate) {
          navigator.vibrate(50);
      }

      setFilterCategories(prev => {
          // Remove 'All' if it exists, as we are now doing specific selection
          let newCats = prev.filter(c => c !== 'All');
          
          if (newCats.includes(category)) {
              newCats = newCats.filter(c => c !== category);
          } else {
              newCats = [...newCats, category];
          }
          
          // If nothing selected, revert to 'All'
          if (newCats.length === 0) return ['All'];
          return newCats;
      });
  };

  const handleButtonPressStart = (category: string) => {
      isLongPress.current = false;
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      
      longPressTimer.current = setTimeout(() => {
          isLongPress.current = true;
          handleCategoryLongPress(category);
      }, 500); // 500ms for long press
  };

  const handleButtonPressEnd = (category: string, e: React.MouseEvent | React.TouchEvent) => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
      
      if (!isLongPress.current) {
          handleCategoryClick(category);
      } else {
         if (e.cancelable && e.type !== 'touchend') { 
             e.preventDefault(); 
         }
      }
  };

  const handlePressCancel = () => {
      if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
      }
  };

  const hasActiveFilters = startDate || endDate || minAmount || maxAmount;
  const dateError = startDate && endDate && startDate > endDate ? "Start date cannot be after end date" : "";
  const amountError = minAmount && maxAmount && parseFloat(minAmount) > parseFloat(maxAmount) ? "Min amount cannot be greater than max" : "";

  return (
    <div className="h-full flex flex-col animate-fade-in relative bg-gray-50 dark:bg-slate-900 transition-colors">
       {/* Fixed Header & Controls */}
       <div className="shrink-0 px-6 py-6 pb-2 z-10 bg-gray-50 dark:bg-slate-900 transition-colors">
            <header className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('History')}</h1>
                {onNavigateToBudget && (
                    <button 
                        onClick={onNavigateToBudget}
                        className="bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 px-4 py-2 rounded-lg text-sm font-bold flex items-center space-x-1"
                    >
                        <span>{t('Budget')}</span>
                    </button>
                )}
            </header>

            {/* Controls Container */}
            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-3 transition-colors">
                
                {/* Search Bar */}
                <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-slate-400" size={18} />
                        <input 
                            type="text" 
                            placeholder={t('Search transactions...')} 
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-slate-700 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-teal-500 border border-transparent dark:border-slate-600"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Sort & Filter Toggle */}
                    <div className="flex justify-between items-center border-t border-gray-50 dark:border-slate-700 pt-2">
                        <div className="relative flex items-center space-x-2">
                            <ArrowUpDown size={16} className="text-gray-400 dark:text-slate-400" />
                            <select 
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value as SortOption)}
                                className="bg-transparent text-sm font-medium text-gray-700 dark:text-white focus:outline-none pr-6 appearance-none cursor-pointer"
                            >
                                <option value="date-desc">{t('Newest First')}</option>
                                <option value="date-asc">{t('Oldest First')}</option>
                                <option value="amount-desc">{t('Highest Amount')}</option>
                                <option value="amount-asc">{t('Lowest Amount')}</option>
                            </select>
                        </div>

                        <button 
                            onClick={() => setShowFilters(!showFilters)}
                            className={`flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                                showFilters || hasActiveFilters 
                                    ? 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' 
                                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'
                            }`}
                        >
                            <Filter size={14} />
                            <span>{t('Filter')}</span>
                            {hasActiveFilters && <span className="w-2 h-2 bg-teal-500 rounded-full ml-1"></span>}
                        </button>
                    </div>

                    {/* Expandable Filters */}
                    {showFilters && (
                        <div className="pt-2 border-t border-gray-50 dark:border-slate-700 grid grid-cols-2 gap-3 animate-fade-in">
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">{t('From Date')}</label>
                                <button 
                                    onClick={() => openDatePicker('start')}
                                    className={`w-full text-left text-xs p-2 bg-gray-50 dark:bg-slate-700 border ${dateError ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-lg dark:text-white transition-colors truncate`}
                                >
                                    {startDate || t('Select Date')}
                                </button>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">{t('To Date')}</label>
                                <button 
                                    onClick={() => openDatePicker('end')}
                                    className={`w-full text-left text-xs p-2 bg-gray-50 dark:bg-slate-700 border ${dateError ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-lg dark:text-white transition-colors truncate`}
                                >
                                    {endDate || t('Select Date')}
                                </button>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">{t('Min Amount')}</label>
                                <input 
                                    type="number" 
                                    placeholder="0"
                                    value={minAmount}
                                    onChange={(e) => setMinAmount(e.target.value)}
                                    className={`w-full text-xs p-2 bg-gray-50 dark:bg-slate-700 border ${amountError ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-lg dark:text-white transition-colors`}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] text-gray-500 dark:text-slate-400 font-bold uppercase">{t('Max Amount')}</label>
                                <input 
                                    type="number" 
                                    placeholder="Any"
                                    value={maxAmount}
                                    onChange={(e) => setMaxAmount(e.target.value)}
                                    className={`w-full text-xs p-2 bg-gray-50 dark:bg-slate-700 border ${amountError ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-lg dark:text-white transition-colors`}
                                />
                            </div>
                            
                            {(dateError || amountError) && (
                                <div className="col-span-2 text-xs text-red-500 flex items-center">
                                    <AlertCircle size={10} className="mr-1"/> {dateError || amountError}
                                </div>
                            )}
                            
                            {hasActiveFilters && (
                                <div className="col-span-2 flex justify-end">
                                    <button 
                                        onClick={resetFilters}
                                        className="text-xs text-red-500 flex items-center space-x-1 px-2 py-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                    >
                                        <X size={12} />
                                        <span>{t('Clear Filters')}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                
                    {/* Category Pills */}
                    <div className="flex overflow-x-auto no-scrollbar space-x-2 pb-1 w-full flex-nowrap border-t border-gray-50 dark:border-slate-700 pt-2 select-none">
                        <button 
                            onClick={() => handleCategoryClick('All')}
                            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCategories.includes('All') ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}
                        >
                            {t('All')}
                        </button>
                        {allCategoryPills.map(c => (
                            <button
                                key={c}
                                onMouseDown={() => handleButtonPressStart(c)}
                                onMouseUp={(e) => handleButtonPressEnd(c, e)}
                                onMouseLeave={handlePressCancel}
                                onTouchStart={() => handleButtonPressStart(c)}
                                onTouchEnd={(e) => handleButtonPressEnd(c, e)}
                                onTouchMove={handlePressCancel}
                                onContextMenu={(e) => e.preventDefault()} // Prevent native context menu on long press
                                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${filterCategories.includes(c) ? 'bg-teal-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300'}`}
                            >
                                {t(c)}
                            </button>
                        ))}
                    </div>
            </div>
      </div>

      {/* Date Picker Modal */}
      <DatePicker 
          isOpen={datePickerConfig.isOpen}
          onClose={() => setDatePickerConfig(prev => ({ ...prev, isOpen: false }))}
          onSelect={handleDateSelect}
          initialDate={datePickerConfig.initialDate}
          title={datePickerConfig.mode === 'start' ? t('From Date') : t('To Date')}
      />

      {/* Transaction List (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {Object.entries(groupedTransactions).length === 0 ? (
              <div className="text-center py-20 text-gray-400 dark:text-slate-500">
                  <p>{t('No transactions found.')}</p>
              </div>
          ) : (
             Object.entries(groupedTransactions).map(([date, items]) => (
                 <div key={date}>
                     <h3 className="text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-3 ml-1">{date}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {items.map(item => (
                            <SwipeableItem 
                                key={item.id}
                                item={item}
                                currency={currency}
                                onDelete={handleDelete}
                                t={t}
                            />
                        ))}
                     </div>
                 </div>
             ))
          )}
      </div>

      {/* Undo Snackbar */}
      <div 
        className={`fixed bottom-24 left-4 right-4 sm:left-auto sm:right-8 sm:w-96 bg-gray-900 dark:bg-slate-700 text-white p-4 rounded-xl shadow-lg flex justify-between items-center z-50 transition-all duration-300 transform ${deletedItem ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'}`}
      >
        <span className="text-sm">Transaction deleted</span>
        <button 
            onClick={handleUndo}
            className="text-teal-400 font-bold text-sm flex items-center space-x-1 hover:text-teal-300 transition-colors"
        >
            <RotateCcw size={16} />
            <span>Undo</span>
        </button>
      </div>
    </div>
  );
};

export default ExpenseList;
