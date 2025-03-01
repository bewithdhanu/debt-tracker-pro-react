import React from 'react';
import { Activity } from '../types/activity';
import { Edit, Trash2, DollarSign, Calendar, FileText } from 'lucide-react';

interface ActivityListProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (activityId: string) => void;
  isLoading: boolean;
  debtType: 'I Owe' | 'Owe Me';
}

const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  onEdit,
  onDelete,
  isLoading,
  debtType
}) => {
  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
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

  // Get activity type color
  const getActivityTypeColor = (type: string) => {
    if (type === 'Interest') {
      return 'text-yellow-400';
    } else {
      return 'text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-4 text-center">
        <p className="text-gray-400 mb-2 text-sm">
          No activities recorded for this debt yet.
        </p>
        <p className="text-gray-500 text-xs">
          Add your first activity using the button above.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="bg-gray-800 rounded-lg p-3 hover:bg-gray-750 transition-colors"
        >
          <div className="flex justify-between items-start mb-1.5">
            <h3 className={`text-base font-medium ${getActivityTypeColor(activity.activity_type)}`}>
              {activity.activity_type}
              {activity.closing_debt && (
                <span className="ml-2 text-xs bg-green-900 text-green-300 px-2 py-0.5 rounded-full">
                  Closed Debt
                </span>
              )}
            </h3>
            <div className="flex space-x-1.5">
              <button
                onClick={() => onEdit(activity)}
                className="text-gray-400 hover:text-blue-400 transition-colors"
                aria-label={`Edit activity`}
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(activity.id)}
                className="text-gray-400 hover:text-red-400 transition-colors"
                aria-label={`Delete activity`}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-1.5 text-xs">
            {activity.activity_type === 'Interest' && (
              <>
                <div className="flex items-center text-gray-300">
                  <DollarSign size={14} className="mr-1.5 flex-shrink-0" />
                  <span>{formatCurrency(activity.amount)}</span>
                  {activity.months && (
                    <span className="ml-2 text-gray-400">
                      for {activity.months} month{activity.months > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                {activity.closing_debt && (
                  <div className="flex items-center text-green-400">
                    <DollarSign size={14} className="mr-1.5 flex-shrink-0" />
                    <span>Principal paid: {formatCurrency(activity.amount)}</span>
                  </div>
                )}
              </>
            )}
            
            <div className="flex items-center text-gray-400">
              <Calendar size={14} className="mr-1.5 flex-shrink-0" />
              <span>{formatDate(activity.activity_date)}</span>
            </div>
            
            {activity.notes && (
              <div className="flex items-start text-gray-400 mt-2">
                <FileText size={14} className="mr-1.5 mt-0.5 flex-shrink-0" />
                <span className="break-words">{activity.notes}</span>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ActivityList;