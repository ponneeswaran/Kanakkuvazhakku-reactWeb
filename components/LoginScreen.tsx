

import React, { useState, useEffect } from 'react';
import { Mail, ArrowRight, Smartphone, AlertCircle, Lock, ArrowLeft, CheckCircle2, Loader2, Fingerprint, User } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import OTPScreen from './OTPScreen';
import { sendOTPEmail } from '../services/emailService';

interface LoginScreenProps {
  onLoginSuccess: (identifier: string) => void;
  onShowTerms: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onShowTerms }) => {
  const { login, startSignup, checkUserExists, resetPassword, t, checkBiometricAvailability, verifyBiometricLogin } = useData();
  const [inputValue, setInputValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  
  // Forgot Password Flow State
  const [viewState, setViewState] = useState<'login' | 'forgot_input' | 'otp' | 'reset' | 'success'>('login');
  const [resetIdentifier, setResetIdentifier] = useState('');
  const [serverOtp, setServerOtp] = useState(''); // To verify against input in OTP screen
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const [canUseBiometric, setCanUseBiometric] = useState(false);

  // Check biometric availability when input changes
  useEffect(() => {
      const timer = setTimeout(() => {
          if (inputValue.length > 5) {
              setCanUseBiometric(checkBiometricAvailability(inputValue));
          } else {
              setCanUseBiometric(false);
          }
      }, 500);
      return () => clearTimeout(timer);
  }, [inputValue]);

  const validateIdentifier = (id: string) => {
      // Check if Email
      if (id.includes('@')) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(id);
      }
      // Check if Mobile (Allow digits, spaces, +, -)
      // Must have at least 10 digits
      const digits = id.replace(/\D/g, '');
      return digits.length >= 10;
  }

  const validate = () => {
      if (!validateIdentifier(inputValue)) {
          setError(t('Please enter a valid mobile number or email address.'));
          return false;
      }
      if (!isNewUser && viewState === 'login' && !password) {
          setError(t('Password is required.'));
          return false;
      }
      return true;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!inputValue) {
        setError(t('This field is required.'));
        return;
    }
    
    if (!validate()) return;
    
    // Use input directly as identifier
    const identifier = inputValue.trim();

    if (isNewUser) {
        // Start Registration Flow
        const success = startSignup(identifier);
        if (success) {
            onLoginSuccess(identifier);
        } else {
            setError(t('User already exists'));
        }
    } else {
        // Attempt Login
        const success = await login(identifier, password);
        if (success) {
            onLoginSuccess(identifier);
        } else {
            setError(t('Invalid credentials'));
        }
    }
  };

  const handleBiometricLogin = async () => {
      const identifier = inputValue.trim();
      const success = await verifyBiometricLogin(identifier);
      if (success) {
          onLoginSuccess(identifier);
      } else {
          setError(t('biometric_login_failed'));
      }
  }

  const handleForgotPasswordClick = () => {
    setResetIdentifier('');
    setError('');
    setViewState('forgot_input');
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!validateIdentifier(resetIdentifier)) {
        setError(t('Please enter a valid mobile number or email address.'));
        return;
    }

    // Check if user exists
    if (!checkUserExists(resetIdentifier)) {
        setError(t('User not found'));
        return;
    }

    setIsSendingOtp(true);
    try {
        // Generate random 4 digit OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();
        
        // Use service to send email/mock
        await sendOTPEmail(resetIdentifier, otp);
        
        setServerOtp(otp);
        setViewState('otp');
    } catch (err) {
        setError('Failed to send OTP. Please try again.');
    } finally {
        setIsSendingOtp(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      if (error) setError('');
  };

  const toggleMode = () => {
      setIsNewUser(!isNewUser);
      setError('');
      setPassword('');
  }

  const handleOTPVerify = () => {
      setViewState('reset');
  }

  const handleResetSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmNewPassword) {
          setError(t('passwords_mismatch'));
          return;
      }
      
      const success = resetPassword(resetIdentifier, newPassword);
      if (success) {
          setViewState('success');
      } else {
          setError('Failed to reset password');
      }
  }

  // Render Forgot Input View (Mobile or Email)
  if (viewState === 'forgot_input') {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col p-6 animate-fade-in transition-colors">
            <header className="mb-8 pt-2">
                <button 
                onClick={() => setViewState('login')}
                className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
                >
                <ArrowLeft size={24} />
                </button>
            </header>
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('Forgot Password')}</h1>
                <p className="text-gray-500 dark:text-slate-400 mb-6">{t('Enter your identifier to reset password')}</p>
                
                <form onSubmit={handleSendOtp} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('Mobile Number or Email')}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                            <input
                                type="text"
                                value={resetIdentifier}
                                onChange={(e) => {
                                    setResetIdentifier(e.target.value);
                                    if(error) setError('');
                                }}
                                className={`w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-800 border ${error ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors`}
                                placeholder={t('Enter mobile # or email')}
                                autoFocus
                            />
                        </div>
                    </div>
                    
                    {error && (
                        <div className="flex items-center text-red-500 text-xs animate-fade-in">
                            <AlertCircle size={12} className="mr-1" />
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSendingOtp}
                        className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] flex items-center justify-center space-x-2 disabled:opacity-70 disabled:shadow-none"
                    >
                        {isSendingOtp ? (
                            <>
                                <Loader2 className="animate-spin" size={20}/>
                                <span>{t('Sending...')}</span>
                            </>
                        ) : (
                            <span>{t('Send OTP')}</span>
                        )}
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // Render OTP Screen
  if (viewState === 'otp') {
      return (
          <OTPScreen 
            identifier={resetIdentifier}
            onVerify={handleOTPVerify}
            onBack={() => setViewState('forgot_input')}
            correctOtp={serverOtp} // Pass generated OTP for validation
          />
      );
  }

  // Render Reset Password Form
  if (viewState === 'reset') {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col p-6 animate-fade-in transition-colors">
            <header className="mb-8 pt-2">
                <button 
                onClick={() => setViewState('login')}
                className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
                >
                <ArrowLeft size={24} />
                </button>
            </header>
            <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t('Reset Password')}</h1>
                <form onSubmit={handleResetSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('New Password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors"
                                placeholder="••••••••"
                                required
                                minLength={8}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('Confirm New Password')}</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                            <input
                                type="password"
                                value={confirmNewPassword}
                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>
                     {error && (
                        <div className="flex items-center text-red-500 text-xs animate-fade-in">
                            <AlertCircle size={12} className="mr-1" />
                            {error}
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98]"
                    >
                        {t('Reset Password')}
                    </button>
                </form>
            </div>
        </div>
      );
  }

  // Render Success Screen
  if (viewState === 'success') {
      return (
         <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col p-6 animate-fade-in transition-colors items-center justify-center">
             <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-lg border border-gray-100 dark:border-slate-700 text-center max-w-sm w-full">
                 <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                     <CheckCircle2 size={32} />
                 </div>
                 <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('Password Reset Successfully')}</h2>
                 <p className="text-gray-500 dark:text-slate-400 text-sm mb-6">You can now login with your new password.</p>
                 <button 
                    onClick={() => {
                        setViewState('login');
                        setNewPassword('');
                        setConfirmNewPassword('');
                        setPassword('');
                        setInputValue('');
                    }}
                    className="w-full bg-teal-600 text-white py-3 rounded-xl font-bold hover:bg-teal-700 transition-colors"
                 >
                     {t('Back to Login')}
                 </button>
             </div>
         </div>
      )
  }

  // Render Login/Signup Screen
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col p-6 animate-fade-in transition-colors">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{isNewUser ? t('Create Your Account') : t('Welcome')}</h1>
            <p className="text-gray-500 dark:text-slate-400">{t('login_subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('Mobile Number or Email')}</label>
                <div className="relative">
                    <User className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                    <input
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={t('Enter mobile # or email')}
                        className={`w-full pl-10 pr-4 py-3.5 bg-white dark:bg-slate-800 border ${error ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white font-medium transition-colors`}
                        required
                    />
                </div>
            </div>

            {!isNewUser && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('Password')}</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-500" size={18} />
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => { setPassword(e.target.value); setError(''); }}
                            className={`w-full pl-10 pr-12 py-3.5 bg-white dark:bg-slate-800 border ${error ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors`}
                            placeholder="••••••••"
                            required
                        />
                         {canUseBiometric && (
                            <button 
                                type="button"
                                onClick={handleBiometricLogin}
                                className="absolute right-3 top-3.5 text-teal-600 dark:text-teal-400 hover:scale-110 transition-transform"
                                title={t('Login with Biometrics')}
                            >
                                <Fingerprint size={20} />
                            </button>
                        )}
                    </div>
                    {/* Forgot Password Link */}
                    <div className="flex justify-end mt-2">
                        <button 
                            type="button" 
                            onClick={handleForgotPasswordClick} 
                            className="text-xs text-teal-600 dark:text-teal-400 font-medium hover:underline"
                        >
                            {t('Forgot Password?')}
                        </button>
                    </div>
                </div>
            )}

            {error && (
                <div className="flex items-center text-red-500 text-xs animate-fade-in">
                    <AlertCircle size={12} className="mr-1" />
                    {error}
                </div>
            )}

            <button
                type="submit"
                className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-2"
            >
                <span>{isNewUser ? t('Get Started') : t('Login')}</span>
                {!isNewUser && <ArrowRight size={20} />}
            </button>
        </form>

        <div className="mt-6 text-center">
            <button 
                onClick={toggleMode}
                className="text-teal-600 dark:text-teal-400 font-medium text-sm hover:underline"
            >
                {isNewUser ? t('Already have an account?') : t('Don\'t have an account?')}
            </button>
        </div>

        <p className="text-center mt-8 text-xs text-gray-400 dark:text-slate-500">
            {t('By continuing, you agree to our ')}
            <button onClick={onShowTerms} className="underline hover:text-teal-600 dark:hover:text-teal-400">
                {t('Terms of Service')}
            </button>
            {t(' and ')}
            <button onClick={onShowTerms} className="underline hover:text-teal-600 dark:hover:text-teal-400">
                {t('Privacy Policy')}
            </button>.
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;