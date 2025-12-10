import React, { useEffect } from 'react';
import { Wallet } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3000);

    return () => clearTimeout(timer);
  }, [onFinish]);

  // Point to the local asset in the assets folder
  const BG_IMAGE = "/assets/images/splash-background.jpg";

  return (
    <div className="fixed inset-0 bg-teal-900 flex flex-col items-center justify-center text-white z-50 animate-fade-in overflow-hidden">
      
      {/* Background Image & Overlay */}
      <div className="absolute inset-0 z-0">
        <img 
            src={BG_IMAGE} 
            alt="Splash Background" 
            className="w-full h-full object-cover opacity-80"
            onError={(e) => {
              // Hide image if failed to load (fallback to gradient)
              (e.target as HTMLImageElement).style.display = 'none';
            }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-teal-900 via-teal-900/70 to-teal-900/40 mix-blend-multiply" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center p-4">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full scale-150 animate-pulse"></div>
          <div className="relative bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl shadow-2xl animate-bounce-slow ring-1 ring-white/30">
              <Wallet size={64} className="text-white drop-shadow-md" />
          </div>
        </div>
        
        <div className="text-center space-y-3">
          <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-lg">Kanakkuvazhakku</h1>
          <p className="text-teal-100 font-medium text-sm tracking-[0.2em] uppercase drop-shadow-md bg-teal-900/30 py-1 px-4 rounded-full backdrop-blur-sm border border-white/10">
            Smart Expense Tracker
          </p>
        </div>
      </div>

      {/* Loading Bar */}
      <div className="absolute bottom-16 z-10 w-48 h-1 bg-white/20 rounded-full overflow-hidden backdrop-blur-sm">
        <div className="h-full bg-teal-300 shadow-[0_0_10px_rgba(94,234,212,0.8)] rounded-full animate-loading-bar"></div>
      </div>

      {/* Version Number */}
      <div className="absolute bottom-6 z-10 text-[10px] text-teal-100/50 font-medium tracking-widest">
        v1.2.8
      </div>
    </div>
  );
};

export default SplashScreen;