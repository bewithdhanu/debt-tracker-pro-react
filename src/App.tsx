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
import { UserProvider } from './contexts/UserContext';

function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Check for the current user on initial load
    const getCurrentUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        
        if (data?.user) {
          setAuthState({
            user: {
              id: data.user.id,
              email: data.user.email || '',
              name: data.user.user_metadata?.name || '',
            },
            loading: false,
          });
        } else {
          setAuthState({
            user: null,
            loading: false,
          });
        }
      } catch (error) {
        console.error('Error getting current user:', error);
        setAuthState({
          user: null,
          loading: false,
        });
      }
    };

    getCurrentUser();

    // Set up auth state listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setAuthState({
            user: {
              id: session.user.id,
              email: session.user.email || '',
              name: session.user.user_metadata?.name || '',
            },
            loading: false,
          });
        } else if (event === 'SIGNED_OUT') {
          setAuthState({
            user: null,
            loading: false,
          });
        }
      }
    );

    return () => {
      if (authListener?.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  if (authState.loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-950">
        <Toaster 
          position="top-right"
          toastOptions={{
            style: {
              background: '#333',
              color: '#fff',
            },
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
        
        {authState.user ? (
          <UserProvider initialUser={authState.user}>
            <Routes>
              <Route path="/" element={
                <Layout user={authState.user} activePage="dashboard">
                  <DashboardHome user={authState.user} />
                </Layout>
              } />
              <Route path="/debts" element={
                <Layout user={authState.user} activePage="debts">
                  <Debts user={authState.user} />
                </Layout>
              } />
              <Route path="/debts/:debtId" element={
                <Layout user={authState.user} activePage="debts">
                  <Debts user={authState.user} />
                </Layout>
              } />
              <Route path="/contacts" element={
                <Layout user={authState.user} activePage="contacts">
                  <Contacts user={authState.user} />
                </Layout>
              } />
              <Route path="/contacts/:contactId" element={
                <Layout user={authState.user} activePage="contacts">
                  <Contacts user={authState.user} />
                </Layout>
              } />
              <Route path="/profile" element={
                <Layout user={authState.user} activePage="profile">
                  <UserProfile 
                    user={authState.user} 
                    onBack={() => window.history.back()}
                  />
                </Layout>
              } />
              <Route path="/transactions" element={
                <Layout user={authState.user} activePage="transactions">
                  <Transactions user={authState.user} />
                </Layout>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </UserProvider>
        ) : (
          <div className="flex items-center justify-center min-h-screen p-4">
            <AuthContainer />
          </div>
        )}
      </div>
    </Router>
  );
}

export default App;