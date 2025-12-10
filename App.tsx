

import React, { useState, useEffect } from 'react';
import { DataProvider, useData } from './contexts/DataContext';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import ExpenseList from './components/ExpenseList';
import BudgetView from './components/BudgetView';
import CategoryExpensesView from './components/CategoryExpensesView';
import AIChat from './components/AIChat';
import AccountScreen from './components/AccountScreen';
import ProfileEditScreen from './components/ProfileEditScreen';
import SettingsScreen from './components/SettingsScreen';
import SplashScreen from './components/SplashScreen';
import LoginScreen from './components/LoginScreen';
import OTPScreen from './components/OTPScreen';
import OnboardingScreen from './components/OnboardingScreen';
import TermsScreen from './components/TermsScreen';
import IncomeScreen from './components/IncomeScreen';
import { Category } from './types';

// App Content Wrapper to use Data Context
const AppContent: React.FC = () => {
  const { isAuthenticated, isOnboardingComplete, isSyncAuthRequired, completeSyncAuth, cancelSyncAuth, loginIdentifier } = useData();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<Category | null>(null);
  const [historyFilter, setHistoryFilter] = useState<Category | 'All'>('All');
  
  // Auth Flow States
  const [showSplash, setShowSplash] = useState(true);
  const [isViewingTerms, setIsViewingTerms] = useState(false);

  // Handle Splash Finish
  const handleSplashFinish = () => {
    setShowSplash(false);
  };

  const handleTabChange = (tab: string) => {
    setCurrentTab(tab);
    // Reset selection when changing tabs
    setSelectedBudgetCategory(null);
    setHistoryFilter('All');
  };

  // 1. Show Splash Screen first
  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // 2. Terms of Service Screen (accessible anytime if state is set)
  if (isViewingTerms) {
      return <TermsScreen onBack={() => setIsViewingTerms(false)} />;
  }

  // 3. If not authenticated, show Login
  if (!isAuthenticated) {
    // onLoginSuccess currently acts as a trigger to re-evaluate the auth state, 
    // actual auth logic is handled inside LoginScreen via Context
    return <LoginScreen 
        onLoginSuccess={() => {}} 
        onShowTerms={() => setIsViewingTerms(true)}
    />;
  }

  // 4. If authenticated but profile incomplete, show Onboarding
  if (!isOnboardingComplete) {
    return <OnboardingScreen />;
  }

  // 5. Main App
  // Handle Sub-screens (Account, Settings, etc. that cover the main layout)
  if (currentTab === 'account') {
      return <AccountScreen 
          onBack={() => setCurrentTab('dashboard')} 
          onNavigateToProfile={() => setCurrentTab('profile_edit')}
          onNavigateToSettings={() => setCurrentTab('settings')}
      />;
  }

  if (currentTab === 'profile_edit') {
      return <ProfileEditScreen onBack={() => setCurrentTab('account')} />;
  }

  if (currentTab === 'settings') {
      return <SettingsScreen onBack={() => setCurrentTab('account')} />;
  }

  return (
    <Layout activeTab={currentTab} onTabChange={handleTabChange}>
      {currentTab === 'dashboard' && (
        <Dashboard 
            onProfileClick={() => setCurrentTab('account')} 
            onNavigateToHistory={(category) => {
                setHistoryFilter(category);
                setCurrentTab('expenses');
            }}
        />
      )}
      
      {currentTab === 'expenses' && (
        <ExpenseList initialCategory={historyFilter} />
      )}

      {currentTab === 'income' && (
        <IncomeScreen />
      )}

      {currentTab === 'budgets' && (
        selectedBudgetCategory ? (
            <CategoryExpensesView 
                category={selectedBudgetCategory} 
                onBack={() => setSelectedBudgetCategory(null)} 
            />
        ) : (
            <BudgetView onCategorySelect={setSelectedBudgetCategory} />
        )
      )}

      {currentTab === 'ai' && <AIChat />}
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <DataProvider>
      <AppContent />
    </DataProvider>
  );
};

export default App;