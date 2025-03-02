import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Debt } from '../types/debt';
import { User } from '../types/auth';
import { Activity, InterestActivityFormData, NotesActivityFormData } from '../types/activity';
import DebtForm from './DebtForm';
import NotesActivityForm from './NotesActivityForm';
import InterestActivityForm from './InterestActivityForm';
import ActivityList from './ActivityList';
import { ArrowLeft, Plus, FileText, TrendingUp, Calendar, DollarSign, TrendingDown, TrendingUp as TrendingUpIcon, ChevronLeft, Edit, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { getDaysInMonth, getDate } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useCurrency } from '../hooks/useCurrency';

interface DebtActivitiesProps {
  user: User;
  debt: Debt;
  onBack: () => void;
  onEditDebt: (debt: Debt) => void;
  onDeleteDebt: (debtId: string) => void;
}

interface PendingInterestInfo {
  exactPeriod: number;
  exactMonths: number;
  exactDays: number;
  roundUpMonths: number;
  roundDownMonths: number;
  exactInterest: number;
  roundUpInterest: number;
  roundDownInterest: number;
  lastPaymentDate: Date | null;
}

const DebtActivities: React.FC<DebtActivitiesProps> = ({ user, debt, onBack, onEditDebt, onDeleteDebt }) => {
  const navigate = useNavigate();
  const { formatCurrency } = useCurrency();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [activityType, setActivityType] = useState<'Interest' | 'Note' | null>(null);
  const [currentActivity, setCurrentActivity] = useState<Activity | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingDebt, setEditingDebt] = useState(false);
  const [currentDebt, setCurrentDebt] = useState<Debt>(debt);
  const [pendingInterest, setPendingInterest] = useState<PendingInterestInfo | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (debt && debt.id) {
      fetchActivities();
    }
  }, [debt.id]);

  // Calculate pending months, days and interest based on last payment date
  const calculatePendingInterest = (activitiesData: Activity[], debtToUse: Debt = currentDebt) => {
    // Only calculate for active debts
    if (debtToUse.status !== 'active') {
      setPendingInterest(null);
      return;
    }

    // Find all interest activities
    const interestActivities = activitiesData.filter(
      activity => activity.activity_type === 'Interest'
    );
    
    // Calculate total months of interest paid
    const totalMonthsPaid = interestActivities.reduce((sum, activity) => 
      sum + (activity.months || 0), 0);
    
    // Get the debt start date
    const debtStartDate = new Date(debtToUse.debt_date);
    
    // Get current date
    const currentDate = new Date();
    
    // Calculate total months from debt start to now
    let totalMonths = (currentDate.getFullYear() - debtStartDate.getFullYear()) * 12 + 
                      (currentDate.getMonth() - debtStartDate.getMonth());
    
    // Calculate remaining days
    const startDay = debtStartDate.getDate();
    const currentDay = currentDate.getDate();
    
    let exactDays = 0;
    
    // If we're past the same day of the month, it's a full month
    if (currentDay >= startDay) {
      exactDays = currentDay - startDay;
    } else {
      // We're before the same day of the month, so it's not a full month
      totalMonths -= 1;
      
      // Calculate days from last month
      const lastDayOfPrevMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        0
      ).getDate();
      
      exactDays = lastDayOfPrevMonth - startDay + currentDay;
    }
    
    // Calculate pending months (total months minus paid months)
    const exactMonths = Math.max(0, totalMonths - totalMonthsPaid);
    
    const fractionalMonth = exactDays / getDaysInMonth(currentDate);
    const exactPeriod = exactMonths + fractionalMonth;
    
    // Round up and down months
    const roundUpMonths = Math.ceil(exactPeriod);
    const roundDownMonths = Math.floor(exactPeriod);
    
    // Calculate interest for each period
    const exactInterest = (debtToUse.principal_amount * debtToUse.interest_rate * exactMonths) / 100;
    const roundUpInterest = (debtToUse.principal_amount * debtToUse.interest_rate * roundUpMonths) / 100;
    const roundDownInterest = (debtToUse.principal_amount * debtToUse.interest_rate * roundDownMonths) / 100;

    // Find the most recent interest payment for display purposes
    const lastPaymentDate = interestActivities.length > 0 
      ? new Date(interestActivities.sort((a, b) => 
          new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime()
        )[0].activity_date) 
      : null;
    
    setPendingInterest({
      exactPeriod,
      exactMonths,
      exactDays,
      roundUpMonths,
      roundDownMonths,
      exactInterest,
      roundUpInterest,
      roundDownInterest,
      lastPaymentDate
    });
  };

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('debt_activities')
        .select('*')
        .eq('debt_id', debt.id)
        .order('activity_date', { ascending: false });

      if (error) {
        throw error;
      }
      
      setActivities(data || []);
      
      // Calculate pending interest after fetching activities
      calculatePendingInterest(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddActivity = (type: 'Interest' | 'Note') => {
    setCurrentActivity(undefined);
    setActivityType(type);
    setShowForm(true);
  };

  const handleEditActivity = (activity: Activity) => {
    setCurrentActivity(activity);
    setActivityType(activity.activity_type as 'Interest' | 'Note');
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setActivityType(null);
    setCurrentActivity(undefined);
  };

  const handleSubmitNotesForm = async (formData: NotesActivityFormData) => {
    setIsSubmitting(true);
    try {
      if (currentActivity) {
        // Update existing activity
        const { error } = await supabase
          .from('debt_activities')
          .update({
            activity_type: 'Note',
            amount: 0,
            activity_date: formData.activity_date,
            notes: formData.notes,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentActivity.id);

        if (error) throw error;
        toast.success('Note updated successfully');
      } else {
        // Create new activity
        const { error } = await supabase.from('debt_activities').insert({
          debt_id: debt.id,
          user_id: user.id,
          activity_type: 'Note',
          amount: 0,
          activity_date: formData.activity_date,
          notes: formData.notes,
        });

        if (error) throw error;
        toast.success('Note added successfully');
      }

      // Refresh activities and reset form
      await fetchActivities();
      setShowForm(false);
      setActivityType(null);
      setCurrentActivity(undefined);
    } catch (error) {
      console.error('Error saving note:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save note');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitInterestForm = async (formData: InterestActivityFormData) => {
    setIsSubmitting(true);
    try {
      if (currentActivity) {
        // Update existing activity
        const { error } = await supabase
          .from('debt_activities')
          .update({
            activity_type: 'Interest',
            amount: formData.amount,
            activity_date: formData.activity_date,
            notes: formData.notes || null,
            months: formData.months,
            closing_debt: formData.closing_debt,
            updated_at: new Date().toISOString(),
          })
          .eq('id', currentActivity.id);

        if (error) throw error;
        
        // Update debt status based on closing_debt flag
        const newStatus = formData.closing_debt ? 'completed' : 'active';
        
        // Only update if the status has changed
        if (currentDebt.status !== newStatus) {
          const { error: debtError } = await supabase
            .from('debts')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString(),
            })
            .eq('id', debt.id);
            
          if (debtError) throw debtError;
          
          // Update local debt state
          setCurrentDebt({
            ...currentDebt,
            status: newStatus
          });
          
          // Recalculate pending interest
          fetchActivities();
        } else {
          // Still recalculate pending interest even if status didn't change
          fetchActivities();
        }
        
        toast.success('Interest payment updated successfully');
      } else {
        // Create new activity
        const { error } = await supabase.from('debt_activities').insert({
          debt_id: debt.id,
          user_id: user.id,
          activity_type: 'Interest',
          amount: formData.amount,
          activity_date: formData.activity_date,
          notes: formData.notes || null,
          months: formData.months,
          closing_debt: formData.closing_debt,
        });

        if (error) throw error;
        
        // If closing debt, update debt status
        if (formData.closing_debt) {
          const { error: debtError } = await supabase
            .from('debts')
            .update({
              status: 'completed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', debt.id);
            
          if (debtError) throw debtError;
          
          // Update local debt state
          setCurrentDebt({
            ...currentDebt,
            status: 'completed'
          });
          
          // Recalculate pending interest
          fetchActivities();
        } else {
          // Still recalculate pending interest even if not closing
          fetchActivities();
        }
        
        toast.success('Interest payment added successfully');
      }

      // Reset form
      setShowForm(false);
      setActivityType(null);
      setCurrentActivity(undefined);
    } catch (error) {
      console.error('Error saving interest payment:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to save interest payment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteActivity = async (activityId: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      // Check if this is a closing debt activity
      const activity = activities.find(a => a.id === activityId);
      
      const { error } = await supabase
        .from('debt_activities')
        .delete()
        .eq('id', activityId);

      if (error) throw error;
      
      // If we're deleting a closing debt activity, reopen the debt
      if (activity && activity.closing_debt) {
        const { error: debtError } = await supabase
          .from('debts')
          .update({
            status: 'active',
            updated_at: new Date().toISOString(),
          })
          .eq('id', debt.id);
          
        if (debtError) throw debtError;
        
        // Update local debt state
        setCurrentDebt({
          ...currentDebt,
          status: 'active'
        });
        
        // Recalculate pending interest
        fetchActivities();
        
        toast.success('Activity deleted and debt reopened');
      } else {
        toast.success('Activity deleted successfully');
        
        // Refresh the activities list
        fetchActivities();
      }
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  };

  const handleEditDebt = () => {
    setEditingDebt(true);
  };

  const handleCancelEditDebt = () => {
    setEditingDebt(false);
  };

  const handleUpdateDebt = async (formData: any) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('debts')
        .update({
          contact_id: formData.contact_id,
          principal_amount: formData.principal_amount,
          interest_rate: formData.interest_rate,
          debt_date: formData.debt_date,
          type: formData.type,
          notes: formData.notes || null,
          status: formData.status || currentDebt.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', debt.id);

      if (error) throw error;
      
      // Fetch the updated debt
      const { data, error: fetchError } = await supabase
        .from('debts')
        .select(`
          *,
          contacts:contact_id (name)
        `)
        .eq('id', debt.id)
        .single();
        
      if (fetchError) throw fetchError;
      
      // Update the current debt with the fetched data
      if (data) {
        const updatedDebt = {
          ...data,
          contact_name: data.contacts?.name || 'Unknown Contact'
        };
        
        // Fetch latest activities and recalculate pending interest
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('debt_activities')
          .select('*')
          .eq('debt_id', debt.id)
          .order('activity_date', { ascending: false });

        if (activitiesError) throw activitiesError;
        
        setActivities(activitiesData || []);
        setCurrentDebt(updatedDebt);
        calculatePendingInterest(activitiesData || [], updatedDebt);
      }
      
      toast.success('Debt updated successfully');
      setEditingDebt(false);
    } catch (error) {
      console.error('Error updating debt:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Failed to update debt');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format decimal number
  const formatDecimal = (num: number) => {
    return num.toFixed(2);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleDeleteConfirm = () => {
    try {
      if (onDeleteDebt && typeof onDeleteDebt === 'function') {
        onDeleteDebt(debt.id);
        setShowDeleteConfirm(false);
        onBack(); // Navigate back after successful deletion
      } else {
        throw new Error('Delete function not provided');
      }
    } catch (error) {
      console.error('Error deleting debt:', error);
      toast.error('Failed to delete debt');
      setShowDeleteConfirm(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteConfirm(false);
  };

  const handleViewContact = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/contacts/${currentDebt.contact_id}`);
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
          Debt Details
        </h2>
      </div>

      {/* Debt Details Section */}
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-medium text-white">
            Debt Information
            {currentDebt.status === 'completed' && (
              <span className="ml-2 text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                Completed
              </span>
            )}
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={handleEditDebt}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors text-xs flex items-center"
            >
              <Edit size={14} className="mr-1.5" />
              Edit Debt
            </button>
            <button
              onClick={handleDeleteClick}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors text-xs flex items-center"
            >
              <Trash2 size={14} className="mr-1.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-4 max-w-sm w-full mx-4">
              <h3 className="text-lg font-medium text-white mb-2">Confirm Delete</h3>
              <p className="text-gray-300 text-sm mb-4">
                Are you sure you want to delete this debt? This action cannot be undone.
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

        {/* Edit Debt Modal */}
        {editingDebt && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-4 max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-white">Edit Debt</h3>
                <button
                  onClick={handleCancelEditDebt}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              <DebtForm
                onSubmit={handleUpdateDebt}
                onCancel={handleCancelEditDebt}
                initialData={currentDebt}
                isSubmitting={isSubmitting}
                userId={user.id}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-gray-400 text-xs mb-1">Contact</p>
              <div className="flex items-center">
                <button 
                  onClick={handleViewContact}
                  className="text-white text-sm font-medium hover:text-blue-400 transition-colors flex items-center"
                >
                  {currentDebt.contact_name}
                  <ExternalLink size={14} className="ml-1.5 text-gray-400" />
                </button>
              </div>
            </div>
            
            <div>
              <p className="text-gray-400 text-xs mb-1">Type</p>
              <p className={`text-sm font-medium ${currentDebt.type === 'I Owe' ? 'text-red-400' : 'text-green-400'}`}>
                {currentDebt.type}
              </p>
            </div>
            
            <div>
              <p className="text-gray-400 text-xs mb-1">Principal Amount</p>
              <p className="text-white text-sm font-medium">{formatCurrency(currentDebt.principal_amount)}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-xs mb-1">Interest Rate</p>
              <p className="text-white text-sm font-medium">{currentDebt.interest_rate}% per month</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-xs mb-1">Debt Date</p>
              <p className="text-white text-sm font-medium">{formatDate(currentDebt.debt_date)}</p>
            </div>
            
            <div>
              <p className="text-gray-400 text-xs mb-1">Status</p>
              <p className={`text-sm font-medium ${currentDebt.status === 'completed' ? 'text-green-400' : 'text-blue-400'}`}>
                {currentDebt.status === 'completed' ? 'Completed' : 'Active'}
              </p>
            </div>
            
            {currentDebt.notes && (
              <div className="col-span-1 md:col-span-2">
                <p className="text-gray-400 text-xs mb-1">Notes</p>
                <p className="text-white text-sm">{currentDebt.notes}</p>
              </div>
            )}
          </div>
          
          {/* Pending Interest Information - Only show for active debts */}
          {currentDebt.status === 'active' && pendingInterest && (
            <div className="mt-4 pt-4 border-t border-gray-700">
              <h4 className="text-sm font-medium text-white mb-3">Pending Interest Information</h4>
              
              <div className="bg-gray-750 rounded-lg p-3 space-y-3">
                <div className="flex items-center">
                  <Calendar size={16} className="text-blue-400 mr-2" />
                  <div>
                    <p className="text-gray-300 text-xs">Time Since Last Payment</p>
                    <p className="text-white text-sm">
                      {pendingInterest.exactMonths} months 
                      {pendingInterest.exactDays > 0 && ` and ${pendingInterest.exactDays} days`}
                    </p>
                    {pendingInterest.lastPaymentDate && (
                      <p className="text-gray-400 text-xs mt-1">
                        Last payment: {formatDate(pendingInterest.lastPaymentDate.toISOString())}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-gray-800 p-2 rounded-md">
                    <div className="flex items-center mb-1">
                      <DollarSign size={14} className="text-yellow-400 mr-1" />
                      <p className="text-gray-300 text-xs">Exact Interest</p>
                    </div>
                    <p className="text-white text-sm font-medium">
                      {formatCurrency(pendingInterest.exactInterest)}
                    </p>
                    <p className="text-gray-400 text-xs">
                      For {formatDecimal(pendingInterest.exactPeriod)} months
                    </p>
                  </div>
                  
                  <div className="bg-gray-800 p-2 rounded-md">
                    <div className="flex items-center mb-1">
                      <TrendingDown size={14} className="text-green-400 mr-1" />
                      <p className="text-gray-300 text-xs">Round Down</p>
                    </div>
                    <p className="text-white text-sm font-medium">
                      {formatCurrency(pendingInterest.roundDownInterest)}
                    </p>
                    <p className="text-gray-400 text-xs">
                      For {pendingInterest.roundDownMonths} months
                    </p>
                  </div>
                  
                  <div className="bg-gray-800 p-2 rounded-md">
                    <div className="flex items-center mb-1">
                      <TrendingUpIcon size={14} className="text-red-400 mr-1" />
                      <p className="text-gray-300 text-xs">Round Up</p>
                    </div>
                    <p className="text-white text-sm font-medium">
                      {formatCurrency(pendingInterest.roundUpInterest)}
                    </p>
                    <p className="text-gray-400 text-xs">
                      For {pendingInterest.roundUpMonths} months
                    </p>
                  </div>
                </div>
                
                <p className="text-xs text-gray-400 italic">
                  Note: Interest calculations are based on the time elapsed since the last payment or debt start date.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Activities Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-base font-medium text-white">
            Activities
          </h3>
          {!showForm && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAddActivity('Note')}
                className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded-md transition-colors text-xs"
              >
                <FileText size={14} />
                Add Note
              </button>
              <button
                onClick={() => handleAddActivity('Interest')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md transition-colors text-xs"
              >
                <TrendingUp size={14} />
                Add Interest
              </button>
            </div>
          )}
        </div>

        {showForm ? (
          activityType === 'Note' ? (
            <NotesActivityForm
              onSubmit={handleSubmitNotesForm}
              onCancel={handleCancelForm}
              initialData={currentActivity}
              isSubmitting={isSubmitting}
            />
          ) : (
            <InterestActivityForm
              onSubmit={handleSubmitInterestForm}
              onCancel={handleCancelForm}
              initialData={currentActivity}
              isSubmitting={isSubmitting}
              debt={currentDebt}
            />
          )
        ) : (
          <ActivityList
            activities={activities}
            onEdit={handleEditActivity}
            onDelete={handleDeleteActivity}
            isLoading={isLoading}
            debtType={currentDebt.type}
          />
        )}
      </div>
    </div>
  );
};

export default DebtActivities;