

export type Category = 
  | 'Food' 
  | 'Transport' 
  | 'Entertainment' 
  | 'Utilities' 
  | 'Healthcare' 
  | 'Shopping' 
  | 'Housing' 
  | 'Other';

export type IncomeCategory = 'Salary' | 'Rent' | 'Interest' | 'Business' | 'Gift' | 'Other';
export type Recurrence = 'None' | 'Monthly' | 'Yearly';
export type IncomeStatus = 'Expected' | 'Received' | 'Overdue';

export interface Expense {
  id: string;
  amount: number;
  category: Category;
  description: string;
  date: string; // ISO String
  paymentMethod: 'Cash' | 'Card' | 'UPI' | 'Other';
  createdAt: number;
}

export interface Income {
  id: string;
  amount: number;
  category: IncomeCategory;
  source: string; // Tenant Name, Employer, etc.
  date: string; // Due Date or Received Date
  recurrence: Recurrence;
  status: IncomeStatus;
  tenantContact?: string; // Mobile number for rent follow-up
  createdAt: number;
}

export interface Budget {
  category: Category;
  limit: number;
}

export interface UserContext {
  expenses: Expense[];
  incomes: Income[];
  budgets: Budget[];
  currency: string;
  userName?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  isThinking?: boolean;
}

export interface ExpenseStats {
  totalSpent: number;
  categoryBreakdown: Record<Category, number>;
  recentExpenses: Expense[];
  dailySpending: { date: string; amount: number }[];
}

export interface UserProfile {
  id: string;
  name: string;
  mobile: string;
  email: string;
  language: string;
  currency: string;
  password?: string; // Hashed/Encrypted
  profilePicture?: string; // Base64 Data URL
  biometricEnabled?: boolean;
  biometricCredentialId?: string; // Base64 Encoded Credential ID
}

export interface LocalBackup {
  id: string;
  date: string;
  userName: string;
  content: string; // Encrypted KBF content
  size: number;
}
