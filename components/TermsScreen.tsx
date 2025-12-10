import React from 'react';
import { ArrowLeft, ShieldCheck, Server, Lock } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface TermsScreenProps {
  onBack: () => void;
}

const TermsScreen: React.FC<TermsScreenProps> = ({ onBack }) => {
  const { t } = useData();
  
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 flex flex-col animate-fade-in transition-colors">
      <header className="flex items-center space-x-3 p-4 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-b border-gray-100 dark:border-slate-800">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">{t('Terms of Service')}</h1>
      </header>
      
      <div className="flex-1 overflow-y-auto p-6 space-y-8 text-gray-600 dark:text-slate-300">
         <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
            <p className="text-sm leading-relaxed">
              By accessing and using Kanakkuvazhakku ("the App"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to abide by these terms, please do not use the App.
            </p>
         </section>
         
         <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">2. Privacy & Data Storage</h2>
            <div className="flex items-start space-x-3 bg-teal-50 dark:bg-teal-900/20 p-4 rounded-xl mb-4 border border-teal-100 dark:border-teal-900/50">
               <ShieldCheck className="text-teal-600 dark:text-teal-400 shrink-0 mt-1" size={20}/>
               <div>
                   <h3 className="font-semibold text-teal-900 dark:text-teal-100 text-sm mb-1">Offline-First Policy</h3>
                   <p className="text-xs text-teal-800 dark:text-teal-200 leading-relaxed">
                     We prioritize your privacy. Your financial data (expenses, budgets, history) is stored <strong>locally on your device</strong>. We do not store your personal expense records on our servers.
                   </p>
               </div>
            </div>
            <p className="text-sm leading-relaxed">
                You are responsible for backing up your data. Uninstalling the app or clearing app data may result in the permanent loss of your records unless you have performed a manual export or sync (if available).
            </p>
         </section>

         <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. AI Features & Usage</h2>
            <div className="flex items-start space-x-3 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-xl mb-3 border border-purple-100 dark:border-purple-900/30">
                <Server className="text-purple-600 dark:text-purple-400 shrink-0 mt-1" size={20} />
                <p className="text-xs text-purple-900 dark:text-purple-200 leading-relaxed">
                    The App uses Google Gemini API to provide financial insights and natural language expense parsing.
                </p>
            </div>
            <p className="text-sm leading-relaxed">
              When you use AI features (e.g., "Magic Fill" or "Assistant"), minimal necessary data (such as the text you type or a summary of recent spending) is sent to the AI provider for processing. This data is ephemeral and is not used to train public AI models by default, in accordance with the API provider's enterprise privacy policies.
            </p>
         </section>
         
         <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Disclaimer</h2>
            <p className="text-sm leading-relaxed">
              The App is a financial tracking tool, not a financial advisor. Insights provided by the AI are for informational purposes only. Please consult a qualified financial professional for investment, tax, or legal advice. We are not liable for any financial decisions made based on the App's data or AI suggestions.
            </p>
         </section>

         <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">5. User Account & Security</h2>
            <div className="flex items-start space-x-3">
                <Lock className="text-gray-400 dark:text-slate-500 shrink-0 mt-1" size={16} />
                <p className="text-sm leading-relaxed">
                    You are responsible for maintaining the confidentiality of your device, PIN, or password used to access the App. 
                </p>
            </div>
         </section>

         <div className="pt-8 text-center border-t border-gray-100 dark:border-slate-800 mt-8">
            <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleDateString()}</p>
            <p className="text-xs text-gray-400 mt-1">Version 1.2.8</p>
         </div>
      </div>
    </div>
  );
};

export default TermsScreen;