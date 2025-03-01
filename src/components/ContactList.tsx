import React from 'react';
import { Contact } from '../types/contact';
import { Edit, Trash2, Phone, MapPin, User, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';

interface ContactListProps {
  contacts: Contact[];
  onEdit: (contact: Contact) => void;
  onDelete: (contactId: string) => void;
  isLoading: boolean;
  viewMode: 'card' | 'table';
  searchTerm: string;
  onSort?: (key: keyof Contact) => void;
  sortConfig?: {
    key: keyof Contact;
    direction: 'ascending' | 'descending';
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

const ContactList: React.FC<ContactListProps> = ({
  contacts,
  onEdit,
  onDelete,
  isLoading,
  viewMode,
  searchTerm,
  onSort,
  sortConfig,
  pagination
}) => {
  const { currentPage, totalPages, onPageChange } = pagination;
  
  // Render sort indicator
  const renderSortIndicator = (key: keyof Contact) => {
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-400 mb-2 text-sm">
          {searchTerm ? 'No contacts match your search criteria.' : 'You don\'t have any contacts yet.'}
        </p>
        {!searchTerm && (
          <p className="text-gray-500 text-xs">Add your first contact using the button above.</p>
        )}
      </div>
    );
  }

  // Card View
  if (viewMode === 'card') {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors"
            >
              <div className="flex justify-between items-start mb-1.5">
                <h3 className="text-base font-medium text-white">{contact.name}</h3>
                <div className="flex space-x-1.5">
                  <button
                    onClick={() => onEdit(contact)}
                    className="text-gray-400 hover:text-blue-400 transition-colors"
                    aria-label={`Edit ${contact.name}`}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => onDelete(contact.id)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                    aria-label={`Delete ${contact.name}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                {contact.referral_name && (
                  <div className="flex items-center text-gray-400">
                    <User size={14} className="mr-1.5 flex-shrink-0" />
                    <span>Referred by: {contact.referral_name}</span>
                  </div>
                )}
                
                {contact.address && (
                  <div className="flex items-start text-gray-400">
                    <MapPin size={14} className="mr-1.5 mt-0.5 flex-shrink-0" />
                    <span className="break-words">{contact.address}</span>
                  </div>
                )}
                
                {contact.phone && (
                  <div className="flex items-center text-gray-400">
                    <Phone size={14} className="mr-1.5 flex-shrink-0" />
                    <span>{contact.phone}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Pagination */}
        {renderPagination()}
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
                onClick={() => onSort && onSort('name')}
              >
                <div className="flex items-center">
                  Name
                  {renderSortIndicator('name')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-750"
                onClick={() => onSort && onSort('referral_name')}
              >
                <div className="flex items-center">
                  Referral
                  {renderSortIndicator('referral_name')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-750"
                onClick={() => onSort && onSort('phone')}
              >
                <div className="flex items-center">
                  Phone
                  {renderSortIndicator('phone')}
                </div>
              </th>
              <th 
                scope="col" 
                className="px-4 py-3 cursor-pointer hover:bg-gray-750"
                onClick={() => onSort && onSort('address')}
              >
                <div className="flex items-center">
                  Address
                  {renderSortIndicator('address')}
                </div>
              </th>
              <th scope="col" className="px-4 py-3 rounded-tr-lg text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact, index) => (
              <tr 
                key={contact.id} 
                className={`bg-gray-800 border-b border-gray-700 hover:bg-gray-750 ${
                  index === contacts.length - 1 ? 'rounded-b-lg' : ''
                }`}
              >
                <td className="px-4 py-2.5 font-medium text-white">
                  {contact.name}
                </td>
                <td className="px-4 py-2.5">
                  {contact.referral_name || '-'}
                </td>
                <td className="px-4 py-2.5">
                  {contact.phone || '-'}
                </td>
                <td className="px-4 py-2.5 max-w-xs truncate">
                  {contact.address || '-'}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => onEdit(contact)}
                      className="text-gray-400 hover:text-blue-400 transition-colors"
                      aria-label={`Edit ${contact.name}`}
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(contact.id)}
                      className="text-gray-400 hover:text-red-400 transition-colors"
                      aria-label={`Delete ${contact.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {renderPagination()}
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
              pageToShow = totalPages - 4 + i;
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

export default ContactList;