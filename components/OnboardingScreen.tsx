

import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { User, Mail, Phone, Globe, DollarSign, Check, ChevronRight, Lock } from 'lucide-react';

const OnboardingScreen: React.FC = () => {
  const { loginIdentifier, completeOnboarding, t } = useData();
  
  // Detect if identifier is email or phone for auto-fill
  const isEmailLogin = loginIdentifier.includes('@');
  
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState(isEmailLogin ? '' : loginIdentifier);
  const [email, setEmail] = useState(isEmailLogin ? loginIdentifier : '');
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState('₹');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  
  const [errors, setErrors] = useState<{name?: string, mobile?: string, email?: string, password?: string, confirmPassword?: string}>({});

  // Password Requirements Logic
  const passwordChecks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[$!@#_&]/.test(password)
  };

  const validate = () => {
    const newErrors: any = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (!mobile.trim()) newErrors.mobile = 'Mobile number is required';
    if (!email.trim()) {
        newErrors.email = t('email_required');
    } else if (!email.includes('@')) {
        newErrors.email = 'Invalid email';
    }
    
    if (!password) {
        newErrors.password = 'Password is required';
    } else {
        if (!passwordChecks.length || !passwordChecks.upper || !passwordChecks.number || !passwordChecks.special) {
            newErrors.password = t('Password too weak');
        }
    }

    if (password !== confirmPassword) {
        newErrors.confirmPassword = t('passwords_mismatch');
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      completeOnboarding({
        name,
        mobile,
        email,
        language,
        currency,
        password
      });
    }
  };

  return (
    <div className="h-screen w-full bg-white dark:bg-slate-900 flex flex-col p-6 animate-fade-in transition-colors overflow-y-auto no-scrollbar">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full py-10">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t('Create Your Account')}</h1>
            <p className="text-gray-500 dark:text-slate-400">{t('onboarding_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('Full Name')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.name ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors`}
                        placeholder={t('name_placeholder')}
                    />
                </div>
                {errors.name && <p className="text-red-500 text-xs mt-1 ml-1">{errors.name}</p>}
            </div>

            {/* Mobile */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('Mobile Number')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Phone className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                    <input
                        type="tel"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.mobile ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors`}
                        placeholder="+91 99999 99999"
                    />
                </div>
                {errors.mobile && <p className="text-red-500 text-xs mt-1 ml-1">{errors.mobile}</p>}
            </div>

            {/* Email */}
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                    {t('Email Address')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Mail className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.email ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors`}
                        placeholder="you@example.com"
                    />
                </div>
                 {errors.email ? (
                     <p className="text-red-500 text-xs mt-1 ml-1">{errors.email}</p>
                 ) : (
                     <p className="text-gray-400 dark:text-slate-500 text-xs mt-1 ml-1">{t('email_backup_note')}</p>
                 )}
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        {t('Password')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setShowTooltip(true)}
                            onBlur={() => setShowTooltip(false)}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.password ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors`}
                            placeholder="••••••"
                        />
                        {showTooltip && (
                          <div className="absolute bottom-full left-0 mb-2 w-full min-w-[240px] bg-gray-900/95 text-white text-xs rounded-lg p-3 shadow-xl z-20 backdrop-blur-sm border border-gray-700 animate-fade-in">
                              <p className="font-bold mb-2 text-gray-200 border-b border-gray-700 pb-1">{t('Password Requirements')}:</p>
                              <ul className="space-y-1.5">
                                  <li className={`flex items-center space-x-2 ${passwordChecks.length ? 'text-green-400' : 'text-gray-400'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.length ? 'bg-green-400' : 'bg-gray-500'}`} />
                                      <span>{t('At least 8 characters')}</span>
                                  </li>
                                  <li className={`flex items-center space-x-2 ${passwordChecks.upper ? 'text-green-400' : 'text-gray-400'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.upper ? 'bg-green-400' : 'bg-gray-500'}`} />
                                      <span>{t('One uppercase letter')}</span>
                                  </li>
                                  <li className={`flex items-center space-x-2 ${passwordChecks.number ? 'text-green-400' : 'text-gray-400'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.number ? 'bg-green-400' : 'bg-gray-500'}`} />
                                      <span>{t('One number')}</span>
                                  </li>
                                  <li className={`flex items-center space-x-2 ${passwordChecks.special ? 'text-green-400' : 'text-gray-400'}`}>
                                      <div className={`w-1.5 h-1.5 rounded-full ${passwordChecks.special ? 'bg-green-400' : 'bg-gray-500'}`} />
                                      <span>{t('One special char ($!@#_&)')}</span>
                                  </li>
                              </ul>
                              {/* Arrow */}
                              <div className="absolute left-6 top-full w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-gray-900/95"></div>
                          </div>
                      )}
                    </div>
                    {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                        {t('Confirm Password')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-slate-800 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors`}
                            placeholder="••••••"
                        />
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs mt-1 ml-1">{errors.confirmPassword}</p>}
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Language */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Language')}</label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full pl-10 pr-8 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white appearance-none transition-colors"
                        >
                            <option value="en">English</option>
                            <option value="ta">தமிழ்</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-3.5 text-gray-400 rotate-90" size={16} />
                    </div>
                </div>

                {/* Currency */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Currency')}</label>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                        <select
                            value={currency}
                            onChange={(e) => setCurrency(e.target.value)}
                            className="w-full pl-10 pr-8 py-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white appearance-none transition-colors"
                        >
                            <option value="₹">INR (₹)</option>
                            <option value="$">USD ($)</option>
                            <option value="€">EUR (€)</option>
                            <option value="£">GBP (£)</option>
                            <option value="¥">JPY (¥)</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-3.5 text-gray-400 rotate-90" size={16} />
                    </div>
                </div>
            </div>

            <button
                type="submit"
                className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] mt-8 flex items-center justify-center space-x-2"
            >
                <span>{t('Get Started')}</span>
                <Check size={20} />
            </button>
        </form>
      </div>
    </div>
  );
};

export default OnboardingScreen;
