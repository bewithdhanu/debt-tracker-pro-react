import React, { useState, useEffect, useRef } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Contact {
  id: string;
  name: string;
}

interface ContactSelectProps {
  selectedContact: Contact | null;
  onSelect: (contact: Contact | null) => void;
  className?: string;
}

export const ContactSelect: React.FC<ContactSelectProps> = ({
  selectedContact,
  onSelect,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchContacts();
  }, []);

  useEffect(() => {
    // Filter contacts based on search term
    const filtered = contacts.filter(contact =>
      contact.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredContacts(filtered);
  }, [searchTerm, contacts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('contacts')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setContacts(data || []);
      setFilteredContacts(data || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (contact: Contact | null) => {
    onSelect(contact);
    setSearchTerm('');
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-700 border border-gray-700 rounded-md hover:bg-gray-650 text-white text-xs cursor-pointer min-w-[180px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex-1 truncate">
          {selectedContact ? (
            <div className="flex items-center justify-between">
              <span>{selectedContact.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(null);
                }}
                className="p-0.5 hover:bg-gray-600 rounded-full"
              >
                <X size={12} className="text-gray-400" />
              </button>
            </div>
          ) : (
            <span className="text-gray-400">Select Contact</span>
          )}
        </div>
        <ChevronDown
          size={14}
          className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-20">
          <div className="p-1.5">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search contacts..."
              className="w-full px-2 py-1 bg-gray-700 border border-gray-600 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-transparent text-white text-xs"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-3">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredContacts.length === 0 ? (
              <div className="px-3 py-2 text-xs text-gray-400">No contacts found</div>
            ) : (
              <div className="py-1">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between ${
                      selectedContact?.id === contact.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                    onClick={() => handleSelect(contact)}
                  >
                    {contact.name}
                    {selectedContact?.id === contact.id && (
                      <Check size={12} className="text-white" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}; 