import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/auth';
import { 
  Search, 
  Filter, 
  ArrowDownUp, 
  ChevronLeft, 
  ChevronRight, 
  DollarSign, 
  TrendingUp, 
  FileText,
  Clock,
  CalendarRange,
  ArrowUpDown
} from 'lucide-react';
import { format, startOfMonth } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';
import toast from 'react-hot-toast';
import { DateRangePicker, DateRange } from './DateRangePicker';
import { ContactSelect } from './ContactSelect';

interface Contact {
  id: string;
  name: string;
}

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

const Transactions: React.FC<TransactionsProps> = ({ user }) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    return window.innerWidth < 768 ? 'card' : 'table';
  });
  const [dateRange, setDateRange] = useState<DateRange>({
    start: startOfMonth(new Date()),
    end: new Date(),
    label: 'This Month'
  });
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
  }, [user.id, dateRange, selectedContact]);

  useEffect(() => {
    // Apply filters whenever transactions change
    applyFilters();
  }, [transactions]);

  // Handle responsive view mode changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setViewMode('card');
      } else {
        setViewMode('table');
      }
    };
    
    // Set initial view mode
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      
      // Convert dates to ISO strings for the query
      const startDate = dateRange.start.toISOString();
      const endDate = dateRange.end.toISOString();
      
      // Base query for debts with date range filter
      let debtsQuery = supabase
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
        .eq('user_id', user.id)
        .gte('debt_date', startDate)
        .lte('debt_date', endDate);

      // Add contact filter if contact is selected
      if (selectedContact) {
        debtsQuery = debtsQuery.eq('contact_id', selectedContact.id);
      }

      // Base query for activities with date range filter
      let activitiesQuery = supabase
        .from('debt_activities')
        .select(`
          id,
          debt_id,
          activity_type,
          amount,
          activity_date,
          notes,
          created_at,
          debts!inner (
            type,
            contacts!inner (
              id,
              name
            )
          )
        `)
        .eq('user_id', user.id)
        .gte('activity_date', startDate)
        .lte('activity_date', endDate);

      // Add contact filter if contact is selected
      if (selectedContact) {
        activitiesQuery = activitiesQuery.eq('debts.contacts.id', selectedContact.id);
      }

      // Execute both queries
      const [debtsResult, activitiesResult] = await Promise.all([
        debtsQuery,
        activitiesQuery
      ]);
      
      if (debtsResult.error) throw debtsResult.error;
      if (activitiesResult.error) throw activitiesResult.error;
      
      // Transform debts into transactions
      const debtTransactions: Transaction[] = (debtsResult.data || []).map(debt => ({
        id: `debt-${debt.id}`,
        type: 'debt',
        date: debt.debt_date,
        amount: debt.principal_amount,
        description: `New ${debt.type} debt created`,
        contact_name: debt.contacts?.name || 'Unknown Contact',
        debt_id: debt.id,
        debt_type: debt.type as 'I Owe' | 'Owe Me',
        status: debt.status
      }));
      
      // Transform activities into transactions
      const activityTransactions: Transaction[] = (activitiesResult.data || []).map(activity => ({
        id: `activity-${activity.id}`,
        type: 'activity',
        date: activity.activity_date,
        amount: activity.amount,
        description: activity.activity_type === 'Interest' 
          ? `Interest payment${activity.notes ? `: ${activity.notes}` : ''}`
          : activity.notes || 'Note added',
        contact_name: activity.debts.contacts.name,
        debt_id: activity.debt_id,
        activity_id: activity.id,
        debt_type: activity.debts.type as 'I Owe' | 'Owe Me',
        activity_type: activity.activity_type
      }));
      
      // Combine and sort all transactions by date (newest first)
      const allTransactions = [...debtTransactions, ...activityTransactions].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      setTransactions(allTransactions);
      setFilteredTransactions(allTransactions);
      setPagination(prev => ({ ...prev, totalCount: allTransactions.length }));
      
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    const sorted = sortTransactions(transactions);
    setFilteredTransactions(sorted);
    setPagination(prev => ({ ...prev, totalCount: sorted.length }));
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

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'card' ? 'table' : 'card');
  };

  // Add click outside handler to close date picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      const dateRangePicker = target.closest('.date-range-picker');
      
      if (!dateRangePicker) {
        // The DateRangePicker component handles its own visibility
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-lg font-bold text-white">
          Transactions
        </h2>
        <button
          onClick={toggleViewMode}
          className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
          title={viewMode === 'card' ? 'Switch to table view' : 'Switch to card view'}
        >
          <ArrowUpDown size={16} />
          {viewMode === 'card' ? 'Table' : 'Cards'}
        </button>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 px-3 py-2 rounded-lg">
        <div className="flex flex-col md:flex-row items-center justify-end gap-2">
          {/* Contact Select */}
          <div className="w-full md:w-auto">
            <ContactSelect
              selectedContact={selectedContact}
              onSelect={setSelectedContact}
            />
          </div>

          {/* Date Range Picker */}
          <div className="w-full md:w-auto">
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={(range) => {
                setDateRange(range);
                setPagination(prev => ({ ...prev, currentPage: 1 }));
              }}
            />
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
          
          {/* Transactions View */}
          {viewMode === 'card' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {getCurrentPageTransactions().map((transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => handleViewTransaction(transaction)}
                  className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-white font-medium">{transaction.contact_name}</h3>
                      <p className="text-gray-400 text-xs">{formatDate(transaction.date)}</p>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center">
                      {getTransactionIcon(transaction)}
                    </div>
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                    {transaction.description}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs text-gray-400">
                        {transaction.type === 'debt' 
                          ? 'New Debt' 
                          : transaction.activity_type === 'Interest'
                            ? 'Interest'
                            : 'Note'
                        }
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${
                      transaction.debt_type === 'I Owe' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
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
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center space-x-1 p-4">
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
      )}
    </div>
  );
};

export default Transactions;