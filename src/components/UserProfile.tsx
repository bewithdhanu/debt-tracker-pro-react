import React, { useState, useEffect } from 'react';
import { User } from '../types/auth';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save, Key, DollarSign, User as UserIcon, Mail, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface UserProfileProps {
  user: User;
  onBack: () => void;
}

interface ProfileFormData {
  name: string;
  email: string;
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

const CURRENCY_OPTIONS: CurrencyOption[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
];

const UserProfile: React.FC<UserProfileProps> = ({ user, onBack }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'preferences'>('profile');
  const [profileData, setProfileData] = useState<ProfileFormData>({
    name: user.name || '',
    email: user.email || '',
  });
  const [passwordData, setPasswordData] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    profile?: string;
    password?: string;
    preferences?: string;
  }>({});

  // Load user preferences from localStorage and Supabase
  useEffect(() => {
    // First check localStorage for currency preference
    const savedCurrency = localStorage.getItem('preferredCurrency');
    if (savedCurrency) {
      setSelectedCurrency(savedCurrency);
    }
    
    // Fetch profile data from Supabase
    const fetchProfileData = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('name, email, currency_preference')
          .eq('id', user.id)
          .single();
          
        if (error) {
          // If no profile exists, create one
          if (error.code === 'PGRST116') {
            const { error: insertError } = await supabase
              .from('profiles')
              .insert({
                id: user.id,
                name: user.name || '',
                email: user.email || '',
                currency_preference: savedCurrency || 'USD',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });
              
            if (insertError) {
              console.error('Error creating profile:', insertError);
            }
          } else {
            console.error('Error fetching profile:', error);
          }
        } else if (data) {
          // Update state with profile data
          setProfileData({
            name: data.name || user.name || '',
            email: data.email || user.email || '',
          });
          
          // If currency preference exists in database, use it (overrides localStorage)
          if (data.currency_preference) {
            setSelectedCurrency(data.currency_preference);
            // Also update localStorage to keep them in sync
            localStorage.setItem('preferredCurrency', data.currency_preference);
          }
        }
      } catch (error) {
        console.error('Error fetching profile data:', error);
      }
    };
    
