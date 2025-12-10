

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Expense, Budget, Category, UserContext, UserProfile, ChatMessage, Income, IncomeCategory, IncomeStatus } from '../types';
import { t } from '../utils/translations';
import { encryptData, decryptData } from '../utils/security';
import { sendBackupEmail, sendExportEmail } from '../services/emailService';

export type Theme = 'light' | 'dark';

interface DataContextType {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;
  restoreExpense: (expense: Expense) => void;
  addIncome: (income: Omit<Income, 'id' | 'createdAt' | 'status'>) => void;
  deleteIncome: (id: string) => void;
  markIncomeReceived: (id: string) => void;
  setBudget: (category: Category, limit: number) => void;
  getBudget: (category: Category) => number;
  currency: string;
  setCurrency: (symbol: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  setProfilePicture: (image: string) => void;
  userProfile: UserProfile | null;
  theme: Theme;
  setTheme: (theme: Theme) => void;
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  loginIdentifier: string;
  login: (identifier: string, password?: string) => Promise<boolean>;
  startSignup: (identifier: string) => boolean;
  completeOnboarding: (details: Partial<UserProfile>) => void;
  logout: () => void;
  checkUserExists: (identifier: string) => boolean;
  resetPassword: (identifier: string, newPassword: string) => boolean;
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
  authError: string;
  chatHistory: ChatMessage[];
  addChatMessage: (message: ChatMessage) => void;
  backupData: () => Promise<void>;
  exportData: () => Promise<void>;
  importData: (file: File) => Promise<boolean>;
  restoreUserFromBackup: (file: File) => Promise<boolean>;
  isSyncAuthRequired: boolean;
  completeSyncAuth: () => void;
  cancelSyncAuth: () => void;
  registerBiometric: () => Promise<boolean>;
  verifyBiometricLogin: (identifier: string) => Promise<boolean>;
  checkBiometricAvailability: (identifier: string) => boolean;
  isBiometricSupported: boolean;
  updateProfileState: (profile: UserProfile) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const STORAGE_KEY_EXPENSES = 'kanakku_expenses';
const STORAGE_KEY_INCOMES = 'kanakku_incomes';
const STORAGE_KEY_BUDGETS = 'kanakku_budgets';
const STORAGE_KEY_THEME = 'kanakku_theme';
const STORAGE_KEY_AUTH = 'kanakku_is_authenticated';
// Identity and Profile Storage
const STORAGE_KEY_IDENTITY_MAP = 'kanakku_identity_map'; // Maps identifier -> userId
const STORAGE_KEY_PROFILES_ENCRYPTED = 'kanakku_profiles_encrypted'; // Maps userId -> Encrypted UserProfile
const STORAGE_KEY_CURRENT_USER_ID = 'kanakku_current_user_id';

// Default budgets removed for new users as requested
const DEFAULT_BUDGETS: Budget[] = [];

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [theme, setThemeState] = useState<Theme>('light');
  
  // Auth & Profile State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState<boolean>(false);
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState('');
  
  // Chat History State
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Sync Auth State
  const [isSyncAuthRequired, setIsSyncAuthRequired] = useState<boolean>(false);

  // Biometric State
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  // Derived State (for compatibility)
  const currency = userProfile?.currency || '₹';
  const userName = userProfile?.name || '';
  const language = userProfile?.language || 'en';

  // Load data on mount
  useEffect(() => {
    const storedExpenses = localStorage.getItem(STORAGE_KEY_EXPENSES);
    const storedIncomes = localStorage.getItem(STORAGE_KEY_INCOMES);
    const storedBudgets = localStorage.getItem(STORAGE_KEY_BUDGETS);
    const storedTheme = localStorage.getItem(STORAGE_KEY_THEME);
    // Use sessionStorage for Auth so it clears when app/tab is closed
    const storedAuth = sessionStorage.getItem(STORAGE_KEY_AUTH);
    const storedCurrentUserId = localStorage.getItem(STORAGE_KEY_CURRENT_USER_ID);

    if (storedExpenses) {
      setExpenses(JSON.parse(storedExpenses));
    } else {
      setExpenses([]);
    }

    if (storedIncomes) {
      let parsedIncomes: Income[] = JSON.parse(storedIncomes);
      // Check for overdue items on load
      const today = new Date().toISOString().split('T')[0];
      let hasChanges = false;
      parsedIncomes = parsedIncomes.map(inc => {
        if (inc.status === 'Expected' && inc.date < today) {
           hasChanges = true;
           return { ...inc, status: 'Overdue' };
        }
        return inc;
      });
      setIncomes(parsedIncomes);
      if(hasChanges) {
          localStorage.setItem(STORAGE_KEY_INCOMES, JSON.stringify(parsedIncomes));
      }
    } else {
      setIncomes([]);
    }

    if (storedBudgets) {
      setBudgets(JSON.parse(storedBudgets));
    } else {
      setBudgets(DEFAULT_BUDGETS);
    }

    if (storedTheme) {
      setThemeState(storedTheme as Theme);
    }

    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      
      // Try to restore user profile
      if (storedCurrentUserId) {
        const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
        if (encryptedProfiles) {
            const profiles = decryptData(encryptedProfiles) || {};
            const profile = profiles[storedCurrentUserId];
            if (profile) {
                setUserProfile(profile);
                setIsOnboardingComplete(true);
            } else {
                // Auth is true, but profile missing/incomplete -> Onboarding
                setIsOnboardingComplete(false); 
            }
        } else {
            setIsOnboardingComplete(false);
        }
      } else {
        // Auth is true, but no user ID -> Onboarding (e.g. fresh signup initiated)
        setIsOnboardingComplete(false);
      }
    }

    // Check Biometric Support
    if (window.PublicKeyCredential && 
        window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable) {
            window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then(available => {
                setIsBiometricSupported(available);
            });
    }
  }, []);

