
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useData } from '../contexts/DataContext';

interface OTPScreenProps {
  identifier: string;
  onVerify: () => void;
  onBack: () => void;
  correctOtp?: string; // Optional prop to validate against a generated OTP
}

const OTPScreen: React.FC<OTPScreenProps> = ({ identifier, onVerify, onBack, correctOtp }) => {
  const { t } = useData();
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [timer, setTimer] = useState(30);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if identifier is email
  const isEmail = identifier.includes('@');

  // Simulate Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Simulate Auto-fill only if not email (or if strict security is not required)
  // For email flows, usually we want users to go check the email
  useEffect(() => {
    // Disable autofill simulation for email flows to make it feel more "real" that user checks email
    if (isEmail) return; 

    const timeout = setTimeout(() => {
      setIsAutoFilling(true);
      
      // Fill inputs one by one for effect
      const simulatedOTP = correctOtp ? correctOtp.split('') : ['4', '2', '8', '5'];
      
      let i = 0;
      const fillInterval = setInterval(() => {
        if (i < 4) {
          const val = simulatedOTP[i];
          const index = i; // capture index
          setOtp(prev => {
            const newOtp = [...prev];
            newOtp[index] = val;
            return newOtp;
          });
          inputs.current[i]?.focus();
          i++;
        } else {
          clearInterval(fillInterval);
          setIsAutoFilling(false);
          // Auto submit after fill
          setTimeout(() => handleVerify(simulatedOTP.join('')), 500);
        }
      }, 300);

    }, 2000); // Receive OTP after 2s

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [correctOtp, isEmail]);

  const handleChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    setError('');
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < 3) {
      inputs.current[index + 1]?.focus();
    }
    
    // Auto verify if full
    if (newOtp.every(d => d !== '') && index === 3) {
        handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = (code: string) => {
    setIsValidating(true);
    setError('');

    // If correctOtp is provided, validate against it
    if (correctOtp && code !== correctOtp) {
        setTimeout(() => {
            setIsValidating(false);
            setError(t('Invalid OTP'));
        }, 800);
        return;
    }

    setTimeout(() => {
        setIsValidating(false);
        onVerify();
    }, 1000);
  };

  return (
    <div className="h-screen w-full bg-gray-50 dark:bg-slate-900 flex flex-col p-6 animate-fade-in transition-colors overflow-y-auto no-scrollbar">
      <header className="mb-8 pt-2">
        <button 
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
      </header>

      <div className="flex-1 flex flex-col items-center max-w-md mx-auto w-full">
        <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t('Verification Code')}</h1>
            <p className="text-gray-500 dark:text-slate-400">
                {isEmail ? t('sent_to_email_msg') : t('otp_sent_msg')} <br/>
                <span className="font-semibold text-gray-800 dark:text-white">{identifier}</span>
            </p>
        </div>

        {/* OTP Inputs */}
        <div className="flex gap-4 mb-4">
            {otp.map((digit, index) => (
                <input
                    key={index}
                    ref={(el) => { inputs.current[index] = el; }}
                    type="number"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className={`w-14 h-16 rounded-xl border-2 ${error ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} bg-white dark:bg-slate-800 text-center text-2xl font-bold focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-gray-800 dark:text-white transition-all caret-teal-500`}
                />
            ))}
        </div>

        {error && (
            <div className="flex items-center text-red-500 text-xs mb-6 animate-fade-in">
                <AlertCircle size={12} className="mr-1" />
                {error}
            </div>
        )}

        {isAutoFilling && (
            <div className="flex items-center space-x-2 text-teal-600 dark:text-teal-400 mb-6 bg-teal-50 dark:bg-teal-900/20 px-4 py-2 rounded-full animate-pulse">
                <CheckCircle2 size={16} />
                <span className="text-sm font-medium">{t('Auto-filling from message...')}</span>
            </div>
        )}

        <button
            onClick={() => handleVerify(otp.join(''))}
            disabled={otp.some(d => !d) || isValidating}
            className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:shadow-none flex items-center justify-center space-x-2"
        >
            {isValidating ? (
                <>
                    <Loader2 className="animate-spin" size={20} />
                    <span>{t('Verifying...')}</span>
                </>
            ) : (
                <span>{t('Verify & Proceed')}</span>
            )}
        </button>

        <div className="mt-8 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400">
                {t('resend_otp_msg')}{' '}
                {timer > 0 ? (
                    <span className="font-medium text-teal-600 dark:text-teal-400">{t('Resend in')} {timer}s</span>
                ) : (
                    <button className="font-bold text-teal-600 dark:text-teal-400 hover:underline">
                        {isEmail ? t('Resend Email') : t('Resend SMS')}
                    </button>
                )}
            </p>
        </div>
      </div>
    </div>
  );
};

export default OTPScreen;
