import React, { useState, useEffect } from 'react';
import { User } from '../types/auth';
import { supabase } from '../lib/supabase';
import { DollarSign, Users, TrendingUp, ArrowUpRight, ArrowDownRight, Calendar, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface DashboardHomeProps {
  user: User;
}

interface DashboardStats {
  totalContacts: number;
  totalDebts: number;
  totalOwed: number;
  totalOwing: number;
  activeDebts: number;
  completedDebts: number;
  recentDebts: any[];
  recentActivities: any[];
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    totalDebts: 0,
    totalOwed: 0,
    totalOwing: 0,
    activeDebts: 0,
    completedDebts: 0,
    recentDebts: [],
    recentActivities: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user.id]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch total contacts
      const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (contactsError) throw contactsError;
      
      // Fetch total debts
      const { count: debtsCount, error: debtsError } = await supabase
        .from('debts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (debtsError) throw debtsError;
      
      // Fetch active debts count
      const { count: activeDebtsCount, error: activeDebtsError } = await supabase
        .from('debts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'active');
      
      if (activeDebtsError) throw activeDebtsError;
      
      // Fetch completed debts count
      const { count: completedDebtsCount, error: completedDebtsError } = await supabase
        .from('debts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'completed');
      
      if (completedDebtsError) throw completedDebtsError;
      
      // Fetch total amount owed to user
      const { data: owedData, error: owedError } = await supabase
        .from('debts')
        .select('principal_amount')
        .eq('user_id', user.id)
        .eq('type', 'Owe Me');
      
      if (owedError) throw owedError;
      
      const totalOwed = owedData.reduce((sum, debt) => sum + debt.principal_amount, 0);
      
      // Fetch total amount user owes
      const { data: owingData, error: owingError } = await supabase
        .from('debts')
        .select('principal_amount')
        .eq('user_id', user.id)
        .eq('type', 'I Owe');
      
      if (owingError) throw owingError;
      
      const totalOwing = owingData.reduce((sum, debt) => sum + debt.principal_amount, 0);
      
      // Fetch recent debts
      const { data: recentDebts, error: recentDebtsError } = await supabase
        .from('debts')
        .select(`
          *,
          contacts:contact_id (name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentDebtsError) throw recentDebtsError;
      
      // Transform the debts data to include contact_name
      const transformedDebts = recentDebts?.map(debt => ({
        ...debt,
        contact_name: debt.contacts?.name || 'Unknown Contact'
      })) || [];
      
      // Fetch recent activities
      const { data: recentActivities, error: recentActivitiesError } = await supabase
        .from('debt_activities')
        .select(`
          *,
          debts:debt_id (
            type,
            contacts:contact_id (name)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (recentActivitiesError) throw recentActivitiesError;
      
      setStats({
        totalContacts: contactsCount || 0,
        totalDebts: debtsCount || 0,
        totalOwed,
        totalOwing,
        activeDebts: activeDebtsCount || 0,
        completedDebts: completedDebtsCount || 0,
        recentDebts: transformedDebts,
        recentActivities: recentActivities || []
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">
          {user.name ? `Welcome, ${user.name.split(' ')[0]}!` : 'Welcome!'}
        </h3>
        <p className="text-gray-300 text-sm">
          Here's an overview of your financial activities and contacts.
        </p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Total Contacts</p>
              <p className="text-white text-xl font-semibold mt-1">{stats.totalContacts}</p>
            </div>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Users size={20} className="text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <Link to="/contacts" className="text-blue-400 text-xs hover:underline">View all contacts</Link>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Total Debts</p>
              <p className="text-white text-xl font-semibold mt-1">{stats.totalDebts}</p>
            </div>
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <DollarSign size={20} className="text-purple-400" />
            </div>
          </div>
          <div className="mt-3">
            <Link to="/debts" className="text-blue-400 text-xs hover:underline">View all debts</Link>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Total Owed to You</p>
              <p className="text-green-400 text-xl font-semibold mt-1">{formatCurrency(stats.totalOwed)}</p>
            </div>
            <div className="bg-green-500/20 p-2 rounded-lg">
              <ArrowUpRight size={20} className="text-green-400" />
            </div>
          </div>
          <div className="mt-3">
            <Link to="/debts" className="text-blue-400 text-xs hover:underline">View details</Link>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Total You Owe</p>
              <p className="text-red-400 text-xl font-semibold mt-1">{formatCurrency(stats.totalOwing)}</p>
            </div>
            <div className="bg-red-500/20 p-2 rounded-lg">
              <ArrowDownRight size={20} className="text-red-400" />
            </div>
          </div>
          <div className="mt-3">
            <Link to="/debts" className="text-blue-400 text-xs hover:underline">View details</Link>
          </div>
        </div>
      </div>
      
      {/* Debt Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Active Debts</p>
              <p className="text-blue-400 text-xl font-semibold mt-1">{stats.activeDebts}</p>
            </div>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <AlertCircle size={20} className="text-blue-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-blue-600 h-2.5 rounded-full" 
                style={{ width: `${stats.totalDebts > 0 ? (stats.activeDebts / stats.totalDebts * 100) : 0}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-xs mt-1">
              {stats.totalDebts > 0 
                ? `${Math.round(stats.activeDebts / stats.totalDebts * 100)}% of total debts` 
                : 'No debts recorded'}
            </p>
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Completed Debts</p>
              <p className="text-green-400 text-xl font-semibold mt-1">{stats.completedDebts}</p>
            </div>
            <div className="bg-green-500/20 p-2 rounded-lg">
              <CheckCircle size={20} className="text-green-400" />
            </div>
          </div>
          <div className="mt-3">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${stats.totalDebts > 0 ? (stats.completedDebts / stats.totalDebts * 100) : 0}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-xs mt-1">
              {stats.totalDebts > 0 
                ? `${Math.round(stats.completedDebts / stats.totalDebts * 100)}% of total debts` 
                : 'No debts recorded'}
            </p>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-medium text-white">Recent Debts</h4>
            <Link to="/debts" className="text-blue-400 text-xs hover:underline">View all</Link>
          </div>
          
          {stats.recentDebts.length > 0 ? (
            <div className="space-y-3">
              {stats.recentDebts.map((debt) => (
                <div key={debt.id} className="flex justify-between items-center p-2 hover:bg-gray-750 rounded-md">
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${debt.type === 'I Owe' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                      <DollarSign size={16} className={debt.type === 'I Owe' ? 'text-red-400' : 'text-green-400'} />
                    </div>
                    <div>
                      <p className="text-white text-sm">{debt.contact_name}</p>
                      <div className="flex items-center">
                        <p className="text-gray-400 text-xs mr-2">{formatDate(debt.debt_date)}</p>
                        {debt.status === 'completed' && (
                          <span className="text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded-full">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${debt.type === 'I Owe' ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(debt.principal_amount)}
                    </p>
                    <p className="text-gray-400 text-xs">{debt.interest_rate}% interest</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No debts recorded yet.</p>
          )}
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-medium text-white">Recent Activities</h4>
          </div>
          
          {stats.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <div key={activity.id} className="flex justify-between items-center p-2 hover:bg-gray-750 rounded-md">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
                      {activity.activity_type === 'Interest' ? (
                        <TrendingUp size={16} className="text-yellow-400" />
                      ) : (
                        <Calendar size={16} className="text-purple-400" />
                      )}
                    </div>
                    <div>
                      <p className="text-white text-sm">
                        {activity.activity_type}
                        {activity.closing_debt && (
                          <span className="ml-2 text-xs bg-green-900 text-green-300 px-1.5 py-0.5 rounded-full">
                            Closed Debt
                          </span>
                        )}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {activity.debts?.contacts?.name || 'Unknown'} - {formatDate(activity.activity_date)}
                      </p>
                    </div>
                  </div>
                  {activity.activity_type === 'Interest' && (
                    <p className="text-white text-sm font-medium">
                      {formatCurrency(activity.amount)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No activities recorded yet.</p>
          )}
        </div>
      </div>
      
      {/* Financial Summary */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="text-base font-medium text-white mb-3">Financial Summary</h4>
        
        <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-blue-500 h-4 rounded-full" 
            style={{ 
              width: `${stats.totalOwed > 0 ? (stats.totalOwed / (stats.totalOwed + stats.totalOwing) * 100) : 0}%` 
            }}
          ></div>
        </div>
        
        <div className="flex justify-between text-xs">
          <div>
            <p className="text-gray-400">Owed to you</p>
            <p className="text-green-400 font-medium">{formatCurrency(stats.totalOwed)}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-400">You owe</p>
            <p className="text-red-400 font-medium">{formatCurrency(stats.totalOwing)}</p>
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-gray-700">
          <p className="text-gray-400 text-xs">Net Balance</p>
          <p className={`text-lg font-semibold ${stats.totalOwed - stats.totalOwing >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {formatCurrency(stats.totalOwed - stats.totalOwing)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;