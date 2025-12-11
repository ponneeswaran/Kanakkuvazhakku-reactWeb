
import React, { ReactNode, useState } from 'react';
import { Home, List, Wallet, Sparkles, Plus } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import AddTransactionModal from './AddTransactionModal';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { t } = useData();
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-slate-900 transition-colors overflow-hidden flex flex-col md:flex-row landscape:flex-row">
      
      {/* Main Content Area - Grow to fill space */}
      <main className="flex-1 h-full w-full overflow-hidden relative order-1 md:order-1 landscape:order-1">
         {children}
      </main>

      {/* Add Transaction Modal */}
      {showAddModal && <AddTransactionModal onClose={() => setShowAddModal(false)} initialTab={activeTab === 'income' ? 'income' : 'expense'} />}

      {/* Navigation - Flex Item (Fixed height on mobile, Fixed width on desktop via flex) */}
      <nav className="
        shrink-0 h-16 w-full md:w-20 md:h-full landscape:w-20 landscape:h-full
        bg-white dark:bg-slate-900 transition-colors shadow-[0_-1px_3px_rgba(0,0,0,0.1)] md:shadow-none landscape:shadow-none
        border-t border-gray-100 dark:border-slate-800
        md:border-t-0 md:border-l landscape:border-t-0 landscape:border-l
        z-50 pb-safe md:pb-0 landscape:pb-0
        order-2 md:order-2 landscape:order-2
        overflow-y-auto no-scrollbar
      ">
        <div className="
          flex items-center
          justify-between h-full px-6
          md:flex-col md:justify-center md:space-y-8 md:px-0 md:w-full
          landscape:flex-col landscape:justify-center landscape:space-y-8 landscape:px-0 landscape:w-full
        ">
          
          {/* Home */}
          <button
            onClick={() => onTabChange('dashboard')}
            className={`flex flex-col items-center justify-center md:w-full landscape:w-full space-y-1 ${
              activeTab === 'dashboard' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <Home 
              size={24} 
              strokeWidth={activeTab === 'dashboard' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{t('Home')}</span>
          </button>

          {/* History */}
          <button
            onClick={() => onTabChange('expenses')}
            className={`flex flex-col items-center justify-center md:w-full landscape:w-full space-y-1 ${
              activeTab === 'expenses' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <List 
              size={24} 
              strokeWidth={activeTab === 'expenses' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{t('History')}</span>
          </button>

          {/* Center Add Button */}
          <div className="
            relative -top-5 md:top-auto landscape:top-auto
            md:my-4 landscape:my-4
            flex flex-col items-center justify-center
          ">
             <button 
                onClick={() => setShowAddModal(true)}
                className="w-14 h-14 bg-teal-600 rounded-full shadow-lg shadow-teal-600/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all border-4 border-gray-50 dark:border-slate-900"
                aria-label="Add Transaction"
              >
                <Plus size={28} strokeWidth={2.5} />
              </button>
          </div>

          {/* Income */}
          <button
            onClick={() => onTabChange('income')}
            className={`flex flex-col items-center justify-center md:w-full landscape:w-full space-y-1 ${
              activeTab === 'income' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <Wallet 
              size={24} 
              strokeWidth={activeTab === 'income' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{t('Income')}</span>
          </button>

          {/* Assistant */}
          <button
            onClick={() => onTabChange('ai')}
            className={`flex flex-col items-center justify-center md:w-full landscape:w-full space-y-1 ${
              activeTab === 'ai' ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'
            }`}
          >
            <Sparkles 
              size={24} 
              strokeWidth={activeTab === 'ai' ? 2.5 : 2}
            />
            <span className="text-[10px] font-medium">{t('Assistant')}</span>
          </button>

        </div>
      </nav>
    </div>
  );
};

export default Layout;
