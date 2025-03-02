import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import AuthForm from './AuthForm';
import { AuthFormData } from '../types/auth';
import toast from 'react-hot-toast';
import { Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';

const AuthContainer: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUser } = useUser();

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
  };

  const handleAuth = async (data: AuthFormData) => {
    setLoading(true);
    try {
      if (isLogin) {
        // Sign in
        const { data: authData, error } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (error) throw error;

        // Success message
        toast.success('Signed in successfully!');
      } else {
        // Sign up
        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              name: data.name,
            },
          },
        });

        if (signUpError) throw signUpError;
        
        // Store user metadata in a profile table if needed
        if (signUpData.user) {
          const { error: metadataError } = await supabase
            .from('profiles')
            .upsert({
              id: signUpData.user.id,
              name: data.name,
              email: data.email,
              updated_at: new Date().toISOString(),
            });
            
          if (metadataError) {
            console.error('Error saving user profile:', metadataError);
            // Continue anyway as the auth account was created
          }
        }
        
        toast.success('Account created successfully!');
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An unexpected error occurred');
      }
      console.error('Authentication error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 p-4 rounded-lg shadow-2xl w-full max-w-sm mx-auto">
      <div className="flex flex-col items-center mb-4">
        <div className="bg-blue-600 p-2 rounded-full mb-3">
          <Lock size={20} className="text-white" />
        </div>
        <h2 className="text-lg font-bold text-white text-center">
          {isLogin ? 'Sign In to Your Account' : 'Create a New Account'}
        </h2>
        <p className="text-gray-400 mt-1 text-center text-xs">
          {isLogin
            ? 'Enter your credentials to access your account'
            : 'Fill out the form to create your account'}
        </p>
      </div>
      
      <AuthForm
        onSubmit={handleAuth}
        isLogin={isLogin}
        toggleAuthMode={toggleAuthMode}
        loading={loading}
      />
    </div>
  );
};

export default AuthContainer;