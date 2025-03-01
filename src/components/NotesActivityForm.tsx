import React, { useState, useEffect } from 'react';
import { Activity, NotesActivityFormData } from '../types/activity';
import { X } from 'lucide-react';

interface NotesActivityFormProps {
  onSubmit: (data: NotesActivityFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Activity;
  isSubmitting: boolean;
}

const NotesActivityForm: React.FC<NotesActivityFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting
}) => {
  const [formData, setFormData] = useState<NotesActivityFormData>({
    activity_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (initialData && initialData.activity_type === 'Note') {
      setFormData({
        activity_date: initialData.activity_date.split('T')[0],
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.activity_date) {
      alert('Please select an activity date');
      return;
    }
    
    if (!formData.notes.trim()) {
      alert('Please enter notes');
      return;
    }
    
    await onSubmit(formData);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-medium text-white">
          {initialData ? 'Edit Note' : 'Add New Note'}
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
        {/* Activity Date */}
        <div>
          <label htmlFor="activity_date" className="block text-xs font-medium text-gray-300 mb-1">
            Date *
          </label>
          <div className="relative">
            <input
              id="activity_date"
              name="activity_date"
              type="date"
              required
              value={formData.activity_date}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm appearance-none"
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-xs font-medium text-gray-300 mb-1">
            Notes *
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-none text-sm"
            placeholder="Enter your notes here..."
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

export default NotesActivityForm;