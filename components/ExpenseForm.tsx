import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Category } from '../types';
import { X, Check, Loader2, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import { parseExpenseFromText } from '../services/geminiService';
import DatePicker from './DatePicker';

interface ExpenseFormProps {
  onClose: () => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ onClose }) => {
  const { addExpense, currency, t } = useData();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('Food');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI' | 'Other'>('UPI');
  
  // Validation State
  const [errors, setErrors] = useState<{ amount?: string; description?: string; date?: string }>({});
  
  // AI Parsing State
  const [nlInput, setNlInput] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [showAIInput, setShowAIInput] = useState(false);

  // Date Picker State
  const [showDatePicker, setShowDatePicker] = useState(false);

  const validate = () => {
    const newErrors: { amount?: string; description?: string; date?: string } = {};
    
    if (!amount) {
        newErrors.amount = "Amount is required";
    } else if (parseFloat(amount) <= 0) {
        newErrors.amount = "Amount must be greater than 0";
    }

    if (!description.trim()) {
        newErrors.description = "Description is required";
    }

    if (!date) {
        newErrors.date = "Date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    addExpense({
      amount: parseFloat(amount),
      category,
      description: description.trim(),
      date,
      paymentMethod,
    });
    onClose();
  };

  const handleAIParse = async () => {
      if(!nlInput.trim()) return;
      setIsParsing(true);
      try {
          const parsed = await parseExpenseFromText(nlInput);
          if (parsed.amount) setAmount(parsed.amount.toString());
          if (parsed.category) setCategory(parsed.category);
          if (parsed.description) setDescription(parsed.description);
          if (parsed.paymentMethod) setPaymentMethod(parsed.paymentMethod);
          if (parsed.date) {
            // Check if valid date
            const d = new Date(parsed.date);
            if (!isNaN(d.getTime())) {
                 setDate(parsed.date);
            }
          }
          setShowAIInput(false);
          // Clear errors if any
          setErrors({});
      } catch (e) {
          alert('Failed to parse text. Please enter manually.');
      } finally {
          setIsParsing(false);
      }
  }

  const handleDateSelect = (selectedDate: Date) => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setDate(dateStr);
      if (errors.date) setErrors(prev => ({...prev, date: undefined}));
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl px-6 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-xl max-h-[90vh] h-auto overflow-y-auto transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('Add Expense')}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
            <X size={20} className="text-gray-600 dark:text-slate-300" />
          </button>
        </div>

        {/* AI Quick Entry Toggle */}
        <div className="mb-6">
            {!showAIInput ? (
                <button 
                    onClick={() => setShowAIInput(true)}
                    className="w-full py-3 px-4 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-xl flex items-center justify-center space-x-2 border border-purple-100 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors"
                >
                    <SparklesIcon size={18} />
                    <span className="font-medium">{t('Magic Fill with AI')}</span>
                </button>
            ) : (
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-purple-700 dark:text-purple-400 uppercase">{t('Describe your expense')}</label>
                    <div className="flex gap-2">
                        <input 
                            type="text" 
                            value={nlInput}
                            onChange={(e) => setNlInput(e.target.value)}
                            placeholder={t('magic_fill_placeholder')}
                            className="flex-1 p-3 bg-purple-50 dark:bg-slate-700 border border-purple-100 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-purple-900 dark:text-white"
                        />
                        <button 
                            onClick={handleAIParse}
                            disabled={isParsing}
                            className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 disabled:opacity-50"
                        >
                            {isParsing ? <Loader2 className="animate-spin" size={20}/> : <Check size={20} />}
                        </button>
                    </div>
                </div>
            )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Amount')}</label>
            <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-400 font-bold">{currency}</span>
                <input
                type="number"
                step="0.01"
                required
                value={amount}
                onChange={(e) => {
                    setAmount(e.target.value);
                    if (errors.amount) setErrors(prev => ({...prev, amount: undefined}));
                }}
                className={`w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border ${errors.amount ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg font-semibold text-gray-900 dark:text-white placeholder-gray-400 transition-colors`}
                placeholder="0.00"
                />
            </div>
            {errors.amount && (
                <div className="flex items-center mt-1 text-red-500 text-xs">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.amount}
                </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Description')}</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors(prev => ({...prev, description: undefined}));
              }}
              className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border ${errors.description ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white placeholder-gray-400 transition-colors`}
              placeholder={t('description_placeholder')}
            />
             {errors.description && (
                <div className="flex items-center mt-1 text-red-500 text-xs">
                    <AlertCircle size={12} className="mr-1" />
                    {errors.description}
                </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Category')}</label>
                <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none text-gray-900 dark:text-white"
                >
                {['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Housing', 'Other'].map(c => (
                    <option key={c} value={c}>{t(c)}</option>
                ))}
                </select>
            </div>
            
            {/* Custom Date Picker */}
            <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Date')}</label>
                <button 
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className={`w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border ${errors.date ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'} rounded-xl flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-teal-500 transition-colors`}
                >
                    <span className={`text-sm ${date ? 'text-gray-900 dark:text-white' : 'text-gray-400'} truncate`}>
                        {date ? new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : t('Select Date')}
                    </span>
                    <CalendarIcon size={18} className="text-gray-400 dark:text-slate-400 shrink-0" />
                </button>
                 {errors.date && (
                    <div className="flex items-center mt-1 text-red-500 text-xs">
                        <AlertCircle size={12} className="mr-1" />
                        {errors.date}
                    </div>
                )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('Payment Method')}</label>
            <div className="flex gap-2">
                {['Cash', 'Card', 'UPI', 'Other'].map((method) => (
                    <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method as any)}
                        className={`flex-1 py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                            paymentMethod === method 
                            ? 'bg-teal-600 text-white shadow-md' 
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                        }`}
                    >
                        {t(method)}
                    </button>
                ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-transform active:scale-[0.98] mt-4"
          >
            {t('Save Expense')}
          </button>
        </form>

        <DatePicker 
            isOpen={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onSelect={handleDateSelect}
            initialDate={date ? new Date(date) : new Date()}
            title={t('Date')}
        />
      </div>
    </div>
  );
};

// Helper icon component since we can't import separate files easily in this format
const SparklesIcon = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
)

export default ExpenseForm;