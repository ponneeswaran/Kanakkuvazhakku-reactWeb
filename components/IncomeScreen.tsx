

import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Income, IncomeStatus } from '../types';
import { Plus, CheckCircle, Clock, AlertTriangle, Phone, MessageCircle, Trash2, Calendar } from 'lucide-react';
import IncomeForm from './IncomeForm';

interface IncomeCardProps {
    income: Income;
    currency: string;
    t: (key: string) => string;
    onFollowUp: (income: Income) => void;
    onMarkReceived: (id: string) => void;
    onDelete: (id: string) => void;
}

const IncomeCard: React.FC<IncomeCardProps> = ({ income, currency, t, onFollowUp, onMarkReceived, onDelete }) => {
    const isOverdue = income.status === 'Overdue';
    
    return (
        <div className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border ${isOverdue ? 'border-red-400 dark:border-red-900 ring-1 ring-red-100 dark:ring-red-900/30' : 'border-gray-100 dark:border-slate-700'} relative transition-all`}>
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${
                        income.category === 'Rent' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 
                        income.category === 'Salary' ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400' :
                        'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                        {income.category === 'Rent' ? '🏠' : income.category === 'Salary' ? '💼' : '💰'}
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{income.source}</h3>
                        <div className="flex items-center text-xs text-gray-500 dark:text-slate-400 space-x-2">
                            <span>{t(income.category)}</span>
                            {income.recurrence !== 'None' && (
                                <span className="bg-gray-100 dark:bg-slate-700 px-1.5 rounded text-[10px] flex items-center">
                                    <Clock size={10} className="mr-1"/> {t(income.recurrence)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`block font-bold text-lg ${isOverdue ? 'text-red-500' : 'text-teal-600 dark:text-teal-400'}`}>
                        {currency}{income.amount.toFixed(0)}
                    </span>
                    <span className={`text-xs ${isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                        {isOverdue ? t('Overdue') : new Date(income.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                    </span>
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-50 dark:border-slate-700/50">
                {income.status !== 'Received' && (
                    <>
                        {income.category === 'Rent' && isOverdue && (
                            <button 
                                onClick={() => onFollowUp(income)}
                                className="flex items-center space-x-1 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-semibold"
                            >
                                <AlertTriangle size={12} />
                                <span>{t('Follow Up')}</span>
                            </button>
                        )}
                        <button 
                            onClick={() => onMarkReceived(income.id)}
                            className="flex items-center space-x-1 px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-semibold"
                        >
                            <CheckCircle size={12} />
                            <span>{t('Mark Received')}</span>
                        </button>
                    </>
                )}
                {income.status === 'Received' && (
                    <span className="text-xs text-green-500 font-medium flex items-center">
                        <CheckCircle size={12} className="mr-1" /> {t('Received')}
                    </span>
                )}
                 <button 
                    onClick={() => {
                        if(confirm(t('Delete this income entry?'))) onDelete(income.id);
                    }}
                    className="p-1.5 text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 transition-colors"
                >
                    <Trash2 size={14} />
                </button>
            </div>
        </div>
    );
};

const IncomeScreen: React.FC = () => {
  const { incomes, markIncomeReceived, deleteIncome, currency, t } = useData();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'Expected' | 'Received'>('Expected');
  const [followUpItem, setFollowUpItem] = useState<Income | null>(null);

  // Group by status
  const overdueIncomes = incomes.filter(i => i.status === 'Overdue');
  const expectedIncomes = incomes.filter(i => i.status === 'Expected').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const receivedIncomes = incomes.filter(i => i.status === 'Received').sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleWhatsAppReminder = (income: Income) => {
      if (!income.tenantContact) {
          alert("No contact number saved for this tenant.");
          return;
      }
      const message = `Hello ${income.source}, this is a gentle reminder that your rent of ${currency}${income.amount} for ${new Date(income.date).toLocaleDateString()} is overdue. Please pay at your earliest convenience.`;
      const url = `https://wa.me/${income.tenantContact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
      setFollowUpItem(null);
  };

  const handleCallTenant = (income: Income) => {
      if (!income.tenantContact) {
          alert("No contact number saved.");
          return;
      }
      window.location.href = `tel:${income.tenantContact}`;
      setFollowUpItem(null);
  };

  return (
    <div className="p-4 pb-24 space-y-4 animate-fade-in bg-slate-50 dark:bg-slate-900 min-h-screen landscape:pb-6 landscape:pr-24 transition-colors">
      <header className="flex justify-between items-center mb-2 sticky top-0 z-10 bg-slate-50 dark:bg-slate-950 py-2">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Income & Rent')}</h1>
        <button 
            onClick={() => setShowForm(true)}
            className="w-10 h-10 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-105 transition-transform"
        >
            <Plus size={24} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex space-x-2 bg-white dark:bg-slate-800 p-1 rounded-xl border border-gray-100 dark:border-slate-700">
          <button 
              onClick={() => setActiveTab('Expected')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'Expected' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' : 'text-gray-500 dark:text-slate-400'}`}
          >
              {t('Expected')} {overdueIncomes.length > 0 && <span className="ml-1 text-xs bg-red-500 text-white px-1.5 rounded-full">{overdueIncomes.length}</span>}
          </button>
          <button 
              onClick={() => setActiveTab('Received')}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-colors ${activeTab === 'Received' ? 'bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400' : 'text-gray-500 dark:text-slate-400'}`}
          >
              {t('History')}
          </button>
      </div>

      <div className="space-y-4">
          {activeTab === 'Expected' ? (
              <>
                {/* Overdue Section */}
                {overdueIncomes.length > 0 && (
                    <div className="space-y-2">
                        <h2 className="text-xs font-bold text-red-500 uppercase tracking-wide ml-1 flex items-center">
                            <AlertTriangle size={12} className="mr-1" /> {t('Action Required')}
                        </h2>
                        {overdueIncomes.map(inc => (
                            <IncomeCard 
                                key={inc.id} 
                                income={inc} 
                                currency={currency} 
                                t={t} 
                                onFollowUp={setFollowUpItem}
                                onMarkReceived={markIncomeReceived}
                                onDelete={deleteIncome}
                            />
                        ))}
                    </div>
                )}
                
                {/* Upcoming Section */}
                <div className="space-y-2">
                    <h2 className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wide ml-1">{t('Upcoming')}</h2>
                    {expectedIncomes.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">{t('No upcoming income scheduled.')}</div>
                    ) : (
                        expectedIncomes.map(inc => (
                            <IncomeCard 
                                key={inc.id} 
                                income={inc} 
                                currency={currency} 
                                t={t} 
                                onFollowUp={setFollowUpItem}
                                onMarkReceived={markIncomeReceived}
                                onDelete={deleteIncome}
                            />
                        ))
                    )}
                </div>
              </>
          ) : (
              <div className="space-y-2">
                   {receivedIncomes.length === 0 ? (
                        <div className="text-center py-10 text-gray-400 text-sm">{t('No income history yet.')}</div>
                    ) : (
                        receivedIncomes.map(inc => (
                            <IncomeCard 
                                key={inc.id} 
                                income={inc} 
                                currency={currency} 
                                t={t} 
                                onFollowUp={setFollowUpItem}
                                onMarkReceived={markIncomeReceived}
                                onDelete={deleteIncome}
                            />
                        ))
                    )}
              </div>
          )}
      </div>

      {showForm && <IncomeForm onClose={() => setShowForm(false)} />}

      {/* Rent Follow Up Sheet */}
      {followUpItem && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in" onClick={() => setFollowUpItem(null)}>
            <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-t-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">{t('Rent Follow Up')}</h3>
                        <p className="text-sm text-gray-500 dark:text-slate-400">{followUpItem.source} • {currency}{followUpItem.amount}</p>
                    </div>
                    <button onClick={() => setFollowUpItem(null)} className="p-1 bg-gray-100 dark:bg-slate-700 rounded-full"><span className="sr-only">Close</span><Trash2 size={16} className="text-gray-500 rotate-45" /></button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={() => handleWhatsAppReminder(followUpItem)}
                        className="flex flex-col items-center justify-center p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
                    >
                        <MessageCircle size={24} className="text-green-600 dark:text-green-400 mb-2" />
                        <span className="text-sm font-semibold text-green-700 dark:text-green-300">{t('WhatsApp Reminder')}</span>
                    </button>
                    <button 
                        onClick={() => handleCallTenant(followUpItem)}
                        className="flex flex-col items-center justify-center p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                    >
                        <Phone size={24} className="text-blue-600 dark:text-blue-400 mb-2" />
                        <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">{t('Call Tenant')}</span>
                    </button>
                </div>
                
                <button 
                    onClick={() => {
                        markIncomeReceived(followUpItem.id);
                        setFollowUpItem(null);
                    }}
                    className="w-full mt-4 py-3 bg-teal-600 text-white rounded-xl font-bold hover:bg-teal-700 transition-colors"
                >
                    {t('Mark as Received')}
                </button>
            </div>
        </div>
      )}
    </div>
  );
};

export default IncomeScreen;