import React, { useState, useEffect } from 'react';
import { Activity, ActivityFormData } from '../types/activity';
import { X } from 'lucide-react';

interface ActivityFormProps {
  onSubmit: (data: ActivityFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Activity;
  isSubmitting: boolean;
  debtType: 'I Owe' | 'Owe Me';
}

const ActivityForm: React.FC<ActivityFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
  debtType
}) => {
  const [formData, setFormData] = useState<ActivityFormData>({
    activity_type: 'Interest',
    amount: 0,
    activity_date: new Date().toISOString().split('T')[0],
    notes: '',
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        activity_type: initialData.activity_type,
        amount: initialData.amount,
        activity_date: initialData.activity_date.split('T')[0],
        notes: initialData.notes || '',
      });
    }
  }, [initialData]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'amount') {
      // Ensure we have a valid number
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData(prev => ({ ...prev, [name]: numValue }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (formData.amount <= 0) {
      alert('Amount must be greater than 0');
      return;
    }
    
    if (!formData.activity_date) {
      alert('Please select an activity date');
      return;
    }
    
    await onSubmit(formData);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-medium text-white">
          {initialData ? 'Edit Activity' : 'Add New Activity'}
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
        {/* Activity Type */}
        <div>
          <label htmlFor="activity_type" className="block text-xs font-medium text-gray-300 mb-1">
            Activity Type *
          </label>
          <select
            id="activity_type"
            name="activity_type"
            required
            value={formData.activity_type}
            onChange={handleChange}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
          >
            <option value="Interest">Interest</option>
            <option value="Note">Note</option>
          </select>
        </div>

        {/* Amount */}
        <div>
          <label htmlFor="amount" className="block text-xs font-medium text-gray-300 mb-1">
            Amount *
          </label>
          <input
            id="amount"
            name="amount"
            type="number"
            step="0.01"
            min="0"
            required={formData.activity_type !== 'Note'}
            value={formData.amount}
            onChange={handleChange}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            placeholder="0.00"
            disabled={formData.activity_type === 'Note'}
          />
          {formData.activity_type === 'Note' && (
            <p className="mt-1 text-xs text-gray-400">No amount needed for notes</p>
          )}
        </div>

        {/* Activity Date */}
        <div>
          <label htmlFor="activity_date" className="block text-xs font-medium text-gray-300 mb-1">
            Activity Date *
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
            Notes {formData.activity_type === 'Note' && '*'}
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            required={formData.activity_type === 'Note'}
            rows={3}
            className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white resize-none text-sm"
            placeholder="Additional notes about this activity"
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

export default ActivityForm;