import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/auth';
import { supabase } from '../lib/supabase';

interface UserContextType {
  user: User | null;
  currency: {
    code: string;
    symbol: string;
  };
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateCurrency: (currencyCode: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
  initialUser: User | null;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children, initialUser }) => {
  const [user, setUser] = useState<User | null>(initialUser);
  const [currency, setCurrency] = useState<{ code: string; symbol: string }>(() => {
    const savedCurrency = localStorage.getItem('preferredCurrency') || 'USD';
    return {
      code: savedCurrency,
      symbol: getCurrencySymbol(savedCurrency),
    };
  });

  // Function to get currency symbol
  function getCurrencySymbol(currencyCode: string): string {
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
    }).format(0);
    return formatted.replace(/[\d\s.,]/g, '');
  }

  const updateUser = async (updates: Partial<User>) => {
    if (!user) return;

    try {
      // Update user metadata in Supabase Auth
      const { error: metadataError } = await supabase.auth.updateUser({
        data: updates,
      });

      if (metadataError) throw metadataError;

      // Update profile in Supabase
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString(),
        });

      if (profileError) throw profileError;

      // Update local state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const updateCurrency = async (currencyCode: string) => {
    if (!user) return;

    try {
      // Save to localStorage
      localStorage.setItem('preferredCurrency', currencyCode);

      // Save to Supabase profile
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          currency_preference: currencyCode,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      // Update local state
      setCurrency({
        code: currencyCode,
        symbol: getCurrencySymbol(currencyCode),
      });
    } catch (error) {
      console.error('Error updating currency preference:', error);
      throw error;
    }
  };

  return (
    <UserContext.Provider value={{ user, currency, updateUser, updateCurrency }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}; 