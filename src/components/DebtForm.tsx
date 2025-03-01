import React, { useState, useEffect } from 'react';
import { Debt, DebtFormData } from '../types/debt';
import { Contact } from '../types/contact';
import { X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface DebtFormProps {
  onSubmit: (data: DebtFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Debt;
  isSubmitting: boolean;
  userId: string;
}

const DebtForm: React.FC<DebtFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
  userId
}) => {
  const [formData, setFormData] = useState<DebtFormData>({
    contact_id: '',
    principal_amount: 0,
    interest_rate: 0,
    debt_date: new Date().toISOString().split('T')[0],
    type: 'I Owe',
    status: 'active',
    notes: '',
  });
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [selectedContactName, setSelectedContactName] = useState('');
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [userId]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        contact_id: initialData.contact_id,
        principal_amount: initialData.principal_amount,
        interest_rate: initialData.interest_rate,
        debt_date: initialData.debt_date.split('T')[0],
        type: initialData.type,
        status: initialData.status || 'active',
        notes: initialData.notes || '',
      });
      
      // Set the selected contact name if available
      if (initialData.contact_name) {
        setSelectedContactName(initialData.contact_name);
      } else {
        // Fetch the contact name if not provided
        const contact = contacts.find(c => c.id === initialData.contact_id);
        if (contact) {
          setSelectedContactName(contact.name);
        }
      }
    }
  }, [initialData, contacts]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredContacts(contacts);
    } else {
      filterContacts();
    }
  }, [searchTerm, contacts]);

  const fetchContacts = async () => {
    try {
      setIsLoadingContacts(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const filterContacts = async () => {
    try {
      setIsLoadingContacts(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('user_id', userId)
        .ilike('name', `%${searchTerm}%`)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error filtering contacts:', error);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'principal_amount' || name === 'interest_rate') {
      // Ensure we have a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleContactSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowContactDropdown(true);
  };

  const handleContactSelect = (contact: Contact) => {
    setFormData(prev => ({ ...prev, contact_id: contact.id }));
    setSelectedContactName(contact.name);
    setSearchTerm('');
    setShowContactDropdown(false);
  };

  const handleAddNewContact = () => {
    // Navigate to contacts page with a flag to open the form
    window.location.href = '/contacts?addNew=true';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.contact_id) {
      toast.error('Please select a contact');
      return;
    }
    
    if (formData.principal_amount <= 0) {
      toast.error('Principal amount must be greater than 0');
      return;
    }
    
    if (formData.interest_rate < 0) {
      toast.error('Interest rate cannot be negative');
      return;
    }
    
    if (!formData.debt_date) {
      toast.error('Please select a debt date');
      return;
    }
    
    await onSubmit(formData);
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event. target as HTMLElement;
      if (showContactDropdown && !target.closest('.contact-dropdown-container')) {
        setShowContactDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showContactDropdown]);

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-medium text-white">
          {initialData ? 'Edit Debt' : 'Add New Debt'}
        </h3>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Grid for all form fields except Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Contact Selection */}
          <div className="contact-dropdown-container">
            <label htmlFor="contact" className="block text-xs font-medium text-gray-300 mb-1">
              Contact Person *
            </label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={handleContactSearch}
                onFocus={() => setShowContactDropdown(true)}
                placeholder={selectedContactName || "Search for a contact..."}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
              />
              <button
                type="button"
                onClick={handleAddNewContact}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-blue-400"
                title="Add new contact"
              >
                <Plus size={16} />
              </button>
              
              {showContactDropdown && (
                <div className="absolute z-50 mt-1 w-full bg-gray-700 border border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
                  {isLoadingContacts ? (
                    <div className="px-3 py-2 text-gray-400 text-sm flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
                      Loading...
                    </div>
                  ) : filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        className="px-3 py-2 hover:bg-gray-600 cursor-pointer text-white text-sm"
                        onClick={() => handleContactSelect(contact)}
                      >
                        {contact.name}
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-gray-400 text-sm">
                      No contacts found. <button type="button" className="text-blue-400 hover:underline" onClick={handleAddNewContact}>Add new</button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {selectedContactName && (
              <p className="mt-1 text-xs text-blue-400">Selected: {selectedContactName}</p>
            )}
          </div>

          {/* Type */}
          <div>
            <label htmlFor="type" className="block text-xs font-medium text-gray-300 mb-1">
              Type *
            </label>
            <select
              id="type"
              name="type"
              required
              value={formData.type}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            >
              <option value="I Owe">I Owe</option>
              <option value="Owe Me">Owe Me</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="status" className="block text-xs font-medium text-gray-300 mb-1">
              Status *
            </label>
            <select
              id="status"
              name="status"
              required
              value={formData.status}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          {/* Principal Amount */}
          <div>
            <label htmlFor="principal_amount" className="block text-xs font-medium text-gray-300 mb-1">
              Principal Amount *
            </label>
            <input
              id="principal_amount"
              name="principal_amount"
              type="number"
              step="0.01"
              min="0.01"
              required
              value={formData.principal_amount}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
              placeholder="0.00"
            />
          </div>

          {/* Interest Rate */}
          <div>
            <label htmlFor="interest_rate" className="block text-xs font-medium text-gray-300 mb-1">
              Interest Rate *
            </label>
            <input
              id="interest_rate"
              name="interest_rate"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.interest_rate}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
              placeholder="0.00"
            />
            <p className="mt-1 text-xs text-gray-400">per month, per 100</p>
          </div>

          {/* Debt Date */}
          <div>
            <label htmlFor="debt_date" className="block text-xs font-medium text-gray-300 mb-1">
              Debt Open Date *
            </label>
            <div className="relative">
              <input
                id="debt_date"
                name="debt_date"
                type="date"
                required
                value={formData.debt_date}
                onChange={handleChange}
                className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm appearance-none"
              />
            </div>
          </div>
        </div>

        {/* Notes - Full width */}
        <div>
          <label htmlFor="notes" className="block text-xs font-medium text-gray-300 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-none text-sm"
            placeholder="Additional notes about this debt"
          />
        </div>

        <div className="flex justify-end space-x-2 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-white rounded-md transition-colors text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[70px] text-xs"
          >
            {isSubmitting ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]"></span>
            ) : initialData ? (
              'Update'
            ) : (
              'Save'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DebtForm;