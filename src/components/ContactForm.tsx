import React, { useState, useEffect } from 'react';
import { Contact, ContactFormData } from '../types/contact';
import { X } from 'lucide-react';

interface ContactFormProps {
  onSubmit: (data: ContactFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Contact;
  isSubmitting: boolean;
}

const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    referral_name: '',
    address: '',
    phone: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        referral_name: initialData.referral_name || '',
        address: initialData.address || '',
        phone: initialData.phone || '',
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(formData);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-medium text-white">
          {initialData ? 'Edit Contact' : 'Add New Contact'}
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label htmlFor="name" className="block text-xs font-medium text-gray-300 mb-1">
              Name *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
              placeholder="Contact name"
            />
          </div>

          <div>
            <label htmlFor="referral_name" className="block text-xs font-medium text-gray-300 mb-1">
              Referral Name
            </label>
            <input
              id="referral_name"
              name="referral_name"
              type="text"
              value={formData.referral_name}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
              placeholder="Who referred this contact"
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-xs font-medium text-gray-300 mb-1">
              Phone Number
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
              placeholder="Contact phone number"
            />
          </div>

          <div className="md:col-span-3">
            <label htmlFor="address" className="block text-xs font-medium text-gray-300 mb-1">
              Address
            </label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={2}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-none text-sm"
              placeholder="Contact address"
            />
          </div>
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

export default ContactForm;