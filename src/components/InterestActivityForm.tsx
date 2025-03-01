import React, { useState, useEffect } from 'react';
import { Activity, InterestActivityFormData } from '../types/activity';
import { Debt } from '../types/debt';
import { X, Check } from 'lucide-react';

interface InterestActivityFormProps {
  onSubmit: (data: InterestActivityFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Activity;
  isSubmitting: boolean;
  debt: Debt;
}

const InterestActivityForm: React.FC<InterestActivityFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isSubmitting,
  debt
}) => {
  const [formData, setFormData] = useState<InterestActivityFormData>({
    months: 1,
    amount: 0,
    activity_date: new Date().toISOString().split('T')[0],
    closing_debt: false,
    notes: '',
  });
  const [totalPayable, setTotalPayable] = useState<number>(0);

  // Calculate interest based on principal amount, interest rate, and number of months
  const calculateInterest = (months: number) => {
    return (debt.principal_amount * debt.interest_rate * months) / 100;
  };

  // Initialize form data
  useEffect(() => {
    if (initialData && initialData.activity_type === 'Interest') {
      setFormData({
        months: initialData.months || 1,
        amount: initialData.amount,
        activity_date: initialData.activity_date.split('T')[0],
        closing_debt: initialData.closing_debt || false,
        notes: initialData.notes || '',
      });
    } else {
      // Set default interest amount for new activity
      const defaultInterest = calculateInterest(1);
      setFormData(prev => ({
        ...prev,
        amount: parseFloat(defaultInterest.toFixed(2))
      }));
    }
  }, [initialData, debt]);

  // Update total payable when amount or closing_debt changes
  useEffect(() => {
    let total = formData.amount;
    if (formData.closing_debt) {
      total += debt.principal_amount;
    }
    setTotalPayable(total);
  }, [formData.amount, formData.closing_debt, debt.principal_amount]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'months') {
      const months = parseInt(value);
      if (!isNaN(months) && months > 0) {
        const newInterestAmount = calculateInterest(months);
        setFormData(prev => ({ 
          ...prev, 
          months, 
          amount: parseFloat(newInterestAmount.toFixed(2))
        }));
      }
    } else if (name === 'amount') {
      const amount = parseFloat(value);
      if (!isNaN(amount) && amount >= 0) {
        setFormData(prev => ({ ...prev, amount }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (formData.months <= 0) {
      alert('Number of months must be greater than 0');
      return;
    }
    
    if (formData.amount <= 0) {
      alert('Interest amount must be greater than 0');
      return;
    }
    
    if (!formData.activity_date) {
      alert('Please select an activity date');
      return;
    }
    
    await onSubmit(formData);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-medium text-white">
          {initialData ? 'Edit Interest Payment' : 'Add Interest Payment'}
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
        {/* Row with Months, Interest Amount, and Payment Date */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Number of Months */}
          <div>
            <label htmlFor="months" className="block text-xs font-medium text-gray-300 mb-1">
              Number of Months *
            </label>
            <input
              id="months"
              name="months"
              type="number"
              min="1"
              step="1"
              required
              value={formData.months}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            />
          </div>

          {/* Interest Amount */}
          <div>
            <label htmlFor="amount" className="block text-xs font-medium text-gray-300 mb-1">
              Payable Interest *
            </label>
            <input
              id="amount"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white text-sm"
            />
          </div>

          {/* Activity Date */}
          <div>
            <label htmlFor="activity_date" className="block text-xs font-medium text-gray-300 mb-1">
              Payment Date *
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
        </div>

        {/* Interest calculation info */}
        <p className="text-xs text-gray-400 -mt-1">
          Auto-calculated based on {debt.interest_rate}% per month for {formData.months} month(s)
        </p>

        {/* Closing Debt Checkbox - Custom styled checkbox */}
        <div className="flex items-center">
          <div className="relative flex items-center">
            <input
              id="closing_debt"
              name="closing_debt"
              type="checkbox"
              checked={formData.closing_debt}
              onChange={handleChange}
              className="opacity-0 absolute h-4 w-4 cursor-pointer"
            />
            <div className={`border ${formData.closing_debt ? 'bg-blue-600 border-blue-600' : 'bg-gray-700 border-gray-600'} rounded h-4 w-4 flex flex-shrink-0 justify-center items-center mr-2`}>
              {formData.closing_debt && <Check size={12} className="text-white" />}
            </div>
            <label htmlFor="closing_debt" className="block text-sm text-gray-300 cursor-pointer">
              Close this debt (mark as completed)
            </label>
          </div>
        </div>

        {/* Total Payable */}
        <div className="bg-gray-750 p-3 rounded-md">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-300">Total Payable:</span>
            <span className="text-lg font-semibold text-white">{formatCurrency(totalPayable)}</span>
          </div>
          <div className="mt-1 text-xs text-gray-400">
            {formData.closing_debt 
              ? `Interest (${formatCurrency(formData.amount)}) + Principal (${formatCurrency(debt.principal_amount)})`
              : 'Interest only'}
          </div>
        </div>

        {/* Notes */}
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
            placeholder="Additional notes about this interest payment"
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

export default InterestActivityForm;