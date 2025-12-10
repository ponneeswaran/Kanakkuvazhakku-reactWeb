

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { generateSpendingInsight } from '../services/geminiService';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip, PieChart, Pie, Cell } from 'recharts';
import { Sparkles, TrendingUp, ChevronDown, ChevronLeft, ChevronRight, PieChart as PieChartIcon, Calendar, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Category } from '../types';
import DatePicker from './DatePicker';

const COLORS = ['#0F766E', '#0D9488', '#14B8A6', '#2DD4BF', '#5EEAD4', '#99F6E4', '#CCFBF1', '#F59E0B'];

const CATEGORY_COLOR_MAP: Record<string, string> = {
  'Food': COLORS[0],
  'Transport': COLORS[1],
  'Entertainment': COLORS[2],
  'Utilities': COLORS[3],
  'Healthcare': COLORS[4],
  'Shopping': COLORS[5],
  'Housing': COLORS[6],
  'Other': COLORS[7]
};

type TimeRange = 'Daily' | 'Weekly' | 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly' | 'Custom';

interface DashboardProps {
  onProfileClick: () => void;
  onNavigateToHistory: (category: Category | 'All') => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onProfileClick, onNavigateToHistory }) => {
  const { expenses, incomes, budgets, currency, userName, userProfile, theme, t } = useData();
  const [insight, setInsight] = useState<string>('');
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  
  // Global Time Range State
  const [timeRange, setTimeRange] = useState<TimeRange>('Monthly');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Date Picker State
  const [datePickerConfig, setDatePickerConfig] = useState<{
      isOpen: boolean;
      mode: 'start' | 'end';
      initialDate?: Date;
  }>({ isOpen: false, mode: 'start' });

  // Chart specific view dates (navigation cursors)
  const [viewDate, setViewDate] = useState(new Date());
  const [categoryViewDate, setCategoryViewDate] = useState(new Date());

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  
  // Swipe State
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const overlayRef = useRef<HTMLDivElement>(null);

  // Load Insight
  useEffect(() => {
    const loadInsight = async () => {
      // Only trigger if data exists
      if ((expenses.length > 0 || incomes.length > 0) && !insight) {
        setIsLoadingInsight(true);
        try {
          const result = await generateSpendingInsight({ expenses, incomes, budgets, currency, userName });
          setInsight(result);
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingInsight(false);
        }
      }
    };
    loadInsight();
  }, [expenses.length, incomes.length, budgets, currency, userName]); 

  // Reset viewDates when global timeRange changes
  useEffect(() => {
    setViewDate(new Date());
    setCategoryViewDate(new Date());
  }, [timeRange]);

  // Handle clicking outside the overlay to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (activeCategory && overlayRef.current && !overlayRef.current.contains(event.target as Node)) {
        setActiveCategory(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeCategory]);

  const calculateDateNavigate = (currentDate: Date, range: TimeRange, direction: number) => {
    const d = new Date(currentDate);
    switch (range) {
        case 'Daily': 
            d.setDate(d.getDate() + (direction * 7)); // Trend chart moves 7 days
            break;
        case 'Weekly': 
            d.setDate(d.getDate() + (direction * 7 * 8)); 
            break;
        case 'Monthly': 
            d.setMonth(d.getMonth() + (direction * 6)); 
            break;
        case 'Quarterly': 
            d.setMonth(d.getMonth() + (direction * 3 * 4)); 
            break;
        case 'Half-Yearly':
             d.setMonth(d.getMonth() + (direction * 6 * 4)); 
             break;
        case 'Yearly': 
             d.setFullYear(d.getFullYear() + (direction * 5)); 
             break;
        case 'Custom':
             // No navigation for custom range
             break;
        default:
             break;
    }
    return d;
  };

  const calculateCategoryDateNavigate = (currentDate: Date, range: TimeRange, direction: number) => {
      const d = new Date(currentDate);
      switch (range) {
          case 'Daily': 
              d.setDate(d.getDate() + direction);
              break;
          case 'Weekly': 
              d.setDate(d.getDate() + (direction * 7));
              break;
          case 'Monthly': 
              d.setMonth(d.getMonth() + direction);
              break;
          case 'Quarterly': 
              d.setMonth(d.getMonth() + (direction * 3));
              break;
          case 'Half-Yearly':
               d.setMonth(d.getMonth() + (direction * 6));
               break;
          case 'Yearly': 
               d.setFullYear(d.getFullYear() + direction);
               break;
          case 'Custom':
               break;
          default:
               break;
      }
      return d;
  }

  const handleChartNavigate = (direction: number) => {
    setViewDate(calculateDateNavigate(viewDate, timeRange, direction));
  };

  const handleCategoryNavigate = (direction: number) => {
      setCategoryViewDate(calculateCategoryDateNavigate(categoryViewDate, timeRange, direction));
  }

  // --- Date Picker Logic ---
  const openDatePicker = (mode: 'start' | 'end') => {
      const currentVal = mode === 'start' ? customStart : customEnd;
      const initialDate = currentVal ? new Date(currentVal) : new Date();
      setDatePickerConfig({ isOpen: true, mode, initialDate });
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (datePickerConfig.mode === 'start') {
        setCustomStart(dateStr);
        if (customEnd && dateStr > customEnd) {
            setCustomEnd('');
        }
    } else {
        setCustomEnd(dateStr);
        if (customStart && customStart > dateStr) {
            setCustomStart('');
        }
    }
  };

  // --- Swipe Logic ---
  const onTouchStart = (e: React.TouchEvent) => {
      setTouchEnd(null);
      setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
      setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
      if (!touchStart || !touchEnd) return;
      const distance = touchStart - touchEnd;
      const isLeftSwipe = distance > 50;
      const isRightSwipe = distance < -50;
      
      if (timeRange !== 'Custom') {
        if (isLeftSwipe) handleChartNavigate(1);
        if (isRightSwipe) handleChartNavigate(-1);
      }
  };

  // Reusable Helper Functions for Keys
  const generateKeys = (range: TimeRange, referenceDate: Date) => {
      const keys: { key: string; label: string, start?: Date, end?: Date }[] = [];
      const now = new Date(referenceDate);

      if (range === 'Daily') {
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(d.getDate() - i);
          keys.push({
            key: d.toISOString().split('T')[0],
            label: d.toLocaleDateString('en-US', { weekday: 'short' }),
            start: new Date(d.setHours(0,0,0,0)),
            end: new Date(d.setHours(23,59,59,999))
          });
        }
      } else if (range === 'Weekly') {
        const currentMonday = new Date(now);
        const day = currentMonday.getDay() || 7;
        currentMonday.setDate(currentMonday.getDate() - day + 1);

        for (let i = 7; i >= 0; i--) {
          const d = new Date(currentMonday);
          d.setDate(d.getDate() - (i * 7));
          const endOfWeek = new Date(d);
          endOfWeek.setDate(d.getDate() + 6);
          keys.push({
            key: d.toISOString().split('T')[0], // key is start of week
            label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            start: new Date(d.setHours(0,0,0,0)),
            end: new Date(endOfWeek.setHours(23,59,59,999))
          });
        }
      } else if (range === 'Monthly') {
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0);
          keys.push({
            key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
            label: d.toLocaleDateString('en-US', { month: 'short' }),
            start: new Date(d.setHours(0,0,0,0)),
            end: new Date(endOfMonth.setHours(23,59,59,999))
          });
        }
      } else if (range === 'Quarterly') {
        for (let i = 3; i >= 0; i--) {
           const d = new Date(now.getFullYear(), now.getMonth() - (i * 3), 1);
           const q = Math.floor(d.getMonth() / 3) + 1;
           const year = d.getFullYear().toString().slice(-2);
           
           // Quarter start month index: 0, 3, 6, 9
           const qStartMonth = (q - 1) * 3;
           const startOfQuarter = new Date(d.getFullYear(), qStartMonth, 1);
           const endOfQuarter = new Date(d.getFullYear(), qStartMonth + 3, 0);

           keys.push({
             key: `${d.getFullYear()}-Q${q}`,
             label: `Q${q} '${year}`,
             start: new Date(startOfQuarter.setHours(0,0,0,0)),
             end: new Date(endOfQuarter.setHours(23,59,59,999))
           });
        }
      } else if (range === 'Half-Yearly') {
        for (let i = 3; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - (i * 6), 1);
            const h = d.getMonth() < 6 ? 1 : 2;
            const year = d.getFullYear().toString().slice(-2);
            
            const hStartMonth = h === 1 ? 0 : 6;
            const startOfHalf = new Date(d.getFullYear(), hStartMonth, 1);
            const endOfHalf = new Date(d.getFullYear(), hStartMonth + 6, 0);

            keys.push({
                key: `${d.getFullYear()}-H${h}`,
                label: `H${h} '${year}`,
                start: new Date(startOfHalf.setHours(0,0,0,0)),
                end: new Date(endOfHalf.setHours(23,59,59,999))
            });
        }
      } else if (range === 'Yearly') {
        for (let i = 4; i >= 0; i--) {
          const y = now.getFullYear() - i;
          const startOfYear = new Date(y, 0, 1);
          const endOfYear = new Date(y, 11, 31);
          keys.push({
            key: y.toString(),
            label: y.toString(),
            start: new Date(startOfYear.setHours(0,0,0,0)),
            end: new Date(endOfYear.setHours(23,59,59,999))
          });
        }
      } else if (range === 'Custom') {
          if (customStart && customEnd) {
             const s = new Date(customStart);
             const e = new Date(customEnd);
             // Limit to 30 points to prevent chart overcrowding if range is huge
             const diffTime = Math.abs(e.getTime() - s.getTime());
             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
             
             if (diffDays <= 31) {
                 // Daily breakdown
                 for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                     keys.push({
                         key: d.toISOString().split('T')[0],
                         label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                         start: new Date(d.setHours(0,0,0,0)),
                         end: new Date(d.setHours(23,59,59,999))
                     });
                 }
             } else {
                 keys.push({
                     key: 'custom-range',
                     label: 'Total',
                     start: new Date(s.setHours(0,0,0,0)),
                     end: new Date(e.setHours(23,59,59,999))
                 });
             }
          }
      }
      return keys;
  };

  const chartData = useMemo(() => {
      const keys = generateKeys(timeRange, viewDate);
      
      const data = keys.map(k => {
          let amount = 0;
          if (k.start && k.end) {
              amount = expenses
                .filter(e => {
                    const eDate = new Date(e.date);
                    // Use start and end of day logic
                    return eDate >= k.start! && eDate <= k.end!;
                })
                .reduce((sum, e) => sum + e.amount, 0);
          }
          return {
              name: k.label,
              amount: amount,
              key: k.key
          };
      });
      return data;
  }, [expenses, timeRange, viewDate, customStart, customEnd]);

  // Helper to get range bounds for single view
  const getCategoryRangeBounds = (range: TimeRange, date: Date) => {
      let start = new Date(date);
      let end = new Date(date);
      let label = '';

      if (range === 'Daily') {
          start.setHours(0,0,0,0);
          end.setHours(23,59,59,999);
          label = start.toLocaleDateString(undefined, {weekday: 'short', month: 'short', day: 'numeric'});
      } else if (range === 'Weekly') {
          const day = start.getDay() || 7;
          start.setDate(start.getDate() - day + 1);
          start.setHours(0,0,0,0);
          end = new Date(start);
          end.setDate(start.getDate() + 6);
          end.setHours(23,59,59,999);
          label = `${start.getDate()} ${start.toLocaleDateString(undefined, {month:'short'})} - ${end.getDate()} ${end.toLocaleDateString(undefined, {month:'short'})}`;
      } else if (range === 'Monthly') {
          start.setDate(1);
          start.setHours(0,0,0,0);
          end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
          label = start.toLocaleDateString(undefined, {month: 'long', year: 'numeric'});
      } else if (range === 'Quarterly') {
          const q = Math.floor(date.getMonth() / 3);
          start = new Date(date.getFullYear(), q * 3, 1);
          end = new Date(date.getFullYear(), q * 3 + 3, 0, 23, 59, 59);
          label = `Q${q+1} ${start.getFullYear()}`;
      } else if (range === 'Half-Yearly') {
          const h = date.getMonth() < 6 ? 0 : 1;
          start = new Date(date.getFullYear(), h * 6, 1);
          end = new Date(date.getFullYear(), h * 6 + 6, 0, 23, 59, 59);
          label = `H${h+1} ${start.getFullYear()}`;
      } else if (range === 'Yearly') {
          start = new Date(date.getFullYear(), 0, 1);
          end = new Date(date.getFullYear(), 11, 31, 23, 59, 59);
          label = start.getFullYear().toString();
      } else if (range === 'Custom') {
          if (customStart && customEnd) {
              start = new Date(customStart);
              start.setHours(0,0,0,0);
              end = new Date(customEnd);
              end.setHours(23,59,59,999);
              label = 'Custom Range';
          } else {
              // Invalid/Incomplete
              return { start: new Date(0), end: new Date(0), label: 'Select Range' };
          }
      }

      return { start, end, label };
  }

  const categoryStats = useMemo(() => {
    const { start, end, label } = getCategoryRangeBounds(timeRange, categoryViewDate);
    
    // Safety check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
         return { data: [], total: 0, label };
    }

    const relevantExpenses = expenses.filter(e => {
        const d = new Date(e.date);
        return d >= start && d <= end;
    });

    const breakdown: Record<string, number> = {};
    let total = 0;

    relevantExpenses.forEach(e => {
        breakdown[e.category] = (breakdown[e.category] || 0) + e.amount;
        total += e.amount;
    });

    const data = Object.entries(breakdown)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    return { data, total, label };
  }, [expenses, timeRange, categoryViewDate, customStart, customEnd]);

  const totalSpent = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [expenses]);
  
  // Total Income (Received Only)
  const totalIncome = useMemo(() => incomes.filter(i => i.status === 'Received').reduce((sum, i) => sum + i.amount, 0), [incomes]);

  // Net Balance
  const netBalance = totalIncome - totalSpent;

  // Recent expenses for the list (Limit to 5)
  const recentExpenses = useMemo(() => {
      return [...expenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [expenses]);

  return (
    <div className="p-4 pb-24 space-y-6 animate-fade-in landscape:pb-6 landscape:pr-24 min-h-full">
      {/* Header */}
      <header className="mb-4">
        <div className="flex justify-between items-start mb-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Ledger Summary')}</h1>
              <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">{t('Welcome,')} {userName}</p>
            </div>
            
            <button onClick={onProfileClick} className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-700 dark:text-teal-400 font-bold overflow-hidden border-2 border-white dark:border-slate-800 shadow-sm shrink-0">
               {userProfile?.profilePicture ? (
                   <img src={userProfile.profilePicture} alt={userName} className="w-full h-full object-cover" />
               ) : (
                   userName.charAt(0).toUpperCase()
               )}
            </button>
        </div>
      </header>

      {/* Insight Card */}
      <div className="bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={100} />
        </div>
        <div className="relative z-10">
            <div className="flex items-center space-x-2 mb-2">
                <Sparkles size={18} className="text-yellow-300" />
                <h3 className="font-bold text-sm uppercase tracking-wide opacity-90">{t('AI Assistant Insight')}</h3>
            </div>
            <p className="text-lg font-medium leading-relaxed">
                {isLoadingInsight ? (
                    <span className="flex items-center space-x-2">
                        <span className="animate-pulse">{t('Analyzing your finances...')}</span>
                    </span>
                ) : (
                    insight || t('Keep tracking your expenses to see insights!')
                )}
            </p>
        </div>
      </div>

      {/* Net Balance Card */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-700">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide">{t('Net Balance')}</h3>
          </div>
          <div className="text-3xl font-extrabold text-gray-900 dark:text-white mb-4">
              {currency}{netBalance.toFixed(2)}
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 dark:border-slate-700 pt-4">
               <div className="flex items-center space-x-2">
                   <ArrowDownCircle size={20} className="text-green-500" />
                   <div>
                       <p className="text-xs text-gray-400 dark:text-slate-500">{t('Income')}</p>
                       <p className="font-bold text-gray-800 dark:text-white">{currency}{totalIncome.toFixed(0)}</p>
                   </div>
               </div>
               <div className="flex items-center space-x-2">
                   <ArrowUpCircle size={20} className="text-red-500" />
                   <div>
                       <p className="text-xs text-gray-400 dark:text-slate-500">{t('Expense')}</p>
                       <p className="font-bold text-gray-800 dark:text-white">{currency}{totalSpent.toFixed(0)}</p>
                   </div>
               </div>
          </div>
      </div>

      {/* Time Frame Selection */}
      <div className="flex flex-col gap-2 relative">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-50 dark:border-slate-700">
              <span className="text-sm font-semibold text-gray-700 dark:text-slate-300 whitespace-nowrap mr-2">{t('Ledger time frame:')}</span>
              <div className="relative w-1/2">
                  <select 
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value as TimeRange)}
                      className="w-full bg-gray-100 dark:bg-slate-700 border border-transparent hover:border-gray-300 dark:hover:border-slate-500 rounded-lg text-xs font-semibold py-1.5 px-2 pr-6 appearance-none focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-white cursor-pointer transition-all"
                  >
                      <option value="Daily">{t('Daily')}</option>
                      <option value="Weekly">{t('Weekly')}</option>
                      <option value="Monthly">{t('Monthly')}</option>
                      <option value="Quarterly">{t('Quarterly')}</option>
                      <option value="Half-Yearly">{t('Half-Yearly')}</option>
                      <option value="Yearly">{t('Yearly')}</option>
                      <option value="Custom">{t('Custom')}</option>
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
          </div>

          {/* Custom Range Picker */}
          {timeRange === 'Custom' && (
              <div className="flex space-x-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in">
                    {/* Start Date Button */}
                    <button 
                        onClick={() => openDatePicker('start')}
                        className={`w-1/2 flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600`}
                    >
                        <span className={customStart ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                            {customStart ? new Date(customStart).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : "Start Date"}
                        </span>
                        <Calendar size={14} className="text-gray-400" />
                    </button>

                    {/* End Date Button */}
                    <button 
                        onClick={() => openDatePicker('end')}
                        className={`w-1/2 flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-medium transition-colors border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600`}
                    >
                        <span className={customEnd ? "text-gray-900 dark:text-white" : "text-gray-400"}>
                            {customEnd ? new Date(customEnd).toLocaleDateString(undefined, {month:'short', day:'numeric', year:'numeric'}) : "End Date"}
                        </span>
                        <Calendar size={14} className="text-gray-400" />
                    </button>
              </div>
          )}
      </div>

      <DatePicker 
          isOpen={datePickerConfig.isOpen}
          onClose={() => setDatePickerConfig(prev => ({ ...prev, isOpen: false }))}
          onSelect={handleDateSelect}
          initialDate={datePickerConfig.initialDate}
          title={datePickerConfig.mode === 'start' ? 'Start Date' : 'End Date'}
      />

      {/* Spending Trends Chart */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-700">
        <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
                <TrendingUp size={18} className="mr-2 text-teal-500" />
                {t('Spending Trends')}
            </h3>
        </div>

        <div 
            className="h-48 w-full select-none"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                    <defs>
                        <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#14B8A6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fontSize: 10, fill: '#94A3B8'}} 
                        interval="preserveStartEnd"
                    />
                    <YAxis hide />
                    <RechartsTooltip 
                        formatter={(value) => [`${currency}${value}`, 'Spent']}
                        contentStyle={{ backgroundColor: theme === 'dark' ? '#1E293B' : '#FFF', borderColor: theme === 'dark' ? '#334155' : '#E2E8F0', borderRadius: '8px', fontSize: '12px', color: theme === 'dark' ? '#FFF' : '#000' }}
                        itemStyle={{ color: theme === 'dark' ? '#FFF' : '#000' }}
                    />
                    <Area type="monotone" dataKey="amount" stroke="#0D9488" strokeWidth={2} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
        {timeRange !== 'Custom' && (
            <div className="flex justify-between items-center mt-2 px-2 text-xs text-gray-400 dark:text-slate-500">
                 <button onClick={() => handleChartNavigate(-1)}><ChevronLeft size={16} /></button>
                 <span>Swipe to navigate</span>
                 <button onClick={() => handleChartNavigate(1)}><ChevronRight size={16} /></button>
            </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-50 dark:border-slate-700">
          <div className="flex flex-col mb-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800 dark:text-white flex items-center">
                    <PieChartIcon size={18} className="mr-2 text-teal-500" />
                    {t('Category Breakdown')}
                </h3>
              </div>
              
              {/* Controls */}
              {timeRange !== 'Custom' && (
                  <div className="flex items-center justify-between mt-3 bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg">
                        <button onClick={() => handleCategoryNavigate(-1)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors text-gray-500 dark:text-slate-400">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-xs font-semibold text-gray-700 dark:text-slate-300">{categoryStats.label}</span>
                        <button onClick={() => handleCategoryNavigate(1)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-full transition-colors text-gray-500 dark:text-slate-400">
                            <ChevronRight size={16} />
                        </button>
                  </div>
              )}
          </div>

          {categoryStats.total === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 opacity-70">
                  <div className="w-16 h-16 bg-gray-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-2">
                      <PieChartIcon size={24} className="text-gray-400 dark:text-slate-500" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{t('No expenses found for this period')}</p>
              </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center animate-fade-in">
                <div className="h-48 w-48 relative mb-4 sm:mb-0 sm:mr-6">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={categoryStats.data}
                                cx="50%"
                                cy="50%"
                                innerRadius={40}
                                outerRadius={70}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {categoryStats.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={CATEGORY_COLOR_MAP[entry.name] || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    {/* Center Label */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                        <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase">{t('Total')}</span>
                        <span className="text-xs font-bold text-gray-800 dark:text-white">{currency}{categoryStats.total.toFixed(0)}</span>
                    </div>
                </div>
                
                <div className="flex-1 w-full space-y-2">
                    {categoryStats.data.slice(0, 4).map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-sm">
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CATEGORY_COLOR_MAP[item.name] || COLORS[index % COLORS.length] }}></div>
                                <span className="text-gray-700 dark:text-slate-300">{t(item.name)}</span>
                            </div>
                            <span className="font-medium text-gray-800 dark:text-white">{currency}{item.value.toFixed(0)}</span>
                        </div>
                    ))}
                    {categoryStats.data.length > 4 && (
                        <div className="text-xs text-center text-teal-600 dark:text-teal-400 pt-1">
                            + {categoryStats.data.length - 4} more
                        </div>
                    )}
                </div>
            </div>
          )}
      </div>

      {/* Recent Transactions Snippet */}
      <div>
         <div className="flex justify-between items-center mb-2 px-1">
            <h3 className="font-bold text-gray-800 dark:text-white">{t('Recent')}</h3>
            <button onClick={() => onNavigateToHistory('All')} className="text-teal-600 dark:text-teal-400 text-sm font-medium">
                {t('See All')}
            </button>
         </div>
         <div className="space-y-3">
             {recentExpenses.length === 0 ? (
                 <div className="text-center py-6 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
                     <p className="text-sm text-gray-400 dark:text-slate-500">{t('No expenses yet')}</p>
                 </div>
             ) : (
                recentExpenses.map(expense => (
                    <div key={expense.id} className="bg-white dark:bg-slate-800 p-3 rounded-xl shadow-sm border border-slate-50 dark:border-slate-700 flex justify-between items-center">
                        <div className="flex items-center space-x-3">
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
                                ${expense.category === 'Food' ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 
                                  expense.category === 'Transport' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' :
                                  'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-400'}
                             `}>
                                {expense.category[0]}
                             </div>
                             <div>
                                 <div className="font-medium text-sm text-gray-800 dark:text-white truncate max-w-[150px]">{expense.description}</div>
                                 <div className="text-xs text-gray-400 dark:text-slate-500">
                                     {new Date(expense.date).toLocaleDateString(undefined, {month:'short', day:'numeric'})}
                                 </div>
                             </div>
                        </div>
                        <span className="font-bold text-gray-800 dark:text-white text-sm">{currency}{expense.amount.toFixed(2)}</span>
                    </div>
                ))
             )}
         </div>
      </div>
    </div>
  );
};

export default Dashboard;