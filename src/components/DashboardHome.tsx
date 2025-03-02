// React and Routing
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Date Utilities
import { format, addMonths, isBefore } from 'date-fns';

// Icons
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeAlert,
  BarChart4,
  Calendar,
  CalendarClock,
  CircleDollarSign,
  Clock,
  DollarSign,
  FileText,
  Hourglass,
  TrendingUp,
  Users,
  Wallet
} from 'lucide-react';

// Local Imports
import { User } from '../types/auth';
import { supabase } from '../lib/supabase';
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

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  iconBgColor: string;
  valueColor: string;
  subtitle: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  icon, 
  iconBgColor, 
  valueColor, 
  subtitle 
}) => (
  <div className="bg-gray-800 p-4 rounded-lg">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-gray-400 text-xs">{title}</p>
        <p className={`text-xl font-semibold mt-1 ${valueColor}`}>{value}</p>
      </div>
      <div className={`${iconBgColor} p-2 rounded-lg`}>
        {icon}
      </div>
    </div>
    <div className="mt-3 text-xs text-gray-400">
      {subtitle}
    </div>
  </div>
);

interface ActivityItemProps {
  icon: React.ReactNode;
  iconBgColor: string;
  title: string;
  subtitle: string;
  amount?: string;
  amountColor?: string;
  badge?: {
    text: string;
    bgColor: string;
    textColor: string;
  };
  onClick?: () => void;
}

const ActivityItem: React.FC<ActivityItemProps> = ({
  icon,
  iconBgColor,
  title,
  subtitle,
  amount,
  amountColor = 'text-white',
  badge,
  onClick
}) => (
  <div 
    className="flex justify-between items-center p-2 hover:bg-gray-750 rounded-md cursor-pointer"
    onClick={onClick}
  >
    <div className="flex items-center">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${iconBgColor}`}>
        {icon}
      </div>
      <div>
        <div className="flex items-center">
          <p className="text-white text-sm">{title}</p>
          {badge && (
            <span className={`ml-2 text-xs ${badge.bgColor} ${badge.textColor} px-1.5 py-0.5 rounded-full`}>
              {badge.text}
            </span>
          )}
        </div>
        <p className="text-gray-400 text-xs">{subtitle}</p>
      </div>
    </div>
    {amount && (
      <p className={`text-sm font-medium ${amountColor}`}>
        {amount}
      </p>
    )}
  </div>
);

interface QuickActionProps {
  to: string;
  icon: React.ReactNode;
  iconBgColor: string;
  iconColor: string;
  title: string;
  description: string;
}

const QuickAction: React.FC<QuickActionProps> = ({
  to,
  icon,
  iconBgColor,
  iconColor,
  title,
  description
}) => (
  <Link to={to} className="bg-gray-750 p-3 rounded-md hover:bg-gray-700 transition-colors">
    <div className="flex items-center mb-2">
      <div className={`w-8 h-8 rounded-full ${iconBgColor} flex items-center justify-center mr-2`}>
        {React.cloneElement(icon as React.ReactElement, { size: 16, className: iconColor })}
      </div>
      <p className="text-white text-sm font-medium">{title}</p>
    </div>
    <p className="text-gray-400 text-xs">{description}</p>
  </Link>
);

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
        <MetricCard
          title="Net Balance"
          value={formatCurrency(stats.totalOwed - stats.totalOwing)}
          icon={<Wallet size={20} className="text-blue-400" />}
          iconBgColor="bg-blue-500/20"
          valueColor={stats.totalOwed - stats.totalOwing >= 0 ? 'text-green-400' : 'text-red-400'}
          subtitle={stats.totalOwed - stats.totalOwing >= 0 
            ? "You're in a positive balance position"
            : "You're in a negative balance position"}
        />
        
        <MetricCard
          title="Monthly Interest"
          value={formatCurrency(stats.monthlyInterestEarned - stats.monthlyInterestDue)}
          icon={<CircleDollarSign size={20} className="text-purple-400" />}
          iconBgColor="bg-purple-500/20"
          valueColor={stats.monthlyInterestEarned - stats.monthlyInterestDue >= 0 ? 'text-green-400' : 'text-red-400'}
          subtitle={`${stats.monthlyInterestEarned > 0 ? `Earning: ${formatCurrency(stats.monthlyInterestEarned)}` : ''}
            ${stats.monthlyInterestDue > 0 && stats.monthlyInterestEarned > 0 ? ' | ' : ''}
            ${stats.monthlyInterestDue > 0 ? `Paying: ${formatCurrency(stats.monthlyInterestDue)}` : ''}`}
        />
        
        <MetricCard
          title="Total Owed to You"
          value={formatCurrency(stats.totalOwed)}
          icon={<ArrowUpRight size={20} className="text-green-400" />}
          iconBgColor="bg-green-500/20"
          valueColor="text-green-400"
          subtitle={`From ${stats.debtsByType.oweMe} ${stats.debtsByType.oweMe === 1 ? 'person' : 'people'}`}
        />
        
        <MetricCard
          title="Total You Owe"
          value={formatCurrency(stats.totalOwing)}
          icon={<ArrowDownRight size={20} className="text-red-400" />}
          iconBgColor="bg-red-500/20"
          valueColor="text-red-400"
          subtitle={`To ${stats.debtsByType.iOwe} ${stats.debtsByType.iOwe === 1 ? 'person' : 'people'}`}
        />
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
                <ActivityItem
                  key={`${payment.id}-${payment.due_date}`}
                  icon={<Calendar size={16} className={payment.type === 'I Owe' ? 'text-red-400' : 'text-green-400'} />}
                  iconBgColor={`bg-${payment.type === 'I Owe' ? 'red' : 'green'}-500/20`}
                  title={payment.contact_name}
                  subtitle={`Due: ${formatDate(payment.due_date)}`}
                  amount={formatCurrency(payment.amount)}
                  amountColor={payment.type === 'I Owe' ? 'text-red-400' : 'text-green-400'}
                  badge={payment.is_overdue ? {
                    text: 'Overdue',
                    bgColor: 'bg-red-900',
                    textColor: 'text-red-300'
                  } : undefined}
                  onClick={() => handleViewDebt(payment.id)}
                />
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
                <ActivityItem
                  key={debt.id}
                  icon={<DollarSign size={16} className={debt.type === 'I Owe' ? 'text-red-400' : 'text-green-400'} />}
                  iconBgColor={`bg-${debt.type === 'I Owe' ? 'red' : 'green'}-500/20`}
                  title={debt.contact_name}
                  subtitle={`${formatDate(debt.debt_date)}`}
                  amount={formatCurrency(debt.principal_amount)}
                  amountColor={debt.type === 'I Owe' ? 'text-red-400' : 'text-green-400'}
                  onClick={() => handleViewDebt(debt.id)}
                />
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
                <ActivityItem
                  key={activity.id}
                  icon={<div className={`w-8 h-8 rounded-full bg-${activity.activity_type === 'Interest' ? 'yellow' : 'purple'}-500/20 flex items-center justify-center mr-2`}>
                    {activity.activity_type === 'Interest' ? (
                      <TrendingUp size={16} className="text-yellow-400" />
                    ) : (
                      <FileText size={16} className="text-purple-400" />
                    )}
                  </div>}
                  iconBgColor={`bg-${activity.activity_type === 'Interest' ? 'yellow' : 'purple'}-500/20`}
                  title={activity.activity_type}
                  subtitle={`${activity.debts?.contacts?.name || 'Unknown'} - ${formatDate(activity.activity_date)}`}
                  amount={activity.activity_type === 'Interest' ? formatCurrency(activity.amount) : undefined}
                  amountColor={activity.activity_type === 'Interest' ? 'text-yellow-400' : 'text-purple-400'}
                  onClick={() => handleViewDebt(activity.debt_id)}
                />
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
          <QuickAction
            to="/contacts?addNew=true"
            icon={<Users />}
            iconBgColor="bg-blue-500/20"
            iconColor="text-blue-400"
            title="Add Contact"
            description="Create a new contact record"
          />
          
          <QuickAction
            to="/debts?addNew=true"
            icon={<DollarSign />}
            iconBgColor="bg-green-500/20"
            iconColor="text-green-400"
            title="Add Debt"
            description="Record a new debt or loan"
          />
          
          <QuickAction
            to="/contacts"
            icon={<Users />}
            iconBgColor="bg-purple-500/20"
            iconColor="text-purple-400"
            title="View Contacts"
            description="Manage your contacts"
          />
          
          <QuickAction
            to="/debts"
            icon={<BarChart4 />}
            iconBgColor="bg-yellow-500/20"
            iconColor="text-yellow-400"
            title="View Debts"
            description="Manage your debts and loans"
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;