import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '../types/auth';
import { Contact, ContactFormData } from '../types/contact';
import ContactList from './ContactList';
import ContactForm from './ContactForm';
import ContactDetails from './ContactDetails';
import { Plus, Search, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate, useParams } from 'react-router-dom';

interface ContactsProps {
  user: User;
}

const Contacts: React.FC<ContactsProps> = ({ user }) => {
  const navigate = useNavigate();
  const { contactId } = useParams();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentContact, setCurrentContact] = useState<Contact | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDetails, setShowDetails] = useState(false);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    // Default to card view on mobile, table view on larger screens
    return window.innerWidth < 768 ? 'card' : 'table';
  });
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Contact;
    direction: 'ascending' | 'descending';
  }>({
    key: 'name',
    direction: 'ascending',
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    pageSize: 10,
    totalCount: 0
  });

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
      fetchContacts();
    }
  }, [user.id, pagination.currentPage, sortConfig, searchTerm]);

  // Check URL for addNew parameter
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('addNew') === 'true') {
      handleAddContact();
      // Clean up the URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Update useEffect to handle URL-based contact selection
  useEffect(() => {
    if (contactId && contacts.length > 0) {
      const contact = contacts.find(c => c.id === contactId);
      if (contact) {
        setSelectedContact(contact);
        setShowForm(false);
      }
    }
  }, [contactId, contacts]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      
      // Start building the query
      let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id);
      
      // Add search filter if search term exists
      if (searchTerm) {
        query = query.or(
          `name.ilike.%${searchTerm}%,` +
          `referral_name.ilike.%${searchTerm}%,` +
          `address.ilike.%${searchTerm}%,` +
          `phone.ilike.%${searchTerm}%`
        );
      }
      
      // Add sorting
      const sortKey = sortConfig.key;
      const sortDirection = sortConfig.direction === 'ascending' ? 'asc' : 'desc';
      query = query.order(sortKey, { ascending: sortDirection === 'asc' });
      
      // Add pagination
      const from = (pagination.currentPage - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);
      
      // Execute the query
      const { data, error, count } = await query;

      if (error) {
        throw error;
      }
      
      setContacts(data || []);
      
      // Update total count for pagination
      if (count !== null) {
        setPagination(prev => ({ ...prev, totalCount: count }));
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePageChange = (pageNumber: number) => {
    setPagination(prev => ({ ...prev, currentPage: pageNumber }));
    // Scroll to top when changing pages
    window.scrollTo(0, 0);
  };

  const handleSort = (key: keyof Contact) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
    // Reset to first page when sorting changes
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleAddContact = () => {
    setCurrentContact(undefined);
    setShowForm(true);
  };

  const handleEditContact = (contact: Contact) => {
    setCurrentContact(contact);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setCurrentContact(undefined);
  };

  const handleSubmitForm = async (formData: ContactFormData) => {
    setIsSubmitting(true);
    try {
      const existingContact = currentContact || selectedContact;
      if (existingContact) {
        // Update existing contact
        const { data: updatedContact, error } = await supabase
          .from('contacts')
          .update({
            name: formData.name,
            referral_name: formData.referral_name || null,
            address: formData.address || null,
            phone: formData.phone || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingContact.id)
          .select()
          .single();

        if (error) throw error;
        
        // Update the selected contact in state if we're in details view
        if (selectedContact && selectedContact.id === existingContact.id) {
          setSelectedContact(updatedContact);
        }
        
        toast.success('Contact updated successfully');
      } else {
        // Create new contact
        const { error } = await supabase.from('contacts').insert({
          user_id: user.id,
          name: formData.name,
          referral_name: formData.referral_name || null,
          address: formData.address || null,
          phone: formData.phone || null,
        });

        if (error) throw error;
        toast.success('Contact added successfully');
      }

      // Refresh contacts and reset form
      await fetchContacts();
      setShowForm(false);
      setCurrentContact(undefined);
    } catch (error) {
      console.error('Error saving contact:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save contact');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;
      
      toast.success('Contact deleted successfully');
      
      // Navigate back to contacts list
      navigate('/contacts');
      
      // Refresh the contacts list
      fetchContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
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

  const handleViewContactDetails = (contact: Contact) => {
    setSelectedContact(contact);
    navigate(`/contacts/${contact.id}`);
    setShowForm(false);
  };

  const handleBackFromDetails = () => {
    setSelectedContact(null);
    navigate('/contacts');
    // Refresh contacts to get any updates
    fetchContacts();
  };

  return (
    <div className="space-y-4">
      {(contactId && selectedContact) ? (
        <ContactDetails
          user={user}
          contact={selectedContact}
          onBack={handleBackFromDetails}
          onEditContact={handleSubmitForm}
          onDeleteContact={handleDeleteContact}
        />
      ) : (
        <>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <h2 className="text-lg font-bold text-white">
              Contacts ({pagination.totalCount > 0 ? `${contacts.length} of ${pagination.totalCount}` : '0'})
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
                onClick={handleAddContact}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-sm"
              >
                <Plus size={16} />
                Add Contact
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
                  placeholder="Search contacts by name, referral, address or phone..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="w-full pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
                />
              </div>
            </div>
          )}

          {showForm ? (
            <ContactForm
              onSubmit={handleSubmitForm}
              onCancel={handleCancelForm}
              initialData={currentContact}
              isSubmitting={isSubmitting}
            />
          ) : (
            <ContactList
              contacts={contacts}
              onEdit={handleEditContact}
              onDelete={handleDeleteContact}
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
              onViewDetails={handleViewContactDetails}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Contacts;