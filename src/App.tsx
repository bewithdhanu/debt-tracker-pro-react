import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import { AuthState, User } from './types/auth';
import AuthContainer from './components/AuthContainer';
import Layout from './components/Layout';
import DashboardHome from './components/DashboardHome';
import Contacts from './components/Contacts';
import Debts from './components/Debts';
import UserProfile from './components/UserProfile';
import Transactions from './components/Transactions';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider, useUser } from './contexts/UserContext';

// Wrap the main app content in this component to use the user context
const AppContent = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setLoading(false);
      } catch (error) {
        console.error('Error getting current user:', error);
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return user ? (
    <Routes>
      <Route path="/" element={
        <Layout user={user} activePage="dashboard">
          <DashboardHome user={user} />
        </Layout>
      } />
      <Route path="/debts" element={
        <Layout user={user} activePage="debts">
          <Debts user={user} />
        </Layout>
      } />
      <Route path="/contacts" element={
        <Layout user={user} activePage="contacts">
          <Contacts user={user} />
        </Layout>
      } />
      <Route path="/profile" element={
        <Layout user={user} activePage="profile">
          <UserProfile 
            user={user} 
            onBack={() => window.history.back()}
          />
        </Layout>
      } />
      <Route path="/transactions" element={
        <Layout user={user} activePage="transactions">
          <Transactions user={user} />
        </Layout>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  ) : (
    <div className="flex items-center justify-center min-h-screen p-4">
      <AuthContainer />
    </div>
  );
};

function App() {
  const [initialUser, setInitialUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        
        if (data?.user) {
          setInitialUser({
            id: data.user.id,
            email: data.user.email || '',
            name: data.user.user_metadata?.name || '',
          });
        }
        setLoading(false);
      } catch (error) {
        console.error('Error getting current user:', error);
        setLoading(false);
      }
    };

    getCurrentUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-950">
        <Toaster position="top-right" />
        <UserProvider initialUser={initialUser}>
          <AppContent />
        </UserProvider>
      </div>
    </Router>
  );
}

export default App;