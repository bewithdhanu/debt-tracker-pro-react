import React, { useState, useEffect } from 'react';
import { User } from '../types/auth';
import { supabase } from '../lib/supabase';
import { 
  DollarSign, 
  Users, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  BarChart4, 
  PieChart, 
  CalendarClock,
  BadgeAlert,
  Wallet,
  CircleDollarSign,
  Hourglass
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, addMonths, isBefore } from 'date-fns';
import { useCurrency } from '../hooks/useCurrency';

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
  upcomingInterestPayments: any[];
  debtsByType: {
    iOwe: number;
    oweMe: number;
  };
  debtsByStatus: {
    active: number;
    completed: number;
  };
  monthlyInterestDue: number;
  monthlyInterestEarned: number;
  highestDebt: {
    amount: number;
    contactName: string;
    id: string;
    type: string;
  };
  oldestActiveDebt: {
    date: string;
    contactName: string;
    id: string;
    daysActive: number;
  };
}

const DashboardHome: React.FC<DashboardHomeProps> = ({ user }) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [stats, setStats] = useState<DashboardStats>({
    totalContacts: 0,
    totalDebts: 0,
    totalOwed: 0,
    totalOwing: 0,
    activeDebts: 0,
    completedDebts: 0,
    recentDebts: [],
    recentActivities: [],
    upcomingInterestPayments: [],
    debtsByType: {
      iOwe: 0,
      oweMe: 0
    },
    debtsByStatus: {
      active: 0,
      completed: 0
    },
    monthlyInterestDue: 0,
    monthlyInterestEarned: 0,
    highestDebt: {
      amount: 0,
      contactName: '',
      id: '',
      type: ''
    },
    oldestActiveDebt: {
      date: '',
      contactName: '',
      id: '',
      daysActive: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    fetchDashboardData();
  }, [user.id, timeframe]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch total contacts
      const { count: contactsCount, error: contactsError } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);
      
      if (contactsError) throw contactsError;
      
      // Fetch all debts for various calculations
      const { data: allDebts, error: allDebtsError } = await supabase
        .from('debts')
        .select(`
          *,
          contacts:contact_id (name)
        `)
        .eq('user_id', user.id);
      
      if (allDebtsError) throw allDebtsError;
      
      // Calculate various debt statistics
      const activeDebts = allDebts?.filter(debt => debt.status === 'active') || [];
      const completedDebts = allDebts?.filter(debt => debt.status === 'completed') || [];
      const iOweDebts = allDebts?.filter(debt => debt.type === 'I Owe') || [];
      const oweMeDebts = allDebts?.filter(debt => debt.type === 'Owe Me') || [];
      
      const totalOwed = oweMeDebts.reduce((sum, debt) => sum + debt.principal_amount, 0);
      const totalOwing = iOweDebts.reduce((sum, debt) => sum + debt.principal_amount, 0);
      
      // Calculate monthly interest
      const monthlyInterestDue = iOweDebts
        .filter(debt => debt.status === 'active')
        .reduce((sum, debt) => sum + (debt.principal_amount * debt.interest_rate / 100), 0);
      
      const monthlyInterestEarned = oweMeDebts
        .filter(debt => debt.status === 'active')
        .reduce((sum, debt) => sum + (debt.principal_amount * debt.interest_rate / 100), 0);
      
      // Find highest debt
      let highestDebt = { amount: 0, contactName: '', id: '', type: '' };
      if (allDebts && allDebts.length > 0) {
        const highest = [...allDebts].sort((a, b) => b.principal_amount - a.principal_amount)[0];
        highestDebt = {
          amount: highest.principal_amount,
          contactName: highest.contacts?.name || 'Unknown',
          id: highest.id,
          type: highest.type
        };
      }
      
      // Find oldest active debt
      let oldestActiveDebt = { date: '', contactName: '', id: '', daysActive: 0 };
      if (activeDebts.length > 0) {
        const oldest = [...activeDebts].sort((a, b) => 
          new Date(a.debt_date).getTime() - new Date(b.debt_date).getTime()
        )[0];
        
        const startDate = new Date(oldest.debt_date);
        const today = new Date();
        const daysActive = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        oldestActiveDebt = {
          date: oldest.debt_date,
          contactName: oldest.contacts?.name || 'Unknown',
          id: oldest.id,
          daysActive
        };
      }
      
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
      
      // Calculate upcoming interest payments
      const upcomingInterestPayments = [];
      
      for (const debt of activeDebts) {
        // Get the most recent interest payment for this debt
        const { data: lastPayment, error: lastPaymentError } = await supabase
          .from('debt_activities')
          .select('*')
          .eq('debt_id', debt.id)
          .eq('activity_type', 'Interest')
          .order('activity_date', { ascending: false })
          .limit(1);
        
        if (lastPaymentError) throw lastPaymentError;
        
        let nextPaymentDate;
        if (lastPayment && lastPayment.length > 0) {
          // If there was a previous payment, the next one is a month after
          nextPaymentDate = addMonths(new Date(lastPayment[0].activity_date), 1);
        } else {
          // If no previous payment, use the debt start date + 1 month
          nextPaymentDate = addMonths(new Date(debt.debt_date), 1);
        }
        
        // Only include if the payment is due (today or in the past)
        // or within the next month
        const today = new Date();
        const nextMonth = addMonths(today, 1);
        
        if (isBefore(nextPaymentDate, nextMonth)) {
          const interestAmount = (debt.principal_amount * debt.interest_rate) / 100;
          
          upcomingInterestPayments.push({
            id: debt.id,
            contact_name: debt.contacts?.name || 'Unknown Contact',
            due_date: nextPaymentDate.toISOString(),
            amount: interestAmount,
            type: debt.type,
            is_overdue: isBefore(nextPaymentDate, today)
          });
        }
      }
      
      // Sort upcoming payments by date (earliest first)
      upcomingInterestPayments.sort((a, b) => 
        new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      );
      
      setStats({
        totalContacts: contactsCount || 0,
        totalDebts: allDebts?.length || 0,
        totalOwed,
        totalOwing,
        activeDebts: activeDebts.length,
        completedDebts: completedDebts.length,
        recentDebts: transformedDebts,
        recentActivities: recentActivities || [],
        upcomingInterestPayments: upcomingInterestPayments.slice(0, 5), // Limit to 5
        debtsByType: {
          iOwe: iOweDebts.length,
          oweMe: oweMeDebts.length
        },
        debtsByStatus: {
          active: activeDebts.length,
          completed: completedDebts.length
        },
        monthlyInterestDue,
        monthlyInterestEarned,
        highestDebt,
        oldestActiveDebt
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
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

  const handleViewDebt = (debtId: string) => {
    navigate(`/debts/${debtId}`);
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
      {/* Welcome Section */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-white mb-2">
          {user.name ? `Welcome, ${user.name.split(' ')[0]}!` : 'Welcome!'}
        </h3>
        <p className="text-gray-300 text-sm">
          Here's an overview of your financial activities and debt management.
        </p>
      </div>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Net Balance</p>
              <p className={`text-xl font-semibold mt-1 ${stats.totalOwed - stats.totalOwing >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(stats.totalOwed - stats.totalOwing)}
              </p>
            </div>
            <div className="bg-blue-500/20 p-2 rounded-lg">
              <Wallet size={20} className="text-blue-400" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            {stats.totalOwed - stats.totalOwing >= 0 
              ? "You're in a positive balance position"
              : "You're in a negative balance position"}
          </div>
        </div>
        
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-xs">Monthly Interest</p>
              <p className={`text-xl font-semibold mt-1 ${stats.monthlyInterestEarned - stats.monthlyInterestDue >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatCurrency(stats.monthlyInterestEarned - stats.monthlyInterestDue)}
              </p>
            </div>
            <div className="bg-purple-500/20 p-2 rounded-lg">
              <CircleDollarSign size={20} className="text-purple-400" />
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-400">
            {stats.monthlyInterestEarned > 0 && `Earning: ${formatCurrency(stats.monthlyInterestEarned)}`}
            {stats.monthlyInterestDue > 0 && stats.monthlyInterestEarned > 0 && ' | '}
            {stats.monthlyInterestDue > 0 && `Paying: ${formatCurrency(stats.monthlyInterestDue)}`}
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
          <div className="mt-3 text-xs text-gray-400">
            From {stats.debtsByType.oweMe} {stats.debtsByType.oweMe === 1 ? 'person' : 'people'}
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
          <div className="mt-3 text-xs text-gray-400">
            To {stats.debtsByType.iOwe} {stats.debtsByType.iOwe === 1 ? 'person' : 'people'}
          </div>
        </div>
      </div>
      
      {/* Debt Status and Upcoming Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Debt Status */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-medium text-white flex items-center">
              <BarChart4 size={18} className="mr-2 text-blue-400" />
              Debt Status Overview
            </h4>
            <Link to="/debts" className="text-blue-400 text-xs hover:underline">View all</Link>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Active Debts</span>
                <span className="text-blue-400">{stats.activeDebts} of {stats.totalDebts}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${stats.totalDebts > 0 ? (stats.activeDebts / stats.totalDebts * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Completed Debts</span>
                <span className="text-green-400">{stats.completedDebts} of {stats.totalDebts}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ width: `${stats.totalDebts > 0 ? (stats.completedDebts / stats.totalDebts * 100) : 0}%` }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Money You Owe</span>
                <span className="text-red-400">{formatCurrency(stats.totalOwing)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-red-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${(stats.totalOwed + stats.totalOwing) > 0 
                      ? (stats.totalOwing / (stats.totalOwed + stats.totalOwing) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-300">Money Owed to You</span>
                <span className="text-green-400">{formatCurrency(stats.totalOwed)}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full" 
                  style={{ 
                    width: `${(stats.totalOwed + stats.totalOwing) > 0 
                      ? (stats.totalOwed / (stats.totalOwed + stats.totalOwing) * 100) 
                      : 0}%` 
                  }}
                ></div>
              </div>
            </div>
            
            {/* Key Insights */}
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
              {stats.highestDebt.amount > 0 && (
                <div className="flex items-start">
                  <div className={`p-1.5 rounded-full mr-2 ${stats.highestDebt.type === 'I Owe' ? 'bg-red-500/20' : 'bg-green-500/20'}`}>
                    <DollarSign size={14} className={stats.highestDebt.type === 'I Owe' ? 'text-red-400' : 'text-green-400'} />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Highest Debt</p>
                    <p className="text-sm text-white">
                      {formatCurrency(stats.highestDebt.amount)} {stats.highestDebt.type === 'I Owe' ? 'to' : 'from'} {stats.highestDebt.contactName}
                    </p>
                  </div>
                </div>
              )}
              
              {stats.oldestActiveDebt.date && (
                <div className="flex items-start">
                  <div className="p-1.5 rounded-full mr-2 bg-yellow-500/20">
                    <Hourglass size={14} className="text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Oldest Active Debt</p>
                    <p className="text-sm text-white">
                      {stats.oldestActiveDebt.daysActive} days old ({formatDate(stats.oldestActiveDebt.date)})
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Upcoming Interest Payments */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-medium text-white flex items-center">
              <CalendarClock size={18} className="mr-2 text-blue-400" />
              Upcoming Interest Payments
            </h4>
          </div>
          
          {stats.upcomingInterestPayments.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingInterestPayments.map((payment) => (
                <div 
                  key={`${payment.id}-${payment.due_date}`} 
                  className="flex justify-between items-center p-2 hover:bg-gray-750 rounded-md cursor-pointer"
                  onClick={() => handleViewDebt(payment.id)}
                >
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${
                      payment.is_overdue 
                        ? 'bg-red-500/20' 
                        : payment.type === 'I Owe' 
                          ? 'bg-red-500/20' 
                          : 'bg-green-500/20'
                    }`}>
                      {payment.is_overdue ? (
                        <BadgeAlert size={16} className="text-red-400" />
                      ) : (
                        <Calendar size={16} className={payment.type === 'I Owe' ? 'text-red-400' : 'text-green-400'} />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center">
                        <p className="text-white text-sm">{payment.contact_name}</p>
                        {payment.is_overdue && (
                          <span className="ml-2 text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded-full">
                            Overdue
                          </span>
                        )}
                      </div>
                      <p className="text-gray-400 text-xs">Due: {formatDate(payment.due_date)}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${payment.type === 'I Owe' ? 'text-red-400' : 'text-green-400'}`}>
                      {formatCurrency(payment.amount)}
                    </p>
                    <p className="text-gray-400 text-xs">{payment.type}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 text-sm text-center py-4">No upcoming interest payments.</p>
          )}
          
          {/* Interest Payment Summary */}
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-750 p-3 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Monthly Interest Due</p>
                <p className="text-red-400 text-lg font-medium">{formatCurrency(stats.monthlyInterestDue)}</p>
              </div>
              <div className="bg-gray-750 p-3 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Monthly Interest Earned</p>
                <p className="text-green-400 text-lg font-medium">{formatCurrency(stats.monthlyInterestEarned)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-3">
            <h4 className="text-base font-medium text-white flex items-center">
              <DollarSign size={18} className="mr-2 text-blue-400" />
              Recent Debts
            </h4>
            <Link to="/debts" className="text-blue-400 text-xs hover:underline">View all</Link>
          </div>
          
          {stats.recentDebts.length > 0 ? (
            <div className="space-y-3">
              {stats.recentDebts.map((debt) => (
                <div 
                  key={debt.id} 
                  className="flex justify-between items-center p-2 hover:bg-gray-750 rounded-md cursor-pointer"
                  onClick={() => handleViewDebt(debt.id)}
                >
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
            <h4 className="text-base font-medium text-white flex items-center">
              <Clock size={18} className="mr-2 text-blue-400" />
              Recent Activities
            </h4>
          </div>
          
          {stats.recentActivities.length > 0 ? (
            <div className="space-y-3">
              {stats.recentActivities.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex justify-between items-center p-2 hover:bg-gray-750 rounded-md cursor-pointer"
                  onClick={() => handleViewDebt(activity.debt_id)}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
                      {activity.activity_type === 'Interest' ? (
                        <TrendingUp size={16} className="text-yellow-400" />
                      ) : (
                        <FileText size={16} className="text-purple-400" />
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
      
      {/* Quick Actions */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <h4 className="text-base font-medium text-white mb-3">Quick Actions</h4>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link to="/contacts?addNew=true" className="bg-gray-750 p-3 rounded-md hover:bg-gray-700 transition-colors">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center mr-2">
                <Users size={16} className="text-blue-400" />
              </div>
              <p className="text-white text-sm font-medium">Add Contact</p>
            </div>
            <p className="text-gray-400 text-xs">Create a new contact record</p>
          </Link>
          
          <Link to="/debts?addNew=true" className="bg-gray-750 p-3 rounded-md hover:bg-gray-700 transition-colors">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center mr-2">
                <DollarSign size={16} className="text-green-400" />
              </div>
              <p className="text-white text-sm font-medium">Add Debt</p>
            </div>
            <p className="text-gray-400 text-xs">Record a new debt or loan</p>
          </Link>
          
          <Link to="/contacts" className="bg-gray-750 p-3 rounded-md hover:bg-gray-700 transition-colors">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center mr-2">
                <Users size={16} className="text-purple-400" />
              </div>
              <p className="text-white text-sm font-medium">View Contacts</p>
            </div>
            <p className="text-gray-400 text-xs">Manage your contacts</p>
          </Link>
          
          <Link to="/debts" className="bg-gray-750 p-3 rounded-md hover:bg-gray-700 transition-colors">
            <div className="flex items-center mb-2">
              <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center mr-2">
                <BarChart4 size={16} className="text-yellow-400" />
              </div>
              <p className="text-white text-sm font-medium">View Debts</p>
            </div>
            <p className="text-gray-400 text-xs">Manage your debts and loans</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;