import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/auth';
import { Debt, DebtFormData } from '../types/debt';
import DebtList from './DebtList';
import DebtForm from './DebtForm';
import DebtActivities from './DebtActivities';
import { Plus, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useParams, useNavigate } from 'react-router-dom';
import { ContactSelect } from './ContactSelect';

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
  const [filters, setFilters] = useState({
    types: [] as ('I Owe' | 'Owe Me')[],
    statuses: [] as ('active' | 'completed')[],
    contactId: '' as string
  });
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
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
  const [selectedContactName, setSelectedContactName] = useState('');

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
  }, [user.id, debtId, pagination.currentPage, sortConfig, filters]);

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
        setShowForm(false);
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
      
      // Apply filters
      if (filters.types.length > 0) {
        query = query.in('type', filters.types);
      }
      if (filters.statuses.length > 0) {
        query = query.in('status', filters.statuses);
      }
      if (filters.contactId) {
        query = query.eq('contact_id', filters.contactId);
      }

      // If no filters are applied, show all records
      if (filters.types.length === 0 && filters.statuses.length === 0) {
        query = query.in('type', ['I Owe', 'Owe Me'])
                    .in('status', ['active', 'completed']);
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
    navigate(`/debts/${debt.id}`);
  };

  const handleBackFromActivities = () => {
    setShowActivities(false);
    setSelectedDebt(null);
    navigate('/debts');
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

  const handleFilterChange = (filterType: 'types' | 'statuses' | 'contactId', value: string) => {
    setFilters(prev => {
      if (filterType === 'types') {
        const currentTypes = prev.types as ('I Owe' | 'Owe Me')[];
        if (currentTypes.includes(value as 'I Owe' | 'Owe Me')) {
          // Don't allow deselecting if it's the last selected type
          if (currentTypes.length === 1) return prev;
          return {
            ...prev,
            types: currentTypes.filter(t => t !== value)
          };
        } else {
          return {
            ...prev,
            types: [...currentTypes, value as 'I Owe' | 'Owe Me']
          };
        }
      } else if (filterType === 'statuses') {
        const currentStatuses = prev.statuses as ('active' | 'completed')[];
        if (currentStatuses.includes(value as 'active' | 'completed')) {
          // Don't allow deselecting if it's the last selected status
          if (currentStatuses.length === 1) return prev;
          return {
            ...prev,
            statuses: currentStatuses.filter(s => s !== value)
          };
        } else {
          return {
            ...prev,
            statuses: [...currentStatuses, value as 'active' | 'completed']
          };
        }
      } else if (filterType === 'contactId') {
        // Toggle contact filter - if same contact is selected, clear it
        return {
          ...prev,
          contactId: prev.contactId === value ? '' : value
        };
      }
      return prev;
    });
    // Reset to first page when filters change
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

          {/* Filters Row */}
          <div className="bg-gray-800 px-3 py-2 rounded-lg">
            <div className="flex flex-col md:flex-row items-center justify-end gap-2">
              {/* Type Filters */}
              <button
                onClick={() => handleFilterChange('types', 'I Owe')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filters.types.includes('I Owe')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                I Owe
              </button>
              <button
                onClick={() => handleFilterChange('types', 'Owe Me')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filters.types.includes('Owe Me')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Owe Me
              </button>

              <div className="w-px h-5 bg-gray-700 mx-1 self-center hidden md:block"></div>

              {/* Status Filters */}
              <button
                onClick={() => handleFilterChange('statuses', 'active')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filters.statuses.includes('active')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => handleFilterChange('statuses', 'completed')}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  filters.statuses.includes('completed')
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Completed
              </button>

              <div className="w-px h-5 bg-gray-700 mx-1 self-center hidden md:block"></div>

              {/* Contact Filter */}
              <ContactSelect
                selectedContact={filters.contactId ? { id: filters.contactId, name: selectedContactName } : null}
                onSelect={(contact) => {
                  setSelectedContactName(contact?.name || '');
                  handleFilterChange('contactId', contact?.id || '');
                }}
                className="w-48"
              />
            </div>
          </div>

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