

import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { IncomeCategory, Recurrence } from '../types';
import { X, Calendar as CalendarIcon, AlertCircle, RefreshCw, User, Phone } from 'lucide-react';
import DatePicker from './DatePicker';

interface IncomeFormProps {
  onClose: () => void;
}

const IncomeForm: React.FC<IncomeFormProps> = ({ onClose }) => {
  const { addIncome, currency, t } = useData();
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<IncomeCategory>('Salary');
  const [source, setSource] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [recurrence, setRecurrence] = useState<Recurrence>('None');
  const [tenantContact, setTenantContact] = useState('');
  
  const [errors, setErrors] = useState<{ amount?: string; source?: string }>({});
  const [showDatePicker, setShowDatePicker] = useState(false);

  const isRent = category === 'Rent';

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!amount || parseFloat(amount) <= 0) newErrors.amount = "Valid amount required";
    if (!source.trim()) newErrors.source = "Source is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    addIncome({
      amount: parseFloat(amount),
      category,
      source: source.trim(),
      date,
      recurrence,
      tenantContact: isRent ? tenantContact : undefined
    });
    onClose();
  };

  const handleDateSelect = (selectedDate: Date) => {
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      const day = selectedDate.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      setDate(dateStr);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl px-6 pt-6 pb-[calc(2rem+env(safe-area-inset-bottom))] sm:pb-6 shadow-xl max-h-[90vh] h-auto overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('Add Income')}</h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-slate-700 rounded-full hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
            <X size={20} className="text-gray-600 dark:text-slate-300" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Amount')}</label>
            <div className="relative">
                <span className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-400 font-bold">{currency}</span>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg font-semibold text-gray-900 dark:text-white"
                    placeholder="0.00"
                />
            </div>
            {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount}</p>}
          </div>

          {/* Category */}
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Category')}</label>
              <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as IncomeCategory)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
              >
                  {['Salary', 'Rent', 'Interest', 'Business', 'Gift', 'Other'].map(c => (
                      <option key={c} value={c}>{t(c)}</option>
                  ))}
              </select>
          </div>

          {/* Source / Tenant Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                {isRent ? t('Tenant Name') : t('Source')}
            </label>
            <div className="relative">
                <User className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                    placeholder={isRent ? "e.g., John Doe" : "e.g., Employer, Bank"}
                />
            </div>
            {errors.source && <p className="text-red-500 text-xs mt-1">{errors.source}</p>}
          </div>

          {/* Tenant Contact (Rent Only) */}
          {isRent && (
            <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Tenant Mobile (for reminders)')}</label>
                 <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                    <input
                        type="tel"
                        value={tenantContact}
                        onChange={(e) => setTenantContact(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                        placeholder="+91..."
                    />
                 </div>
            </div>
          )}

          {/* Recurrence */}
          <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Recurrence')}</label>
              <div className="flex gap-2">
                  {['None', 'Monthly', 'Yearly'].map((r) => (
                      <button
                          key={r}
                          type="button"
                          onClick={() => setRecurrence(r as Recurrence)}
                          className={`flex-1 py-2 px-1 rounded-lg text-sm font-medium transition-colors ${
                              recurrence === r
                              ? 'bg-purple-600 text-white shadow-md' 
                              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                          }`}
                      >
                          {t(r)}
                      </button>
                  ))}
              </div>
          </div>

          {/* Date */}
          <div className="relative">
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('Due Date / Received Date')}
                </label>
                <button 
                    type="button"
                    onClick={() => setShowDatePicker(true)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-xl flex items-center justify-between text-left focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                >
                    <span>{new Date(date).toLocaleDateString()}</span>
                    <CalendarIcon size={18} className="text-gray-400" />
                </button>
          </div>

          <button
            type="submit"
            className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-transform active:scale-[0.98] mt-4"
          >
            {t('Save Income')}
          </button>
        </form>

        <DatePicker 
            isOpen={showDatePicker}
            onClose={() => setShowDatePicker(false)}
            onSelect={handleDateSelect}
            initialDate={new Date(date)}
            title={t('Select Date')}
        />
      </div>
    </div>
  );
};

export default IncomeForm;