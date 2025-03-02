import React, { useState, useEffect } from 'react';
import { Contact, ContactFormData } from '../types/contact';
import { User } from '../types/auth';
import { Debt } from '../types/debt';
import ContactForm from './ContactForm';
import DebtList from './DebtList';
import { ArrowLeft, Edit, Trash2, Phone, MapPin, User as UserIcon, DollarSign, ArrowUpDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

interface ContactDetailsProps {
  user: User;
  contact: Contact;
  onBack: () => void;
  onEditContact: (formData: ContactFormData) => Promise<void>;
  onDeleteContact: (contactId: string) => void;
}

const ContactDetails: React.FC<ContactDetailsProps> = ({
  user,
  contact,
  onBack,
  onEditContact,
  onDeleteContact,
}) => {
  const navigate = useNavigate();
  const [editingContact, setEditingContact] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCheckingDebts, setIsCheckingDebts] = useState(false);
  const [linkedDebtsMessage, setLinkedDebtsMessage] = useState<string | null>(null);
  const [relatedDebts, setRelatedDebts] = useState<Debt[]>([]);
  const [isLoadingDebts, setIsLoadingDebts] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'table'>(() => {
    // Default to card view on mobile, table view on larger screens
    return window.innerWidth < 768 ? 'card' : 'table';
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
    if (contact && contact.id) {
      fetchRelatedDebts();
    }
  }, [contact.id]);

  const fetchRelatedDebts = async () => {
    try {
      setIsLoadingDebts(true);
      
      const { data, error } = await supabase
        .from('debts')
        .select(`
          *,
          contacts:contact_id (name)
        `)
        .eq('contact_id', contact.id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to include contact_name
      const transformedData = data?.map(debt => ({
        ...debt,
        contact_name: debt.contacts?.name || 'Unknown Contact'
      })) || [];
      
      setRelatedDebts(transformedData);
    } catch (error) {
      console.error('Error fetching related debts:', error);
      toast.error('Failed to load related debts');
    } finally {
      setIsLoadingDebts(false);
    }
  };

  const handleEditClick = () => {
    setEditingContact(true);
  };

  const handleCancelEdit = () => {
    setEditingContact(false);
  };

  const handleDeleteClick = async () => {
    setIsCheckingDebts(true);
    try {
      // Check for any linked debts
      const { data: linkedDebts, error: debtsError } = await supabase
        .from('debts')
        .select('id, status')
        .eq('contact_id', contact.id);

      if (debtsError) throw debtsError;

      if (linkedDebts && linkedDebts.length > 0) {
        const activeDebts = linkedDebts.filter(debt => debt.status === 'active');
        const completedDebts = linkedDebts.filter(debt => debt.status === 'completed');
        
        let message = `This contact cannot be deleted because they are linked to ${linkedDebts.length} debt record${linkedDebts.length > 1 ? 's' : ''}:`;
        if (activeDebts.length > 0) {
          message += `\n• ${activeDebts.length} active debt${activeDebts.length > 1 ? 's' : ''}`;
        }
        if (completedDebts.length > 0) {
          message += `\n• ${completedDebts.length} completed debt${completedDebts.length > 1 ? 's' : ''}`;
        }
        message += '\n\nPlease delete or reassign all associated debts before deleting this contact.';
        
        setLinkedDebtsMessage(message);
        return;
      }

      // If no linked debts, show confirmation popup
      setShowDeleteConfirm(true);
    } catch (error) {
      console.error('Error checking linked debts:', error);
      toast.error('Failed to check for linked debts');
    } finally {
      setIsCheckingDebts(false);
    }
  };

  const handleDeleteConfirm = async () => {
    try {
      await onDeleteContact(contact.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting contact:', error);
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleLinkedDebtsModalClose = () => {
    setLinkedDebtsMessage(null);
  };

  const handleSubmitEdit = async (formData: ContactFormData) => {
    try {
      await onEditContact(formData);
      setEditingContact(false);
    } catch (error) {
      console.error('Error updating contact:', error);
      // Error will be shown by the parent component
    }
  };

  const handleViewDebtDetails = (debt: Debt) => {
    navigate(`/debts/${debt.id}`);
  };

  const handleAddNewDebt = () => {
    // Store the contact ID in sessionStorage to be used by the Debts component
    sessionStorage.setItem('preselectedContactId', contact.id);
    sessionStorage.setItem('preselectedContactName', contact.name);
    // Navigate to the debts page with a query parameter to open the form
    navigate('/debts?addNew=true');
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'card' ? 'table' : 'card');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <button 
          onClick={onBack}
          className="p-1.5 rounded-md bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
          aria-label="Go back"
        >
          <ArrowLeft size={18} />
        </button>
        <h2 className="text-lg font-bold text-white">
          Contact Details
        </h2>
      </div>

      {/* Contact Details Section */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-medium text-white">
            Contact Information
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleEditClick}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs flex items-center"
            >
              <Edit size={14} className="mr-1.5" />
              Edit Contact
            </button>
            <button
              onClick={handleDeleteClick}
              disabled={isCheckingDebts}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-xs flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 size={14} className="mr-1.5" />
              {isCheckingDebts ? 'Checking...' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Name</p>
              <p className="text-white text-sm font-medium">{contact.name}</p>
            </div>
            
            {contact.referral_name && (
              <div>
                <p className="text-gray-400 text-xs mb-1">Referred By</p>
                <div className="flex items-center text-white text-sm">
                  <UserIcon size={14} className="mr-1.5 text-gray-400" />
                  {contact.referral_name}
                </div>
              </div>
            )}
            
            {contact.phone && (
              <div>
                <p className="text-gray-400 text-xs mb-1">Phone</p>
                <div className="flex items-center text-white text-sm">
                  <Phone size={14} className="mr-1.5 text-gray-400" />
                  {contact.phone}
                </div>
              </div>
            )}
            
            {contact.address && (
              <div className="col-span-1 md:col-span-2">
                <p className="text-gray-400 text-xs mb-1">Address</p>
                <div className="flex items-start text-white text-sm">
                  <MapPin size={14} className="mr-1.5 mt-0.5 text-gray-400" />
                  <span className="break-words">{contact.address}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Related Debts Section */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center">
            <DollarSign size={18} className="mr-2 text-blue-400" />
            <h3 className="text-base font-medium text-white">
              Related Debts
            </h3>
          </div>
          <div className="flex gap-2">
            <button
              onClick={toggleViewMode}
              className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md transition-colors text-xs"
              title={viewMode === 'card' ? 'Switch to table view' : 'Switch to card view'}
            >
              <ArrowUpDown size={14} />
              {viewMode === 'card' ? 'Table' : 'Cards'}
            </button>
            <button
              onClick={handleAddNewDebt}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs flex items-center"
            >
              Add New Debt
            </button>
          </div>
        </div>

        <DebtList
          debts={relatedDebts}
          onViewActivities={handleViewDebtDetails}
          isLoading={isLoadingDebts}
          viewMode={viewMode}
          isCompact={true}
        />
      </div>

      {/* Linked Debts Modal */}
      {linkedDebtsMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-2">Cannot Delete Contact</h3>
            <p className="text-gray-300 text-sm mb-4 whitespace-pre-line">
              {linkedDebtsMessage}
            </p>
            <div className="flex justify-end">
              <button
                onClick={handleLinkedDebtsModalClose}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-sm"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 max-w-sm w-full mx-4">
            <h3 className="text-lg font-medium text-white mb-2">Confirm Delete</h3>
            <p className="text-gray-300 text-sm mb-4">
              Are you sure you want to delete this contact? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={handleDeleteCancel}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-xs"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-4 max-w-2xl w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-white">Edit Contact</h3>
              <button
                onClick={handleCancelEdit}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            <ContactForm
              onSubmit={handleSubmitEdit}
              onCancel={handleCancelEdit}
              initialData={contact}
              isSubmitting={false}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactDetails;