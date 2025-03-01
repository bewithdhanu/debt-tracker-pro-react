import React from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/auth';
import { LogOut } from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardProps {
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Signed out successfully');
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('An error occurred while signing out');
      }
      console.error('Sign out error:', error);
    }
  };

  return (
    <div className="bg-gray-900 p-5 sm:p-6 md:p-8 rounded-xl shadow-2xl w-full max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white">Dashboard</h2>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg transition-colors duration-300 text-sm sm:text-base w-full sm:w-auto justify-center"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
      
      <div className="bg-gray-800 p-4 sm:p-6 rounded-lg mb-6">
        <h3 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4">
          {user.name ? `Welcome, ${user.name}!` : 'Welcome!'}
        </h3>
        <p className="text-gray-300 text-sm sm:text-base">
          You are signed in as: <span className="text-blue-400 break-all">{user.email}</span>
        </p>
        <p className="text-gray-300 mt-2 text-sm sm:text-base">
          User ID: <span className="text-blue-400 text-xs sm:text-sm break-all">{user.id}</span>
        </p>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg">
          <h4 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">Account Information</h4>
          <p className="text-gray-400 text-sm sm:text-base">This is where you can manage your account settings and preferences.</p>
        </div>
        
        <div className="bg-gray-800 p-4 sm:p-6 rounded-lg">
          <h4 className="text-base sm:text-lg font-medium text-white mb-2 sm:mb-3">Activity</h4>
          <p className="text-gray-400 text-sm sm:text-base">View your recent activity and account history here.</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;