import React from 'react';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, Moon, Sun, ChevronDown } from 'lucide-react';

interface SettingsScreenProps {
  onBack: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onBack }) => {
  const { theme, setTheme, currency, setCurrency, language, setLanguage, t } = useData();

  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
    { code: 'EUR', symbol: '€', name: 'Euro' },
    { code: 'GBP', symbol: '£', name: 'British Pound' },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  ];

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in landscape:pb-6 landscape:pr-24 min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900 transition-colors">
      <header className="flex items-center space-x-3 sticky top-0 bg-gray-50 dark:bg-slate-900 z-10 py-2">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-gray-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Settings')}</h1>
      </header>

      {/* Theme Section - Toggle */}
      <section className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-slate-700 flex justify-between items-center transition-colors">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'bg-amber-100 text-amber-600' : 'bg-indigo-900 text-indigo-300'}`}>
            {theme === 'light' ? <Sun size={20} /> : <Moon size={20} />}
          </div>
          <div>
             <h2 className="font-semibold text-gray-800 dark:text-white">{t('Appearance')}</h2>
             <p className="text-xs text-gray-500 dark:text-slate-400">{theme === 'light' ? t('Light') : t('Dark')}</p>
          </div>
        </div>
        
        {/* Toggle Switch */}
        <button 
            onClick={toggleTheme}
            className={`w-14 h-8 rounded-full transition-colors relative flex items-center px-1 ${theme === 'dark' ? 'bg-teal-600' : 'bg-gray-300'}`}
            aria-label="Toggle Theme"
        >
            <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${theme === 'dark' ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </section>

      {/* Language Section - Dropdown */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('Language')}</h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-1 relative transition-colors">
             <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-transparent p-4 text-gray-800 dark:text-white appearance-none focus:outline-none z-10 relative font-medium"
            >
                {languages.map(lang => (
                    <option key={lang.code} value={lang.code} className="bg-white dark:bg-slate-800 text-gray-800 dark:text-white">
                        {lang.name} - {lang.nativeName}
                    </option>
                ))}
            </select>
             <ChevronDown size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </section>

      {/* Currency Section - Dropdown */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ml-1">{t('Primary Currency')}</h2>
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-1 relative transition-colors">
            <select 
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full bg-transparent p-4 text-gray-800 dark:text-white appearance-none focus:outline-none z-10 relative font-medium"
            >
                {currencies.map(curr => (
                    <option key={curr.code} value={curr.symbol} className="bg-white dark:bg-slate-800 text-gray-800 dark:text-white">
                        {curr.code} ({curr.symbol}) - {curr.name}
                    </option>
                ))}
            </select>
            <ChevronDown size={20} className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </section>

      <div className="mt-auto pt-8 text-center text-xs text-gray-400 dark:text-gray-600">
        <p>Kanakkuvazhakku v1.2.8</p>
      </div>
    </div>
  );
};

export default SettingsScreen;