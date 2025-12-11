
import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { User, Settings, Shield, LogOut, ChevronRight, ArrowLeft, Download, Upload, FileText, Fingerprint, ToggleLeft, ToggleRight } from 'lucide-react';
import EncryptionModal from './EncryptionModal';

interface AccountScreenProps {
  onBack: () => void;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
}

const AccountScreen: React.FC<AccountScreenProps> = ({ onBack, onNavigateToProfile, onNavigateToSettings }) => {
  const { userName, backupData, exportData, importData, logout, t, userProfile, isBiometricSupported, registerBiometric, updateProfileState } = useData();
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  // Encryption Modal State
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [encryptionMode, setEncryptionMode] = useState<'encrypt' | 'decrypt'>('encrypt');
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBackupClick = () => {
    setEncryptionMode('encrypt');
    setShowEncryptionModal(true);
  };

  const handleEncryptionConfirm = async (password: string | undefined) => {
      setShowEncryptionModal(false);

      if (encryptionMode === 'encrypt') {
          // Perform Backup
          setIsBackingUp(true);
          await backupData(password);
          setIsBackingUp(false);
      } else {
          // Perform Pending Import (Retry with password)
          if (pendingImportFile) {
              setIsImporting(true);
              try {
                  const success = await importData(pendingImportFile, password);
                  if (success) {
                      alert(t('Data imported successfully!'));
                  }
              } catch (e) {
                  alert("Failed to decrypt or import data. Incorrect password?");
              } finally {
                  setIsImporting(false);
                  setPendingImportFile(null);
              }
          }
      }
  };

  const handleExport = async () => {
    setIsExporting(true);
    await exportData();
    setIsExporting(false);
  }

  const handleImportClick = () => {
      fileInputRef.current?.click();
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          if (!confirm(t('import_confirm_msg'))) {
              e.target.value = ''; // Reset
              return;
          }

          setIsImporting(true);
          try {
              // Try importing without password first (default key)
              const success = await importData(file);
              if (success) {
                  alert(t('Data imported successfully!'));
              }
          } catch (err: any) {
              if (err.message === 'DECRYPTION_FAILED') {
                  // If default key fails, prompt for password
                  setPendingImportFile(file);
                  setEncryptionMode('decrypt');
                  setShowEncryptionModal(true);
              } else {
                  alert("Import failed: " + err.message);
              }
          } finally {
              setIsImporting(false);
          }
          
          e.target.value = ''; // Reset input
      }
  }

  const handleBiometricToggle = async () => {
      if (!userProfile) return;

      if (userProfile.biometricEnabled) {
          // Disable
          updateProfileState({ ...userProfile, biometricEnabled: false });
      } else {
          // Enable
          const success = await registerBiometric();
          if (success) {
              alert(t('biometric_reg_success'));
          } else {
             alert(t('biometric_reg_failed'));
          }
      }
  }

  const menuItems = [
    { icon: User, label: 'Profile', onClick: onNavigateToProfile },
    { icon: Settings, label: 'Settings', onClick: onNavigateToSettings },
  ];

  return (
    <div className="h-full flex flex-col animate-fade-in bg-gray-50 dark:bg-slate-950 transition-colors">
      <div className="shrink-0 p-6 pb-2 z-10 bg-gray-50 dark:bg-slate-950 transition-colors">
        <header className="flex items-center space-x-3 py-2">
            <button 
            onClick={onBack}
            className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
            >
            <ArrowLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Account')}</h1>
        </header>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pt-2 space-y-6 no-scrollbar">
        <div className="flex flex-col items-center justify-center py-8">
            <div className="w-24 h-24 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center text-teal-700 dark:text-teal-400 text-4xl font-bold mb-4 shadow-inner overflow-hidden border-4 border-white dark:border-slate-800">
            {userProfile?.profilePicture ? (
                <img src={userProfile.profilePicture} alt={userName} className="w-full h-full object-cover" />
            ) : (
                userName ? userName.charAt(0).toUpperCase() : 'U'
            )}
            </div>
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{userName || 'User'}</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">{userProfile?.email || t('Free Account')}</p>
        </div>

        <div className="max-w-2xl mx-auto w-full space-y-6">
            {/* Main Settings Menu */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
                {menuItems.map((item, index) => (
                <button
                    key={index}
                    onClick={item.onClick}
                    className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors ${
                    index !== menuItems.length - 1 ? 'border-b border-gray-100 dark:border-slate-700' : ''
                    }`}
                >
                    <div className="flex items-center space-x-3 text-gray-700 dark:text-slate-200">
                    <item.icon size={20} className="text-gray-500 dark:text-slate-400" />
                    <span className="font-medium">{t(item.label)}</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-slate-600" />
                </button>
                ))}
                
                {/* Security Section with Biometric Toggle */}
                <div className="p-4 border-t border-gray-100 dark:border-slate-700">
                    <div className="flex items-center space-x-3 text-gray-700 dark:text-slate-200 mb-2">
                        <Shield size={20} className="text-gray-500 dark:text-slate-400" />
                        <span className="font-medium">{t('Security and Privacy')}</span>
                    </div>
                    
                    {isBiometricSupported ? (
                        <div className="flex items-center justify-between pl-8 mt-3">
                            <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-slate-300">
                                <Fingerprint size={16} />
                                <span>{t('Biometric Unlock')}</span>
                            </div>
                            <button onClick={handleBiometricToggle} className="text-teal-600 dark:text-teal-400">
                                {userProfile?.biometricEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-300 dark:text-slate-600" />}
                            </button>
                        </div>
                    ) : (
                        <div className="pl-8 mt-2 text-xs text-gray-400">{t('biometric_not_supported')}</div>
                    )}
                </div>
            </div>

            {/* Data Management Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">{t('Data Management')}</h3>
                </div>
                
                <button
                    onClick={handleBackupClick}
                    disabled={isBackingUp}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700"
                >
                    <div className="flex items-center space-x-3 text-gray-700 dark:text-slate-200">
                    <Download size={20} className="text-teal-500" />
                    <div className="text-left">
                        <span className="font-medium block">{isBackingUp ? t('Sending Backup...') : t('Backup Data')}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{t('backup_desc')}</span>
                    </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-slate-600" />
                </button>

                <button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors border-b border-gray-100 dark:border-slate-700"
                >
                    <div className="flex items-center space-x-3 text-gray-700 dark:text-slate-200">
                    <FileText size={20} className="text-blue-500" />
                    <div className="text-left">
                        <span className="font-medium block">{isExporting ? t('Exporting...') : t('Export CSV')}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{t('export_desc')}</span>
                    </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-slate-600" />
                </button>

                <button
                    onClick={handleImportClick}
                    disabled={isImporting}
                    className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                    <div className="flex items-center space-x-3 text-gray-700 dark:text-slate-200">
                    <Upload size={20} className="text-purple-500" />
                    <div className="text-left">
                        <span className="font-medium block">{isImporting ? t('Importing...') : t('Import Backup')}</span>
                        <span className="text-xs text-gray-400 dark:text-slate-500">{t('import_desc')}</span>
                    </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 dark:text-slate-600" />
                </button>
                {/* Hidden File Input */}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept=".kbf" // Kanakku Backup File
                    onChange={handleFileChange}
                />
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden transition-colors">
                <button
                onClick={logout}
                className="w-full flex items-center justify-between p-4 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-red-600 dark:text-red-400"
                >
                <div className="flex items-center space-x-3">
                    <LogOut size={20} />
                    <span className="font-medium">{t('Log Out')}</span>
                </div>
                </button>
            </div>
        </div>
      </div>

      <EncryptionModal 
          isOpen={showEncryptionModal}
          mode={encryptionMode}
          onClose={() => {
              setShowEncryptionModal(false);
              setPendingImportFile(null);
          }}
          onConfirm={handleEncryptionConfirm}
      />
    </div>
  );
};

export default AccountScreen;
