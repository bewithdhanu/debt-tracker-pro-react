import React from 'react';
import { Debt } from '../types/debt';
import { Edit, Trash2, DollarSign, Calendar, FileText, ChevronLeft, ChevronRight, ArrowUpDown, ExternalLink, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DebtListProps {
  debts: Debt[];
  onEdit?: (debt: Debt) => void;
  onDelete?: (debtId: string) => void;
  onViewActivities: (debt: Debt) => void;
  isLoading: boolean;
  viewMode: 'card' | 'table';
  searchTerm?: string;
  onSort?: (key: keyof Debt) => void;
  sortConfig?: {
    key: keyof Debt;
    direction: 'ascending' | 'descending';
  };
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  isCompact?: boolean;
}

const DebtList: React.FC<DebtListProps> = ({
  debts,
  onEdit,
  onDelete,
  onViewActivities,
  isLoading,
  viewMode,
  searchTerm = '',
  onSort,
  sortConfig,
  pagination,
  isCompact = false
}) => {
  const navigate = useNavigate();
  const currentPage = pagination?.currentPage || 1;
  const totalPages = pagination?.totalPages || 1;
  const onPageChange = pagination?.onPageChange || (() => {});
  
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

  // Calculate pending interest months and days
  const calculatePendingInterest = (debt: Debt) => {
    // Only calculate for active debts
    if (debt.status !== 'active') {
      return { months: 0, days: 0, amount: 0 };
    }

    // Get the debt start date
    const debtStartDate = new Date(debt.debt_date);
    
    // Get current date
    const currentDate = new Date();
    
    // Calculate total months from debt start to now
    let totalMonths = (currentDate.getFullYear() - debtStartDate.getFullYear()) * 12 + 
                      (currentDate.getMonth() - debtStartDate.getMonth());
    
    // Calculate remaining days
    const startDay = debtStartDate.getDate();
    const currentDay = currentDate.getDate();
    
    let exactDays = 0;
    
    // If we're past the same day of the month, it's a full month
    if (currentDay >= startDay) {
      exactDays = currentDay - startDay;
    } else {
      // We're before the same day of the month, so it's not a full month
      totalMonths -= 1;
      
      // Calculate days from last month
      const lastDayOfPrevMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0
      ).getDate();
      
      exactDays = lastDayOfPrevMonth - startDay + currentDay;
    }
    
    // Calculate interest amount
    const interestAmount = (debt.principal_amount * debt.interest_rate * totalMonths) / 100;
    
    return { months: totalMonths, days: exactDays, amount: interestAmount };
  };

  // Render sort indicator
  const renderSortIndicator = (key: keyof Debt) => {
    if (!sortConfig || sortConfig.key !== key) {
      return <ArrowUpDown size={14} className="ml-1 opacity-50" />;
    }
    
    return (
      <ArrowUpDown 
        size={14} 
        className={`ml-1 ${sortConfig.direction === 'ascending' ? 'text-blue-400' : 'text-blue-400 rotate-180'}`} 
      />
    );
  };

  const handleViewContact = (e: React.MouseEvent, contactId: string) => {
    e.stopPropagation();
    navigate(`/contacts/${contactId}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (debts.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-400 mb-2 text-sm">
          {searchTerm ? 'No debts match your search criteria.' : 'No debts recorded yet.'}
        </p>
        {!searchTerm && !isCompact && (
          <p className="text-gray-500 text-xs">Add your first debt using the button above.</p>
        )}
      </div>
    );
  }

  // Card View
  if (viewMode === 'card') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {debts.map((debt) => {
            const pendingInterest = calculatePendingInterest(debt);
            return (
              <div
                key={debt.id}
                className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors cursor-pointer group"
                onClick={() => onViewActivities(debt)}
              >
                <div className="flex justify-between items-start mb-1.5">
                  <h3 className="text-base font-medium text-white">
                    <button 
                      onClick={(e) => handleViewContact(e, debt.contact_id)}
                      className="hover:text-blue-400 transition-colors flex items-center"
                    >
                      {debt.contact_name}
                      <ExternalLink size={14} className="ml-1.5 text-gray-400" />
                    </button>
                    {debt.status === 'completed' && (
                      <span className="ml-2 text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                        Completed
                      </span>
                    )}
                  </h3>
                  <div className="flex space-x-1.5" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onViewActivities(debt)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                      aria-label={`View activities for ${debt.contact_name}`}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center text-gray-300">
                    <DollarSign size={14} className="mr-1.5 flex-shrink-0" />
                    <span className={debt.type === 'I Owe' ? 'text-red-400' : 'text-green-400'}>
                      {debt.type}: {formatCurrency(debt.principal_amount)}
                    </span>
                  </div>
                  
                  {debt.status === 'active' && (
                    <>
                      <div className="flex items-center text-gray-400">
                        <Clock size={14} className="mr-1.5 flex-shrink-0" />
                        <span>
                          Pending: {pendingInterest.months} month{pendingInterest.months !== 1 ? 's' : ''}
                          {pendingInterest.days > 0 ? ` and ${pendingInterest.days} day${pendingInterest.days !== 1 ? 's' : ''}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center text-yellow-400">
                        <DollarSign size={14} className="mr-1.5 flex-shrink-0" />
                        <span>Interest due: {formatCurrency(pendingInterest.amount)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Pagination */}
        {pagination && renderPagination()}
      </div>
    );
  }

  // Table View
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-300">
          <thead className="text-xs uppercase bg-gray-800 text-gray-400">
            <tr>
              <th 
                scope="col" 
                className="px-4 py-3 rounded-tl-lg cursor-pointer hover:bg-gray-750"
                onClick={() => onSort && onSort('contact_name')}
              >
                <div className="flex items-center">
                  Contact
                  {onSort && renderSortIndicator('contact_name')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-750"
                onClick={() => onSort && onSort('type')}
              >
                <div className="flex items-center">
                  Type
                  {onSort && renderSortIndicator('type')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-750"
                onClick={() => onSort && onSort('principal_amount')}
              >
                <div className="flex items-center">
                  Amount
                  {onSort && renderSortIndicator('principal_amount')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-750"
                onClick={() => onSort && onSort('status')}
              >
                <div className="flex items-center">
                  Status
                  {onSort && renderSortIndicator('status')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3">Pending Interest</th>
              <th scope="col" className="px-4 py-3">Interest Amount</th>
              <th scope="col" className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {debts.map((debt, index) => {
              const pendingInterest = calculatePendingInterest(debt);
              return (
                <tr 
                  key={debt.id} 
                  className={`bg-gray-800 border-b border-gray-700 hover:bg-gray-750 cursor-pointer ${
                    index === debts.length - 1 ? 'rounded-b-lg' : ''
                  }`}
                  onClick={() => onViewActivities(debt)}
                >
                  <td className="px-4 py-2.5 font-medium text-white">
                    <button 
                      onClick={(e) => handleViewContact(e, debt.contact_id)}
                      className="hover:text-blue-400 transition-colors flex items-center"
                    >
                      {debt.contact_name}
                      <ExternalLink size={14} className="ml-1.5 text-gray-400" />
                    </button>
                  </td>
                  <td className={`px-4 py-2.5 ${debt.type === 'I Owe' ? 'text-red-400' : 'text-green-400'}`}>
                    {debt.type}
                  </td>
                  <td className="px-4 py-2.5">
                    {formatCurrency(debt.principal_amount)}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      debt.status === 'completed' 
                        ? 'bg-green-900 text-green-300' 
                        : 'bg-blue-900 text-blue-300'
                    }`}>
                      {debt.status === 'completed' ? 'Completed' : 'Active'}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {debt.status === 'active' ? (
                      <span>
                        {pendingInterest.months} month{pendingInterest.months !== 1 ? 's' : ''}
                        {pendingInterest.days > 0 ? ` and ${pendingInterest.days} day${pendingInterest.days !== 1 ? 's' : ''}` : ''}
                      </span>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-yellow-400">
                    {debt.status === 'active' ? (
                      formatCurrency(pendingInterest.amount)
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewActivities(debt);
                        }}
                        className="text-gray-400 hover:text-blue-400 transition-colors"
                        aria-label={`View activities for ${debt.contact_name}`}
                        title="View activities"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {pagination && renderPagination()}
    </div>
  );

  // Common pagination component
  function renderPagination() {
    if (totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center space-x-1 pt-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft size={16} />
        </button>
        
        <div className="flex items-center">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            // Show pages around current page
            let pageToShow;
            if (totalPages <= 5) {
              pageToShow = i + 1;
            } else if (currentPage <= 3) {
              pageToShow = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageToShow = totalPages - 4  + i;
            } else {
              pageToShow = currentPage - 2 + i;
            }
            
            return (
              <button
                key={pageToShow}
                onClick={() => onPageChange(pageToShow)}
                className={`w-8 h-8 flex items-center justify-center rounded-md text-xs ${
                  currentPage === pageToShow
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {pageToShow}
              </button>
            );
          })}
          
          {totalPages > 5 && currentPage < totalPages - 2 && (
            <>
              <span className="px-1 text-gray-500">...</span>
              <button
                onClick={() => onPageChange(totalPages)}
                className="w-8 h-8 flex items-center justify-center rounded-md text-xs bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
        
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }
};

export default DebtList;