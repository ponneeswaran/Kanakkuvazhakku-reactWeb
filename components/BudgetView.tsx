
import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Category, Budget } from '../types';
import { Edit2, Save, AlertTriangle, ChevronRight, ArrowLeft } from 'lucide-react';

interface BudgetViewProps {
  onCategorySelect: (category: Category) => void;
  onBack?: () => void;
}

const BudgetView: React.FC<BudgetViewProps> = ({ onCategorySelect, onBack }) => {
  const { expenses, budgets, setBudget, currency, t } = useData();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [error, setError] = useState(false);

  const calculateProgress = (category: Category) => {
    const limit = budgets.find(b => b.category === category)?.limit || 0;
    if (limit === 0) return { spent: 0, limit: 0, percentage: 0 };
    
    // Get current month spending for this category
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const spent = expenses
      .filter(e => e.category === category && e.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { spent, limit, percentage: Math.min((spent / limit) * 100, 100) };
  };

  const categories: Category[] = ['Food', 'Transport', 'Entertainment', 'Utilities', 'Healthcare', 'Shopping', 'Housing', 'Other'];

  const handleEditClick = (e: React.MouseEvent, category: Category, currentLimit: number) => {
    e.stopPropagation();
    setEditingCategory(category);
    setEditAmount(currentLimit.toString());
    setError(false);
  };

  const handleSave = (e: React.MouseEvent, category: Category) => {
    e.stopPropagation();
    const amount = parseFloat(editAmount);
    
    if (isNaN(amount) || amount < 0) {
        setError(true);
        return;
    }

    setBudget(category, amount);
    setEditingCategory(null);
    setError(false);
  };

  const handleInputClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setEditAmount(e.target.value);
      if (error) setError(false);
  }

  return (
    <div className="h-full flex flex-col animate-fade-in bg-gray-50 dark:bg-slate-900 transition-colors">
      <div className="shrink-0 p-6 pb-2 z-10 bg-gray-50 dark:bg-slate-900 transition-colors">
        <header className="mb-4 flex items-center space-x-3">
            {onBack && (
                <button 
                onClick={onBack}
                className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
                >
                <ArrowLeft size={24} />
                </button>
            )}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Monthly Budgets')}</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">{t('Track your limits for this month')}</p>
            </div>
        </header>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map(category => {
            const { spent, limit, percentage } = calculateProgress(category);
            const isOverBudget = spent > limit && limit > 0;
            const isEditing = editingCategory === category;

            return (
                <div 
                key={category} 
                onClick={() => onCategorySelect(category)}
                className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 active:bg-gray-50 dark:active:bg-slate-700 transition-colors cursor-pointer"
                >
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-700 dark:text-white">{t(category)}</span>
                        {isOverBudget && <AlertTriangle size={16} className="text-red-500" />}
                    </div>
                    
                    {isEditing ? (
                    <div className="flex items-center space-x-2">
                        <input
                        type="number"
                        value={editAmount}
                        onChange={handleInputChange}
                        onClick={handleInputClick}
                        className={`w-24 p-2 border rounded-lg text-right bg-white text-gray-900 dark:bg-slate-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm ${error ? 'border-red-500' : 'border-gray-200 dark:border-slate-600'}`}
                        placeholder="0"
                        autoFocus
                        />
                        <button onClick={(e) => handleSave(e, category)} className="text-teal-600 dark:text-teal-400"><Save size={18} /></button>
                    </div>
                    ) : (
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500 dark:text-slate-400">
                            {currency}{spent.toFixed(0)} / <span className="font-medium text-gray-800 dark:text-white">{limit > 0 ? limit : '--'}</span>
                        </span>
                        <button onClick={(e) => handleEditClick(e, category, limit)} className="text-gray-400 hover:text-teal-600 dark:text-slate-500 dark:hover:text-teal-400 p-1 transition-colors">
                            <Edit2 size={14} />
                        </button>
                        <ChevronRight size={16} className="text-gray-300 dark:text-slate-600" />
                    </div>
                    )}
                </div>

                {limit > 0 ? (
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                        <div 
                            className={`h-2.5 rounded-full transition-all duration-500 ${
                                percentage >= 100 ? 'bg-red-500' : 
                                percentage >= 75 ? 'bg-amber-500' : 
                                'bg-teal-500'
                            }`} 
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                ) : (
                    <div className="text-xs text-gray-400 dark:text-slate-500 italic mt-1">{t('No budget set')}</div>
                )}
                
                {limit > 0 && (
                    <div className="mt-1 text-xs text-right text-gray-400 dark:text-slate-500">
                        {percentage.toFixed(0)}% {t('used')}
                    </div>
                )}
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default BudgetView;