  // Save data on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INCOMES, JSON.stringify(incomes));
  }, [incomes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(budgets));
  }, [budgets]);

  // Apply theme to DOM
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  const addExpense = (expense: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExpense: Expense = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    setExpenses(prev => [newExpense, ...prev]);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const restoreExpense = (expense: Expense) => {
    setExpenses(prev => [...prev, expense]);
  };

  // Income Methods
  const addIncome = (income: Omit<Income, 'id' | 'createdAt' | 'status'>) => {
      const today = new Date().toISOString().split('T')[0];
      const newIncome: Income = {
          ...income,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          status: income.date < today ? 'Overdue' : 'Expected'
      };
      setIncomes(prev => [newIncome, ...prev]);
  };

  const deleteIncome = (id: string) => {
      setIncomes(prev => prev.filter(i => i.id !== id));
  };

  const markIncomeReceived = (id: string) => {
      setIncomes(prev => {
          const income = prev.find(i => i.id === id);
          if (!income) return prev;

          // 1. Mark current as Received
          const updatedIncome = { ...income, status: 'Received' as IncomeStatus, date: new Date().toISOString().split('T')[0] }; // Update date to today effectively
          const others = prev.filter(i => i.id !== id);
          
          let nextIncome: Income | null = null;

          // 2. Generate Next Recurrence if needed
          if (income.recurrence !== 'None') {
              const currentDate = new Date(income.date); // Use original due date for calculation
              let nextDate = new Date(currentDate);

              if (income.recurrence === 'Monthly') {
                  nextDate.setMonth(nextDate.getMonth() + 1);
              } else if (income.recurrence === 'Yearly') {
                  nextDate.setFullYear(nextDate.getFullYear() + 1);
              }

              nextIncome = {
                  ...income,
                  id: crypto.randomUUID(),
                  date: nextDate.toISOString().split('T')[0],
                  status: 'Expected',
                  createdAt: Date.now()
              };
          }

          if (nextIncome) {
              return [nextIncome, updatedIncome, ...others];
          }
          return [updatedIncome, ...others];
      });
  };

  const setBudget = (category: Category, limit: number) => {
    setBudgets(prev => {
      const filtered = prev.filter(b => b.category !== category);
      return [...filtered, { category, limit }];
    });
  };

  const getBudget = (category: Category) => {
    return budgets.find(b => b.category === category)?.limit || 0;
  };

  const updateProfileState = (profile: UserProfile) => {
    setUserProfile(profile);
    // Update Persistent Storage with Encryption
    const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
    const profiles = encryptedProfiles ? decryptData(encryptedProfiles) : {};
    profiles[profile.id] = profile;
    localStorage.setItem(STORAGE_KEY_PROFILES_ENCRYPTED, encryptData(profiles));
  };

  const setUserName = (name: string) => {
    if (userProfile) {
      updateProfileState({ ...userProfile, name });
    }
  };

  const setProfilePicture = (image: string) => {
    if (userProfile) {
      updateProfileState({ ...userProfile, profilePicture: image });
    }
  }

  const setCurrency = (symbol: string) => {
    if (userProfile) {
      updateProfileState({ ...userProfile, currency: symbol });
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const setLanguage = (lang: string) => {
    if (userProfile) {
      updateProfileState({ ...userProfile, language: lang });
    }
  }

  const login = async (identifier: string, password?: string): Promise<boolean> => {
    setAuthError('');
    const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
    const existingUserId = identityMap[identifier];
    
    setLoginIdentifier(identifier);

    if (existingUserId) {
      const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
      if (encryptedProfiles) {
          const profiles = decryptData(encryptedProfiles);
          const profile = profiles[existingUserId] as UserProfile;
          
          if (profile) {
              // Password Check
              if (profile.password === password) {
                  setUserProfile(profile);
                  setIsOnboardingComplete(true);
                  setIsAuthenticated(true);
                  sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
                  localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, existingUserId);
                  return true;
              } else {
                  setAuthError('Invalid credentials');
                  return false;
              }
          }
      }
    }

    // User not found
    setAuthError('User not found');
    return false;
  };

  const startSignup = (identifier: string): boolean => {
      setAuthError('');
      const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
      if (identityMap[identifier]) {
          // User already exists
          return false; 
      }
      
      setLoginIdentifier(identifier);
      setUserProfile(null);
      // Important: Order matters. Set Onboarding false first, then Auth true.
      // Also persist Auth=true to storage so refresh doesn't kick user out.
      setIsOnboardingComplete(false); 
      setIsAuthenticated(true); 
      sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
      localStorage.removeItem(STORAGE_KEY_CURRENT_USER_ID); // Ensure no user ID is set yet
      return true;
  }

  const completeOnboarding = (details: Partial<UserProfile>) => {
    const newUserId = crypto.randomUUID();
    
    const newProfile: UserProfile = {
      id: newUserId,
      name: details.name || 'User',
      email: details.email || '',
      mobile: details.mobile || '',
      language: details.language || 'en',
      currency: details.currency || '₹',
      password: details.password || ''
    };

    // Save Profile Encrypted
    const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
    const profiles = encryptedProfiles ? decryptData(encryptedProfiles) : {};
    profiles[newUserId] = newProfile;
    localStorage.setItem(STORAGE_KEY_PROFILES_ENCRYPTED, encryptData(profiles));

    // Link Identifiers
    const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
    if (newProfile.mobile) identityMap[newProfile.mobile] = newUserId;
    if (newProfile.email) identityMap[newProfile.email] = newUserId;
    
    // Link current login identifier if not handled
    if (loginIdentifier && !identityMap[loginIdentifier]) {
        identityMap[loginIdentifier] = newUserId;
    }

    localStorage.setItem(STORAGE_KEY_IDENTITY_MAP, JSON.stringify(identityMap));
    localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, newUserId);

    setUserProfile(newProfile);
    setIsAuthenticated(true);
    sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
    setIsOnboardingComplete(true);
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsOnboardingComplete(false);
    setUserProfile(null);
    sessionStorage.removeItem(STORAGE_KEY_AUTH);
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER_ID);
    setChatHistory([]); // Clear chat history on logout
  };

  const checkUserExists = (identifier: string): boolean => {
    const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
    return !!identityMap[identifier];
  };

  const resetPassword = (identifier: string, newPassword: string): boolean => {
    const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
    const userId = identityMap[identifier];
    if (!userId) return false;

    const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
    if (!encryptedProfiles) return false;

    const profiles = decryptData(encryptedProfiles);
    if (!profiles || !profiles[userId]) return false;

    profiles[userId].password = newPassword;
    localStorage.setItem(STORAGE_KEY_PROFILES_ENCRYPTED, encryptData(profiles));
    return true;
  };

  const addChatMessage = (message: ChatMessage) => {
    setChatHistory(prev => [...prev, message]);
  };

  // --- Biometric Authentication ---
  
  const checkBiometricAvailability = (identifier: string): boolean => {
      const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
      const userId = identityMap[identifier];
      if (!userId) return false;

      const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
      if (!encryptedProfiles) return false;

      const profiles = decryptData(encryptedProfiles);
      const profile = profiles[userId] as UserProfile;
      
      return !!(profile && profile.biometricEnabled && profile.biometricCredentialId);
  }

  const registerBiometric = async (): Promise<boolean> => {
      if (!userProfile) return false;
      try {
          // Generate challenge
          const challenge = new Uint8Array(32);
          window.crypto.getRandomValues(challenge);
          
          const credential = await navigator.credentials.create({
              publicKey: {
                  challenge,
                  rp: { name: "Kanakkuvazhakku" },
                  user: {
                      id: new TextEncoder().encode(userProfile.id),
                      name: userProfile.email || userProfile.mobile,
                      displayName: userProfile.name
                  },
                  pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                  authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                  timeout: 60000,
                  attestation: "none"
              }
          }) as PublicKeyCredential;

          if (credential) {
              // Store rawId as base64
              const rawId = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
              const updatedProfile = { ...userProfile, biometricEnabled: true, biometricCredentialId: rawId };
              updateProfileState(updatedProfile);
              return true;
          }
      } catch (e) {
          console.error("Biometric registration failed:", e);
      }
      return false;
  };

  const verifyBiometricLogin = async (identifier: string): Promise<boolean> => {
       const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
       const userId = identityMap[identifier];
       if (!userId) return false;
       
       const encryptedProfiles = localStorage.getItem(STORAGE_KEY_PROFILES_ENCRYPTED);
       if (!encryptedProfiles) return false;
       const profiles = decryptData(encryptedProfiles);
       const profile = profiles[userId] as UserProfile;

       if (!profile?.biometricEnabled || !profile.biometricCredentialId) return false;

       try {
           const challenge = new Uint8Array(32);
           window.crypto.getRandomValues(challenge);
           
           // Decode stored ID
           const credentialIdString = atob(profile.biometricCredentialId);
           const credentialId = new Uint8Array(credentialIdString.length);
           for (let i = 0; i < credentialIdString.length; i++) {
               credentialId[i] = credentialIdString.charCodeAt(i);
           }

           const assertion = await navigator.credentials.get({
               publicKey: {
                   challenge,
                   allowCredentials: [{
                       id: credentialId,
                       type: "public-key"
                   }],
                   userVerification: "required"
               }
           });

           if (assertion) {
               // Success - Log user in
               setUserProfile(profile);
               setIsOnboardingComplete(true);
               setIsAuthenticated(true);
               sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');
               localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, userId);
               return true;
           }
       } catch (e) {
           console.error("Biometric verification failed:", e);
       }
       return false;
  };

  // --- Backup / Export / Import ---

  const backupData = async () => {
    if (!userProfile?.email) {
        alert("Email is required for backups.");
        return;
    }

    const backupPayload = {
        metadata: {
            userId: userProfile.id,
            email: userProfile.email,
            version: '1.0',
            timestamp: Date.now()
        },
        userProfile: userProfile, // Include full profile for restoration
        data: {
            expenses,
            incomes,
            budgets
        }
    };

    const encryptedBackup = encryptData(backupPayload);
    await sendBackupEmail(userProfile.email, encryptedBackup);
  };

  const exportData = async () => {
      if (!userProfile?.email) {
          alert("Email is required for export.");
          return;
      }

      // Convert expenses to CSV
      const headers = ['Type', 'Date', 'Category', 'Description/Source', 'Amount', 'Status'];
      const expenseRows = expenses.map(e => [
          'Expense',
          e.date,
          e.category,
          `"${e.description.replace(/"/g, '""')}"`, // Escape quotes
          `-${e.amount.toFixed(2)}`,
          'Paid'
      ]);
      const incomeRows = incomes.map(i => [
          'Income',
          i.date,
          i.category,
          `"${i.source.replace(/"/g, '""')}"`,
          i.amount.toFixed(2),
          i.status
      ]);
      
      const csvContent = [
          headers.join(','),
          ...expenseRows.map(row => row.join(',')),
          ...incomeRows.map(row => row.join(','))
      ].join('\n');

      await sendExportEmail(userProfile.email, csvContent);
  }

  const importData = async (file: File): Promise<boolean> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const encryptedContent = e.target?.result as string;
                  const decrypted = decryptData(encryptedContent);
                  
                  if (!decrypted || !decrypted.metadata || !decrypted.data) {
                      throw new Error("Invalid backup file format");
                  }

                  // Validate Ownership
                  if (decrypted.metadata.userId !== userProfile?.id) {
                      throw new Error("This backup does not belong to the current user profile.");
                  }

                  // Restore Data
                  if (Array.isArray(decrypted.data.expenses)) {
                      setExpenses(decrypted.data.expenses);
                  }
                  if (Array.isArray(decrypted.data.incomes)) {
                      setIncomes(decrypted.data.incomes);
                  }
                  if (Array.isArray(decrypted.data.budgets)) {
                      setBudgets(decrypted.data.budgets);
                  }

                  resolve(true);
              } catch (err: any) {
                  console.error("Import Error:", err);
                  alert(err.message || "Failed to import backup.");
                  resolve(false);
              }
          };
          reader.onerror = () => resolve(false);
          reader.readAsText(file);
      });
  }

  const restoreUserFromBackup = async (file: File): Promise<boolean> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
              try {
                  const encryptedContent = e.target?.result as string;
                  const decrypted = decryptData(encryptedContent);
                  
                  if (!decrypted || !decrypted.metadata || !decrypted.data || !decrypted.userProfile) {
                      throw new Error("Invalid backup file or missing profile data.");
                  }

                  const { userProfile: restoredProfile, data } = decrypted;
                  
                  // Restore Profile in Encrypted Storage
                  updateProfileState(restoredProfile);

                  // Update Identity Map
                  const identityMap = JSON.parse(localStorage.getItem(STORAGE_KEY_IDENTITY_MAP) || '{}');
                  if (restoredProfile.mobile) identityMap[restoredProfile.mobile] = restoredProfile.id;
                  if (restoredProfile.email) identityMap[restoredProfile.email] = restoredProfile.id;
                  localStorage.setItem(STORAGE_KEY_IDENTITY_MAP, JSON.stringify(identityMap));
                  
                  // Set Current User
                  localStorage.setItem(STORAGE_KEY_CURRENT_USER_ID, restoredProfile.id);

                  // Restore Data State
                  if (Array.isArray(data.expenses)) setExpenses(data.expenses);
                  else setExpenses([]);
                  
                  if (Array.isArray(data.incomes)) setIncomes(data.incomes);
                  else setIncomes([]);
                  
                  if (Array.isArray(data.budgets)) setBudgets(data.budgets);
                  else setBudgets([]);
                  
                  // Persist immediately to storage keys
                  localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(data.expenses || []));
                  localStorage.setItem(STORAGE_KEY_INCOMES, JSON.stringify(data.incomes || []));
                  localStorage.setItem(STORAGE_KEY_BUDGETS, JSON.stringify(data.budgets || []));

                  // Set App State
                  setUserProfile(restoredProfile);
                  setIsAuthenticated(true);
                  setIsOnboardingComplete(true);
                  sessionStorage.setItem(STORAGE_KEY_AUTH, 'true');

                  resolve(true);
              } catch (err: any) {
                  console.error("Restore Error:", err);
                  alert(err.message || "Failed to restore backup.");
                  resolve(false);
              }
          };
          reader.onerror = () => resolve(false);
          reader.readAsText(file);
      });
  }

  const completeSyncAuth = () => {
    setIsSyncAuthRequired(false);
  };

  const cancelSyncAuth = () => {
    setIsSyncAuthRequired(false);
  };

  return (
    <DataContext.Provider value={{ 
      expenses, 
      incomes,
      budgets, 
      addExpense, 
      deleteExpense, 
      restoreExpense,
      addIncome,
      deleteIncome,
      markIncomeReceived,
      setBudget, 
      getBudget, 
      currency,
      setCurrency,
      userName,
      setUserName,
      setProfilePicture,
      userProfile,
      theme,
      setTheme,
      isAuthenticated,
      isOnboardingComplete,
      loginIdentifier,
      login,
      startSignup,
      completeOnboarding,
      logout,
      checkUserExists,
      resetPassword,
      language,
      setLanguage,
      t: (key) => t(language, key),
      authError,
      chatHistory,
      addChatMessage,
      backupData,
      exportData,
      importData,
      restoreUserFromBackup,
      isSyncAuthRequired,
      completeSyncAuth,
      cancelSyncAuth,
      registerBiometric,
      verifyBiometricLogin,
      checkBiometricAvailability,
      isBiometricSupported,
      updateProfileState
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
