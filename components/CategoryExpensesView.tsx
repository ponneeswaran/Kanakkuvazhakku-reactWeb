import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Category, Expense } from '../types';
import { ArrowLeft, ArrowUpDown, Filter, Calendar, Trash2, X, AlertCircle } from 'lucide-react';
import DatePicker from './DatePicker';

interface CategoryExpensesViewProps {
  category: Category;
  onBack: () => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';

const CategoryExpensesView: React.FC<CategoryExpensesViewProps> = ({ category, onBack }) => {
  const { expenses, currency, deleteExpense, t } = useData();
  const [sortOption, setSortOption] = useState<SortOption>('date-desc');
  const [showFilters, setShowFilters] = useState(false);
  
  // Filter States
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

  // Validation States
  const dateError = startDate && endDate && startDate > endDate ? "Start date cannot be after end date" : "";
  const amountError = minAmount && maxAmount && parseFloat(minAmount) > parseFloat(maxAmount) ? "Min amount cannot be greater than max" : "";

  const filteredAndSortedExpenses = useMemo(() => {
    // Skip filtering if invalid ranges
    if (dateError || amountError) return [];

    let result = expenses.filter(e => e.category === category);

    // Apply Date Filter
    if (startDate) {
      result = result.filter(e => e.date >= startDate);
    }
    if (endDate) {
      result = result.filter(e => e.date <= endDate);
    }

    // Apply Amount Filter
    if (minAmount) {
      result = result.filter(e => e.amount >= parseFloat(minAmount));
    }
    if (maxAmount) {
      result = result.filter(e => e.amount <= parseFloat(maxAmount));
    }

    // Apply Sorting
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
  }, [expenses, category, startDate, endDate, minAmount, maxAmount, sortOption, dateError, amountError]);

  const totalAmount = filteredAndSortedExpenses.reduce((sum, e) => sum + e.amount, 0);

  const resetFilters = () => {
    setStartDate('');
    setEndDate('');
    setMinAmount('');
    setMaxAmount('');
  };

  const hasActiveFilters = startDate || endDate || minAmount || maxAmount;

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

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in bg-slate-50 dark:bg-slate-950 min-h-full landscape:pb-6 landscape:pr-24 transition-colors">
      {/* Header */}
      <header className="flex items-center space-x-3 mb-2 sticky top-0 bg-slate-50 dark:bg-slate-950 z-10 py-2 transition-colors">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t(category)}</h1>
          <p className="text-sm text-gray-500 dark:text-slate-400">{filteredAndSortedExpenses.length} {t('records')} • {t('Total')} {currency}{totalAmount.toFixed(2)}</p>
        </div>
      </header>

      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-3 transition-colors">
        <div className="flex justify-between items-center">
            {/* Sort Dropdown */}
            <div className="relative flex items-center space-x-2">
                <ArrowUpDown size={16} className="text-gray-400 dark:text-slate-400" />
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="bg-transparent text-sm font-medium text-gray-700 dark:text-white focus:outline-none pr-6 appearance-none"
                >
                    <option value="date-desc">{t('Newest First')}</option>
                    <option value="date-asc">{t('Oldest First')}</option>
                    <option value="amount-desc">{t('Highest Amount')}</option>
                    <option value="amount-asc">{t('Lowest Amount')}</option>
                </select>
            </div>

            {/* Filter Toggle */}
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
            <div className="pt-3 border-t border-gray-100 dark:border-slate-700 grid grid-cols-1 gap-3 animate-fade-in sm:grid-cols-2">
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-slate-400 font-medium">{t('From Date')}</label>
                    <button 
                        onClick={() => openDatePicker('start')}
                        className={`w-full text-left text-xs p-2 bg-gray-50 dark:bg-slate-700 border ${dateError ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-lg dark:text-white transition-colors`}
                    >
                        {startDate || t('Select Date')}
                    </button>
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-slate-400 font-medium">{t('To Date')}</label>
                    <button 
                        onClick={() => openDatePicker('end')}
                        className={`w-full text-left text-xs p-2 bg-gray-50 dark:bg-slate-700 border ${dateError ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-lg dark:text-white transition-colors`}
                    >
                        {endDate || t('Select Date')}
                    </button>
                </div>
                {dateError && (
                    <div className="col-span-1 sm:col-span-2 text-xs text-red-500 flex items-center">
                        <AlertCircle size={10} className="mr-1"/> {dateError}
                    </div>
                )}

                <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-slate-400 font-medium">{t('Min Amount')}</label>
                    <input 
                        type="number" 
                        placeholder="0"
                        value={minAmount}
                        onChange={(e) => setMinAmount(e.target.value)}
                        className={`w-full text-xs p-2 bg-gray-50 dark:bg-slate-700 border ${amountError ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-lg dark:text-white transition-colors`}
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs text-gray-500 dark:text-slate-400 font-medium">{t('Max Amount')}</label>
                    <input 
                        type="number" 
                        placeholder="Any"
                        value={maxAmount}
                        onChange={(e) => setMaxAmount(e.target.value)}
                        className={`w-full text-xs p-2 bg-gray-50 dark:bg-slate-700 border ${amountError ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-lg dark:text-white transition-colors`}
                    />
                </div>
                {amountError && (
                    <div className="col-span-1 sm:col-span-2 text-xs text-red-500 flex items-center">
                        <AlertCircle size={10} className="mr-1"/> {amountError}
                    </div>
                )}
                
                {hasActiveFilters && (
                    <div className="col-span-1 sm:col-span-2 flex justify-end">
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
      </div>

      <DatePicker 
          isOpen={datePickerConfig.isOpen}
          onClose={() => setDatePickerConfig(prev => ({ ...prev, isOpen: false }))}
          onSelect={handleDateSelect}
          initialDate={datePickerConfig.initialDate}
          title={datePickerConfig.mode === 'start' ? t('From Date') : t('To Date')}
      />

      {/* Expense List */}
      <div className="space-y-3">
        {filteredAndSortedExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-400 dark:text-slate-500">
                <p>{(dateError || amountError) ? "Please fix filter errors" : t("No expenses found matching your criteria.")}</p>
            </div>
        ) : (
            filteredAndSortedExpenses.map(expense => (
                <div key={expense.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-50 dark:border-slate-700 flex justify-between items-center transition-colors">
                    <div className="flex items-center space-x-3">
                         <div className="bg-gray-100 dark:bg-slate-700 w-10 h-10 rounded-full flex items-center justify-center text-gray-500 dark:text-slate-400">
                             <Calendar size={18} />
                         </div>
                         <div>
                             <div className="font-semibold text-gray-800 dark:text-white">{expense.description}</div>
                             <div className="text-xs text-gray-500 dark:text-slate-400">
                                {new Date(expense.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                <span className="mx-1">•</span>
                                {t(expense.paymentMethod)}
                             </div>
                         </div>
                    </div>
                    <div className="flex items-center space-x-3">
                        <span className="font-bold text-gray-800 dark:text-white">{currency}{expense.amount.toFixed(2)}</span>
                        <button 
                            onClick={() => deleteExpense(expense.id)}
                            className="text-gray-300 dark:text-slate-600 hover:text-red-500 dark:hover:text-red-400 transition-colors p-2"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            ))
        )}
      </div>
    </div>
  );
};

export default CategoryExpensesView;