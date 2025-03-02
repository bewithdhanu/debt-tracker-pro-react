import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/auth';
import { Debt, DebtFormData } from '../types/debt';
import DebtList from './DebtList';
import DebtForm from './DebtForm';
import DebtActivities from './DebtActivities';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';

interface DebtsProps {
  user: User;
}

const Debts: React.FC<DebtsProps> = ({ user }) => {
  const { debtId } = useParams();
  const navigate = useNavigate();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentDebt, setCurrentDebt] = useState<Debt | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    // Default to card view on mobile, table view on larger screens
    return window.innerWidth < 768 ? 'card' : 'table';
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Debt;
    direction: 'ascending' | 'descending';
  }>({
    key: 'debt_date',
    direction: 'descending',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0
  });
  const [showActivities, setShowActivities] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);
  const [preselectedContact, setPreselectedContact] = useState<{id: string, name: string} | null>(null);
  const { formatCurrency } = useCurrency();

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

  useEffect(() => {
    if (user && user.id) {
      if (debtId) {
        fetchSingleDebt(debtId);
      } else {
        fetchDebts();
      }
    }
  }, [user.id, pagination.currentPage, sortConfig, searchTerm, debtId]);

  // Check URL for addNew parameter and preselected contact
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    
    // Check if we have a preselected contact from sessionStorage
    const contactId = sessionStorage.getItem('preselectedContactId');
    const contactName = sessionStorage.getItem('preselectedContactName');
    
    if (contactId && contactName) {
      setPreselectedContact({
        id: contactId,
        name: contactName
      });
      
      // Clear the sessionStorage after retrieving the values
      sessionStorage.removeItem('preselectedContactId');
      sessionStorage.removeItem('preselectedContactName');
    }
    
    if (urlParams.get('addNew') === 'true') {
      handleAddDebt();
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchSingleDebt = async (id: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('debts')
        .select(`
          *,
          contacts:contact_id (name)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        const transformedDebt = {
          ...data,
          contact_name: data.contacts?.name || 'Unknown Contact'
        };
        setSelectedDebt(transformedDebt);
        setShowActivities(true);
      }
    } catch (error) {
      console.error('Error fetching debt:', error);
      toast.error('Failed to load debt details');
      navigate('/debts');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDebts = async () => {
    try {
      setIsLoading(true);
      
      // Start building the query
      let query = supabase
        .from('debts')
        .select(`
          *,
          contacts:contact_id (name)
        `, { count: 'exact' })
        .eq('user_id', user.id);
      
      // Add search filter if search term exists
      if (searchTerm) {
        // We need to handle the join with contacts table for searching by contact name
        const contactsQuery = supabase
          .from('contacts')
          .select('id')
          .eq('user_id', user.id)
          .ilike('name', `%${searchTerm}%`);
        
        const { data: contactIds, error: contactError } = await contactsQuery;
        
        if (contactError) {
          throw contactError;
        }
        
        if (contactIds && contactIds.length > 0) {
          // If we found contacts matching the search term, include them in the filter
          const contactIdList = contactIds.map(c => c.id);
          
          // Build a filter for the contact IDs
          query = query.or(`contact_id.in.(${contactIdList.join(',')})`)
            .or(`type.ilike.%${searchTerm}%`)
            .or(`status.ilike.%${searchTerm}%`);
            
          // For numeric fields, we need to be careful with the syntax
          if (!isNaN(Number(searchTerm))) {
            query = query.or(`principal_amount.eq.${Number(searchTerm)}`);
          }
          
          // For text fields
          if (searchTerm.trim() !== '') {
            query = query.or(`notes.ilike.%${searchTerm}%`);
          }
        } else {
          // If no contacts match, just search the other fields
          query = query.or(`type.ilike.%${searchTerm}%`)
            .or(`status.ilike.%${searchTerm}%`);
            
          // For numeric fields, we need to be careful with the syntax
          if (!isNaN(Number(searchTerm))) {
            query = query.or(`principal_amount.eq.${Number(searchTerm)}`);
          }
          
          // For text fields
          if (searchTerm.trim() !== '') {
            query = query.or(`notes.ilike.%${searchTerm}%`);
          }
        }
      }
      
      // Add sorting
      const sortKey = sortConfig.key;
      const sortDirection = sortConfig.direction === 'ascending' ? 'asc' : 'desc';
      
      // Special case for contact_name since it's a joined field
      if (sortKey === 'contact_name') {
        query = query.order('contacts(name)', { ascending: sortDirection === 'asc' });
      } else {
        query = query.order(sortKey, { ascending: sortDirection === 'asc' });
      }
      
      // Add pagination
      const from = (pagination.currentPage - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);
      
      // Execute the query
      const { data, error, count } = await query;

      if (error) {
        throw error;
      }
      
      // Transform the data to include contact_name
      const transformedData = data?.map(debt => ({
        ...debt,
        contact_name: debt.contacts?.name || 'Unknown Contact'
      })) || [];
      
      setDebts(transformedData);
      
      // Update total count for pagination
      if (count !== null) {
        setPagination(prev => ({ ...prev, totalCount: count }));
      }
    } catch (error) {
      console.error('Error fetching debts:', error);
      toast.error('Failed to load debts');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setPagination(prev => ({ ...prev, currentPage: pageNumber }));
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  const handleSort = (key: keyof Debt) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    // Reset to first page when sorting changes
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleAddDebt = () => {
    setCurrentDebt(undefined);
    setShowForm(true);
    setShowActivities(false);
  };

  const handleEditDebt = (debt: Debt) => {
    setCurrentDebt(debt);
    setShowForm(true);
    setShowActivities(false);
  };

  const handleViewDebtActivities = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowActivities(true);
    setShowForm(false);
  };

  const handleBackFromActivities = () => {
    setShowActivities(false);
    setSelectedDebt(null);
    navigate('/debts');
    // Refresh debts to get updated status
    fetchDebts();
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setCurrentDebt(undefined);
    setPreselectedContact(null);
  };

  const handleSubmitForm = async (formData: DebtFormData) => {
    setIsSubmitting(true);
    try {
      if (currentDebt) {
        // Update existing debt
        const { error } = await supabase
          .from('debts')
          .update({
            contact_id: formData.contact_id,
            principal_amount: formData.principal_amount,
            interest_rate: formData.interest_rate,
            debt_date: formData.debt_date,
            type: formData.type,
            status: formData.status || 'active',
            notes: formData.notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentDebt.id);

        if (error) throw error;
        toast.success('Debt updated successfully');
      } else {
        // Create new debt
        const { error } = await supabase.from('debts').insert({
          user_id: user.id,
          contact_id: formData.contact_id,
          principal_amount: formData.principal_amount,
          interest_rate: formData.interest_rate,
          debt_date: formData.debt_date,
          type: formData.type,
          status: formData.status || 'active',
          notes: formData.notes || null,
        });

        if (error) throw error;
        toast.success('Debt added successfully');
      }

      // Refresh debts and reset form
      await fetchDebts();
      setShowForm(false);
      setCurrentDebt(undefined);
      setPreselectedContact(null);
    } catch (error) {
      console.error('Error saving debt:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save debt');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDebt = async (debtId: string) => {
    try {
      const { error } = await supabase
        .from('debts')
        .delete()
        .eq('id', debtId);

      if (error) throw error;
      
      toast.success('Debt deleted successfully');
      
      // Refresh the debts list
      fetchDebts();
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast.error('Failed to delete debt');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    // Reset to first page when search term changes
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'card' ? 'table' : 'card');
  };

  return (
    <div className="space-y-4">
      {showActivities && selectedDebt ? (
        <DebtActivities 
          user={user} 
          debt={selectedDebt} 
          onBack={handleBackFromActivities}
          onEditDebt={handleEditDebt}
          onDeleteDebt={handleDeleteDebt}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-lg font-bold text-white">
              Debts ({pagination.totalCount > 0 ? `${debts.length} of ${pagination.totalCount}` : '0'})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={toggleViewMode}
                className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
                title={viewMode === 'card' ? 'Switch to table view' : 'Switch to card view'}
              >
                <ArrowUpDown size={16} />
                {viewMode === 'card' ? 'Table' : 'Cards'}
              </button>
              <button
                onClick={handleAddDebt}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
              >
                <Plus size={16} />
                Add Debt
              </button>
            </div>
          </div>

          {/* Search */}
          {!showForm && (
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
              <div className="relative flex-grow">
                <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                  <Search size={16} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search debts by contact, type, amount, status or notes..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                />
              </div>
            </div>
          )}

          {showForm ? (
            <DebtForm
              onSubmit={handleSubmitForm}
              onCancel={handleCancelForm}
              initialData={currentDebt}
              isSubmitting={isSubmitting}
              userId={user.id}
              preselectedContact={preselectedContact}
            />
          ) : (
            <DebtList
              debts={debts}
              onEdit={handleEditDebt}
              onDelete={handleDeleteDebt}
              onViewActivities={(debt) => {
                setSelectedDebt(debt);
                setShowActivities(true);
                navigate(`/debts/${debt.id}`);
              }}
              isLoading={isLoading}
              viewMode={viewMode}
              searchTerm={searchTerm}
              onSort={handleSort}
              sortConfig={sortConfig}
              pagination={{
                currentPage: pagination.currentPage,
                totalPages: Math.ceil(pagination.totalCount / pagination.pageSize),
                onPageChange: handlePageChange
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Debts;