    fetchProfileData();
  }, [user.id, user.name, user.email]);

  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedCurrency(e.target.value);
  };

  const validateProfileForm = (): boolean => {
    if (!profileData.name.trim()) {
      setErrors({ profile: 'Name is required' });
      return false;
    }
    
    if (!profileData.email.trim() || !/\S+@\S+\.\S+/.test(profileData.email)) {
      setErrors({ profile: 'Valid email is required' });
      return false;
    }
    
    setErrors({});
    return true;
  };

  const validatePasswordForm = (): boolean => {
    if (!passwordData.currentPassword) {
      setErrors({ password: 'Current password is required' });
      return false;
    }
    
    if (!passwordData.newPassword) {
      setErrors({ password: 'New password is required' });
      return false;
    }
    
    if (passwordData.newPassword.length < 6) {
      setErrors({ password: 'New password must be at least 6 characters' });
      return false;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrors({ password: 'Passwords do not match' });
      return false;
    }
    
    setErrors({});
    return true;
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateProfileForm()) return;
    
    setIsSubmitting(true);
    try {
      // Update profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: profileData.name,
          email: profileData.email,
          updated_at: new Date().toISOString(),
        });
        
      if (profileError) throw profileError;
      
      // Update email in auth if it changed
      if (profileData.email !== user.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: profileData.email,
        });
        
        if (emailError) throw emailError;
      }
      
      // Update user metadata to include the name
      const { error: metadataError } = await supabase.auth.updateUser({
        data: { name: profileData.name }
      });
      
      if (metadataError) throw metadataError;
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      if (error instanceof Error) {
        setErrors({ profile: error.message });
        toast.error(error.message);
      } else {
        setErrors({ profile: 'Failed to update profile' });
        toast.error('Failed to update profile');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordForm()) return;
    
    setIsSubmitting(true);
    try {
      // First verify the current password by trying to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordData.currentPassword,
      });
      
      if (signInError) {
        throw new Error('Current password is incorrect');
      }
      
      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });
      
      if (updateError) throw updateError;
      
      toast.success('Password updated successfully');
      
      // Reset password form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (error) {
      console.error('Error updating password:', error);
      if (error instanceof Error) {
        setErrors({ password: error.message });
        toast.error(error.message);
      } else {
        setErrors({ password: 'Failed to update password' });
        toast.error('Failed to update password');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    try {
      // Save currency preference to localStorage
      localStorage.setItem('preferredCurrency', selectedCurrency);
      
      // Also save to Supabase profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          currency_preference: selectedCurrency,
          updated_at: new Date().toISOString(),
        });
        
      if (error) throw error;
      
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Error updating preferences:', error);
      if (error instanceof Error) {
        setErrors({ preferences: error.message });
        toast.error(error.message);
      } else {
        setErrors({ preferences: 'Failed to update preferences' });
        toast.error('Failed to update preferences');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={onBack}
          className="p-1.5 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-white">
          Profile & Settings
        </h2>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'profile'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('profile')}
        >
          Profile
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'password'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('password')}
        >
          Password
        </button>
        <button
          className={`px-4 py-2 font-medium text-sm ${
            activeTab === 'preferences'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
          onClick={() => setActiveTab('preferences')}
        >
          Preferences
        </button>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <UserIcon size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">{user.name || 'User'}</h3>
              <p className="text-gray-400 text-sm">{user.email}</p>
            </div>
          </div>

          {errors.profile && (
            <div className="bg-red-900/30 border border-red-800 rounded-md p-3 mb-4 flex items-start">
              <AlertCircle size={16} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">{errors.profile}</p>
            </div>
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-xs font-medium text-gray-300 mb-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <UserIcon size={16} className="text-gray-400" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="Your full name"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail size={16} className="text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={profileData.email}
                  onChange={handleProfileChange}
                  className="w-full pl-10 pr-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                  placeholder="your.email@example.com"
                />
              </div>
              <p className="mt-1 text-xs text-gray-400">
                Changing your email will require verification
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                ) : (
                  <>
                    <Save size={16} />
                    Save Profile
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Password Tab */}
      {activeTab === 'password' && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <Key size={20} className="text-blue-400" />
            </div>
            <h3 className="text-white font-medium">Change Password</h3>
          </div>

          {errors.password && (
            <div className="bg-red-900/30 border border-red-800 rounded-md p-3 mb-4 flex items-start">
              <AlertCircle size={16} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">{errors.password}</p>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-xs font-medium text-gray-300 mb-1">
                Current Password
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-xs font-medium text-gray-300 mb-1">
                New Password
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                placeholder="••••••••"
              />
              <p className="mt-1 text-xs text-gray-400">
                Password must be at least 6 characters
              </p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-300 mb-1">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                ) : (
                  <>
                    <Key size={16} />
                    Update Password
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === 'preferences' && (
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center mr-3">
              <DollarSign size={20} className="text-blue-400" />
            </div>
            <h3 className="text-white font-medium">Display Preferences</h3>
          </div>

          {errors.preferences && (
            <div className="bg-red-900/30 border border-red-800 rounded-md p-3 mb-4 flex items-start">
              <AlertCircle size={16} className="text-red-400 mr-2 mt-0.5 flex-shrink-0" />
              <p className="text-red-300 text-sm">{errors.preferences}</p>
            </div>
          )}

          <form onSubmit={handleUpdatePreferences} className="space-y-4">
            <div>
              <label htmlFor="currency" className="block text-xs font-medium text-gray-300 mb-1">
                Currency
              </label>
              <select
                id="currency"
                name="currency"
                value={selectedCurrency}
                onChange={handleCurrencyChange}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              >
                {CURRENCY_OPTIONS.map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.symbol} - {currency.name} ({currency.code})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-400">
                This setting affects how currency amounts are displayed throughout the app
              </p>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex justify-center items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
                ) : (
                  <>
                    <Save size={16} />
                    Save Preferences
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserProfile;