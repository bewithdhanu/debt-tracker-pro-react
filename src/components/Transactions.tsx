import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/auth';
import { 
  Search, 
  Calendar, 
  Filter, 
  ArrowDownUp, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Clock,
  X,
  CalendarRange
} from 'lucide-react';
import { formatCurrency } from '../lib/formatCurrency';
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface TransactionsProps {
  user: User;
}

interface Transaction {
  id: string;
  type: 'debt' | 'activity';
  date: string;
  amount: number;
  description: string;
  contact_name: string;
  debt_id: string;
  activity_id?: string;
  debt_type: 'I Owe' | 'Owe Me';
  activity_type?: string;
  status?: string;
}

type DateRange = {
  start: Date;
  end: Date;
  label: string;
};

type DateRangePreset = 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

const Transactions: React.FC<TransactionsProps> = ({ user }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfMonth(new Date()),
    end: new Date(),
    label: 'This Month'
  });
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>('thisMonth');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [customEndDate, setCustomEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Transaction;
    direction: 'ascending' | 'descending';
  }>({
    key: 'date',
    direction: 'descending',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 20,
    totalCount: 0
  });

  useEffect(() => {
    fetchTransactions();
  }, [user.id]);

  useEffect(() => {
    // Apply filters whenever search term or date range changes
    applyFilters();
  }, [searchTerm, dateRange, transactions]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Fetch all debts
      const { data: debts, error: debtsError } = await supabase
        .from('debts')
        .select(`
          id,
          principal_amount,
          debt_date,
          type,
          status,
          created_at,
          contacts:contact_id (name)
        `)
        .eq('user_id', user.id);
      
      if (debtsError) throw debtsError;
      
      // Fetch all debt activities
      const { data: activities, error: activitiesError } = await supabase
        .from('debt_activities')
        .select(`
          id,
          debt_id,
          activity_type,
          amount,
          activity_date,
          notes,
          created_at,
          debts:debt_id (
            type,
            contacts:contact_id (name)
          )
        `)
        .eq('user_id', user.id);
      
      if (activitiesError) throw activitiesError;
      
      // Transform debts into transactions
      const debtTransactions: Transaction[] = debts?.map(debt => ({
        id: `debt-${debt.id}`,
        type: 'debt',
        date: debt.created_at,
        amount: debt.principal_amount,
        description: `New ${debt.type} debt created`,
        contact_name: debt.contacts?.name || 'Unknown Contact',
        debt_id: debt.id,
        debt_type: debt.type as 'I Owe' | 'Owe Me',
        status: debt.status
      })) || [];
      
      // Transform activities into transactions
      const activityTransactions: Transaction[] = activities?.map(activity => ({
        id: `activity-${activity.id}`,
        type: 'activity',
        date: activity.activity_date,
        amount: activity.amount,
        description: activity.activity_type === 'Interest' 
          ? `Interest payment${activity.notes ? `: ${activity.notes}` : ''}`
          : activity.notes || 'Note added',
        contact_name: activity.debts?.contacts?.name || 'Unknown Contact',
        debt_id: activity.debt_id,
        activity_id: activity.id,
        debt_type: activity.debts?.type as 'I Owe' | 'Owe Me',
        activity_type: activity.activity_type
      })) || [];
      
      // Combine and sort all transactions by date (newest first)
      const allTransactions = [...debtTransactions, ...activityTransactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setTransactions(allTransactions);
      setPagination(prev => ({ ...prev, totalCount: allTransactions.length }));
      
      // Apply initial filters
      applyFilters();
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];
    
    // Apply date range filter
    filtered = filtered.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      return isWithinInterval(transactionDate, {
        start: dateRange.start,
        end: dateRange.end
      });
    });
    
    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(transaction => 
        transaction.contact_name.toLowerCase().includes(searchLower) ||
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.debt_type.toLowerCase().includes(searchLower) ||
        (transaction.activity_type && transaction.activity_type.toLowerCase().includes(searchLower))
      );
    }
    
    // Apply sorting
    filtered = sortTransactions(filtered);
    
    // Update filtered transactions
    setFilteredTransactions(filtered);
    setPagination(prev => ({ ...prev, totalCount: filtered.length }));
  };

  const sortTransactions = (data: Transaction[]) => {
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (sortConfig.key === 'date') {
        return sortConfig.direction === 'ascending'
          ? new Date(aValue as string).getTime() - new Date(bValue as string).getTime()
          : new Date(bValue as string).getTime() - new Date(aValue as string).getTime();
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'ascending'
          ? aValue - bValue
          : bValue - aValue;
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'ascending'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
  };

  const handleSort = (key: keyof Transaction) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    
    // Apply new sorting
    setFilteredTransactions(prev => sortTransactions(prev));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleDateRangeChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    
    const today = new Date();
    let start: Date;
    let end: Date;
    let label: string;
    
    switch (preset) {
      case 'today':
        start = new Date(today);
        end = new Date(today);
        label = 'Today';
        break;
      case 'yesterday':
        start = subDays(today, 1);
        end = subDays(today, 1);
        label = 'Yesterday';
        break;
      case 'thisWeek':
        start = startOfWeek(today, { weekStartsOn: 1 });
        end = today;
        label = 'This Week';
        break;
      case 'lastWeek':
        start = startOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        end = endOfWeek(subDays(today, 7), { weekStartsOn: 1 });
        label = 'Last Week';
        break;
      case 'thisMonth':
        start = startOfMonth(today);
        end = today;
        label = 'This Month';
        break;
      case 'lastMonth':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        label = 'Last Month';
        break;
      case 'thisYear':
        start = startOfYear(today);
        end = today;
        label = 'This Year';
        break;
      case 'custom':
        // For custom, we'll use the date picker values
        setShowDatePicker(true);
        return;
      default:
        start = startOfMonth(today);
        end = today;
        label = 'This Month';
    }
    
    setDateRange({ start, end, label });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const applyCustomDateRange = () => {
    if (!customStartDate || !customEndDate) {
      return;
    }
    
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    
    // Ensure end date is not before start date
    if (end < start) {
      toast.error('End date cannot be before start date');
      return;
    }
    
    setDateRange({
      start,
      end,
      label: `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`
    });
    
    setShowDatePicker(false);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (pageNumber: number) => {
    setPagination(prev => ({ ...prev, currentPage: pageNumber }));
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  const handleViewTransaction = (transaction: Transaction) => {
    navigate(`/debts/${transaction.debt_id}`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  // Get transaction icon based on type
  const getTransactionIcon = (transaction: Transaction) => {
    if (transaction.type === 'debt') {
      return <DollarSign size={16} className={transaction.debt_type === 'I Owe' ? 'text-red-400' : 'text-green-400'} />;
    } else if (transaction.activity_type === 'Interest') {
      return <TrendingUp size={16} className="text-yellow-400" />;
    } else {
      return <FileText size={16} className="text-purple-400" />;
    }
  };

  // Get current page of transactions
  const getCurrentPageTransactions = () => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredTransactions.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(pagination.totalCount / pagination.pageSize);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="text-lg font-bold text-white">
          Transactions
        </h2>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-lg">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={16} className="text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search by contact, description, or type..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-3 py-2 bg-gray-700 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            />
          </div>

          {/* Date Range Selector */}
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-700 border border-gray-700 rounded-md hover:bg-gray-650 text-white text-sm w-full md:w-auto justify-between"
            >
              <Calendar size={16} className="text-gray-400" />
              <span>{dateRange.label}</span>
              <ChevronLeft size={16} className={`text-gray-400 transition-transform ${showDatePicker ? 'rotate-90' : '-rotate-90'}`} />
            </button>

            {/* Date Range Dropdown */}
            {showDatePicker && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                <div className="p-3 border-b border-gray-700">
                  <h3 className="text-sm font-medium text-white mb-2">Date Range</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleDateRangeChange('today')}
                      className={`px-3 py-1.5 text-xs rounded-md ${dateRangePreset === 'today' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
                    >
                      Today
                    </button>
                    <button
                      onClick={() => handleDateRangeChange('yesterday')}
                      className={`px-3 py-1.5 text-xs rounded-md ${dateRangePreset === 'yesterday' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
                    >
                      Yesterday
                    </button>
                    <button
                      onClick={() => handleDateRangeChange('thisWeek')}
                      className={`px-3 py-1.5 text-xs rounded-md ${dateRangePreset === 'thisWeek' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
                    >
                      This Week
                    </button>
                    <button
                      onClick={() => handleDateRangeChange('lastWeek')}
                      className={`px-3 py-1.5 text-xs rounded-md ${dateRangePreset === 'lastWeek' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
                    >
                      Last Week
                    </button>
                    <button
                      onClick={() => handleDateRangeChange('thisMonth')}
                      className={`px-3 py-1.5 text-xs rounded-md ${dateRangePreset === 'thisMonth' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
                    >
                      This Month
                    </button>
                    <button
                      onClick={() => handleDateRangeChange('lastMonth')}
                      className={`px-3 py-1.5 text-xs rounded-md ${dateRangePreset === 'lastMonth' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
                    >
                      Last Month
                    </button>
                    <button
                      onClick={() => handleDateRangeChange('thisYear')}
                      className={`px-3 py-1.5 text-xs rounded-md ${dateRangePreset === 'thisYear' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
                    >
                      This Year
                    </button>
                    <button
                      onClick={() => setDateRangePreset('custom')}
                      className={`px-3 py-1.5 text-xs rounded-md ${dateRangePreset === 'custom' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-650'}`}
                    >
                      Custom
                    </button>
                  </div>
                </div>

                {/* Custom Date Range */}
                {dateRangePreset === 'custom' && (
                  <div className="p-3">
                    <div className="space-y-2">
                      <div>
                        <label htmlFor="startDate" className="block text-xs font-medium text-gray-400 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          id="startDate"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="endDate" className="block text-xs font-medium text-gray-400 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          id="endDate"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                        />
                      </div>
                      <button
                        onClick={applyCustomDateRange}
                        className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs mt-2"
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Transactions List */}
      {isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="bg-gray-800 rounded-lg p-6 text-center">
          <CalendarRange size={40} className="mx-auto text-gray-600 mb-3" />
          <p className="text-gray-400 mb-2">No transactions found for the selected period.</p>
          <p className="text-gray-500 text-sm">Try changing your search criteria or date range.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Transaction Summary */}
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
              <h3 className="text-base font-medium text-white flex items-center">
                <Filter size={16} className="mr-2 text-blue-400" />
                Transaction Summary
              </h3>
              <div className="text-sm text-gray-400">
                Showing {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Total Transactions */}
              <div className="bg-gray-750 p-3 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Total Transactions</p>
                <p className="text-lg font-medium text-white">{filteredTransactions.length}</p>
              </div>
              
              {/* Money In */}
              <div className="bg-gray-750 p-3 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Money In</p>
                <p className="text-lg font-medium text-green-400">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => 
                        (t.type === 'debt' && t.debt_type === 'Owe Me') || 
                        (t.type === 'activity' && t.activity_type === 'Interest' && t.debt_type === 'Owe Me')
                      )
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
              
              {/* Money Out */}
              <div className="bg-gray-750 p-3 rounded-md">
                <p className="text-xs text-gray-400 mb-1">Money Out</p>
                <p className="text-lg font-medium text-red-400">
                  {formatCurrency(
                    filteredTransactions
                      .filter(t => 
                        (t.type === 'debt' && t.debt_type === 'I Owe') || 
                        (t.type === 'activity' && t.activity_type === 'Interest' && t.debt_type === 'I Owe')
                      )
                      .reduce((sum, t) => sum + t.amount, 0)
                  )}
                </p>
              </div>
            </div>
          </div>
          
          {/* Transactions Table */}
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-gray-300">
                <thead className="text-xs uppercase bg-gray-750 text-gray-400">
                  <tr>
                    <th 
                      scope="col" 
                      className="px-4 py-3 cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        <Clock size={14} className="mr-1.5" />
                        Date
                        <ArrowDownUp 
                          size={14} 
                          className={`ml-1 ${
                            sortConfig.key === 'date' 
                              ? sortConfig.direction === 'ascending' 
                                ? 'text-blue-400' 
                                : 'text-blue-400 rotate-180' 
                              : 'opacity-50'
                          }`} 
                        />
                      </div>
                    </th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('contact_name')}
                    >
                      <div className="flex items-center">
                        Contact
                        <ArrowDownUp 
                          size={14} 
                          className={`ml-1 ${
                            sortConfig.key === 'contact_name' 
                              ? sortConfig.direction === 'ascending' 
                                ? 'text-blue-400' 
                                : 'text-blue-400 rotate-180' 
                              : 'opacity-50'
                          }`} 
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3">Description</th>
                    <th 
                      scope="col" 
                      className="px-4 py-3 cursor-pointer hover:bg-gray-700"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        Amount
                        <ArrowDownUp 
                          size={14} 
                          className={`ml-1 ${
                            sortConfig.key === 'amount' 
                              ? sortConfig.direction === 'ascending' 
                                ? 'text-blue-400' 
                                : 'text-blue-400 rotate-180' 
                              : 'opacity-50'
                          }`} 
                        />
                      </div>
                    </th>
                    <th scope="col" className="px-4 py-3">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {getCurrentPageTransactions().map((transaction) => (
                    <tr 
                      key={transaction.id} 
                      className="bg-gray-800 border-b border-gray-700 hover:bg-gray-750 cursor-pointer"
                      onClick={() => handleViewTransaction(transaction)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-4 py-3 font-medium text-white">
                        {transaction.contact_name}
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate">
                        {transaction.description}
                      </td>
                      <td className={`px-4 py-3 ${
                        transaction.debt_type === 'I Owe' ? 'text-red-400' : 'text-green-400'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center mr-2">
                            {getTransactionIcon(transaction)}
                          </div>
                          <span>
                            {transaction.type === 'debt' 
                              ? 'New Debt' 
                              : transaction.activity_type === 'Interest'
                                ? 'Interest'
                                : 'Note'
                            }
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center space-x-1 p-4 border-t border-gray-700">
                <button
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  className="p-1.5 rounded-md bg-gray-750 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                
                <div className="flex items-center">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Show pages around current page
                    let pageToShow;
                    if (totalPages <= 5) {
                      pageToShow = i + 1;
                    } else if (pagination.currentPage <= 3) {
                      pageToShow = i + 1;
                    } else if (pagination.currentPage >= totalPages - 2) {
                      pageToShow = totalPages - 4 + i;
                    } else {
                      pageToShow = pagination.currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageToShow}
                        onClick={() => handlePageChange(pageToShow)}
                        className={`w-8 h-8 flex items-center justify-center rounded-md text-xs ${
                          pagination.currentPage === pageToShow
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-750 text-gray-400 hover:bg-gray-700 hover:text-white'
                        }`}
                      >
                        {pageToShow}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && pagination.currentPage < totalPages - 2 && (
                    <>
                      <span className="px-1 text-gray-500">...</span>
                      <button
                        onClick={() => handlePageChange(totalPages)}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-xs bg-gray-750 text-gray-400 hover:bg-gray-700 hover:text-white"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                </div>
                
                <button
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === totalPages}
                  className="p-1.5 rounded-md bg-gray-750 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;