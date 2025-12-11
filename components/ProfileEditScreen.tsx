
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { ArrowLeft, Save, User, Mail, Phone, AlertCircle, Camera } from 'lucide-react';
import ImageCropper from './ImageCropper';

interface ProfileEditScreenProps {
  onBack: () => void;
}

const ProfileEditScreen: React.FC<ProfileEditScreenProps> = ({ onBack }) => {
  const { userName, setUserName, userProfile, setProfilePicture, t } = useData();
  const [name, setName] = useState(userName);
  const [email, setEmail] = useState(userProfile?.email || '');
  const [phone, setPhone] = useState(userProfile?.mobile || '');
  const [error, setError] = useState('');
  
  // Image State
  const [previewImage, setPreviewImage] = useState<string | null>(userProfile?.profilePicture || null);
  const [croppingImage, setCroppingImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync with userProfile when it loads
  useEffect(() => {
      if (userProfile) {
          setName(userProfile.name || '');
          setEmail(userProfile.email || '');
          setPhone(userProfile.mobile || '');
          if (userProfile.profilePicture) {
              setPreviewImage(userProfile.profilePicture);
          }
      }
  }, [userProfile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
        setError('Name is required');
        return;
    }
    
    if (name.trim().length < 2) {
        setError('Name must be at least 2 characters long');
        return;
    }

    setUserName(name.trim());
    if (previewImage) {
        setProfilePicture(previewImage);
    }
    onBack();
  };

  const handleImageClick = () => {
      fileInputRef.current?.click();
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          // Size check before reading (Max 5MB for initial load)
          if (file.size > 5 * 1024 * 1024) {
              alert(t('Image too large. Please select an image under 5MB.'));
              return;
          }

          const reader = new FileReader();
          reader.onloadend = () => {
              // Open cropper instead of setting preview directly
              setCroppingImage(reader.result as string);
              // Reset input value so same file can be selected again if needed
              if (fileInputRef.current) fileInputRef.current.value = '';
          };
          reader.readAsDataURL(file);
      }
  }

  const handleCropComplete = (croppedImage: string) => {
      setPreviewImage(croppedImage);
      setCroppingImage(null);
  }

  return (
    <>
        <div className="h-full flex flex-col animate-fade-in bg-gray-50 dark:bg-slate-950 transition-colors">
        <div className="shrink-0 p-6 pb-2 z-10 bg-gray-50 dark:bg-slate-950 transition-colors">
            <header className="flex items-center space-x-3 py-2">
                <button 
                onClick={onBack}
                className="p-2 -ml-2 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-600 dark:text-slate-300 transition-colors"
                >
                <ArrowLeft size={24} />
                </button>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">{t('Edit Profile')}</h1>
            </header>
        </div>

        <div className="flex-1 overflow-y-auto p-6 pt-2 no-scrollbar">
            <form onSubmit={handleSave} className="space-y-6 max-w-md mx-auto w-full">
                <div className="flex justify-center mb-6">
                    <div className="relative group cursor-pointer" onClick={handleImageClick}>
                        <div className="w-28 h-28 bg-teal-100 dark:bg-teal-900/50 rounded-full flex items-center justify-center text-teal-700 dark:text-teal-400 text-4xl font-bold overflow-hidden shadow-inner border-4 border-white dark:border-slate-800">
                            {previewImage ? (
                                <img src={previewImage} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                name ? name.charAt(0).toUpperCase() : 'U'
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white" size={24} />
                        </div>
                        <div className="absolute bottom-1 right-1 bg-teal-600 p-2 rounded-full text-white shadow-lg border-2 border-white dark:border-slate-950">
                            <Camera size={14} />
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Full Name')}</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-400" size={18} />
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => {
                                    setName(e.target.value);
                                    if(error) setError('');
                                }}
                                className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border ${error ? 'border-red-500' : 'border-gray-200 dark:border-slate-700'} rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white transition-colors`}
                                placeholder={t('name_placeholder')}
                            />
                        </div>
                        {error && (
                            <div className="flex items-center mt-1 text-red-500 text-xs">
                                <AlertCircle size={12} className="mr-1" />
                                {error}
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Email')}</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                                placeholder="your@email.com"
                                disabled 
                            />
                        </div>
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 pl-1">{t('email_disabled_msg')}</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('Phone')}</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3.5 text-gray-400 dark:text-slate-400" size={18} />
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-900 dark:text-white"
                                placeholder="+91 98765 43210"
                                disabled
                            />
                        </div>
                    </div>
                </div>

                <button
                type="submit"
                className="w-full bg-teal-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-transform active:scale-[0.98] mt-8 flex items-center justify-center space-x-2"
                >
                <Save size={20} />
                <span>{t('Save Changes')}</span>
                </button>
            </form>
        </div>
        </div>

        {/* Cropper Modal */}
        {croppingImage && (
            <ImageCropper 
                imageSrc={croppingImage}
                onCancel={() => setCroppingImage(null)}
                onCrop={handleCropComplete}
            />
        )}
    </>
  );
};

export default ProfileEditScreen;
