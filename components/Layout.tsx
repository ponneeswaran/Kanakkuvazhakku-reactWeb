

import React, { ReactNode, useState } from 'react';
import { Home, List, Plus, PieChart, MessageSquareText, Wallet } from 'lucide-react';
import ExpenseForm from './ExpenseForm';
import { useData } from '../contexts/DataContext';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { t } = useData();
  const [showAddModal, setShowAddModal] = useState(false);

  const NavItem = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
     const isActive = activeTab === id;
     return (
        <button 
            onClick={() => onTabChange(id)}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400 dark:text-slate-500'} landscape:w-full landscape:h-auto landscape:py-3 lg:landscape:py-4 transition-colors`}
        >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-medium">{t(label)}</span>
        </button>
     )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 font-sans text-gray-900 dark:text-slate-100 w-full relative overflow-hidden transition-colors duration-200">
      
      {/* Main Content Area */}
      <main className="h-screen w-full overflow-y-auto no-scrollbar bg-[#F8FAFC] dark:bg-slate-950 transition-colors duration-200">
        {children}
      </main>

      {/* Navigation - Bottom in Portrait, Right in Landscape */}
      <nav className="fixed z-30 bg-white dark:bg-slate-900 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] landscape:shadow-[-4px_0_6px_-1px_rgba(0,0,0,0.05)]
        bottom-0 left-0 w-full h-20 border-t border-gray-200 dark:border-slate-800 flex flex-row justify-around items-center px-2 pb-2
        landscape:top-0 landscape:right-0 landscape:left-auto landscape:bottom-auto landscape:w-20 landscape:h-full landscape:border-t-0 landscape:border-l landscape:flex-col landscape:justify-center landscape:space-y-1.5 lg:landscape:space-y-6 landscape:px-0 landscape:pb-0 transition-colors duration-200
      ">
        <NavItem id="dashboard" icon={Home} label="Home" />
        <NavItem id="expenses" icon={List} label="History" />
        
        <div className="relative -top-6 landscape:static landscape:top-auto landscape:my-1.5 lg:landscape:my-2">
            <button 
                onClick={() => setShowAddModal(true)}
                className="w-14 h-14 bg-teal-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-teal-600/40 hover:bg-teal-700 hover:scale-105 transition-all dark:shadow-none"
            >
                <Plus size={28} />
            </button>
        </div>

        <NavItem id="income" icon={Wallet} label="Income" />
        <NavItem id="budgets" icon={PieChart} label="Budget" />
        {/* Removed AI Assistant button from bottom nav if space is tight, or keep it if 5 items fit well */}
        <NavItem id="ai" icon={MessageSquareText} label="Chat" />
      </nav>

      {/* Add Expense Modal */}
      {showAddModal && <ExpenseForm onClose={() => setShowAddModal(false)} />}
    </div>
  );
};

export default Layout;