import React from 'react';
import { Activity } from '../types/activity';
import { formatDate } from '../utils/date';
import { Edit, Trash2, FileText, TrendingUp } from 'lucide-react';
import { useCurrency } from '../hooks/useCurrency';

interface ActivityListProps {
  activities: Activity[];
  onEdit?: (activity: Activity) => void;
  onDelete?: (activityId: string) => void;
  isLoading: boolean;
  debtType: 'I Owe' | 'Owe Me';
}

const ActivityList: React.FC<ActivityListProps> = ({ activities, onEdit, onDelete, isLoading, debtType }) => {
  const { formatCurrency } = useCurrency();

  const getActivityTypeColor = (type: Activity['activity_type']) => {
    switch (type) {
      case 'Interest':
        return 'text-blue-400';
      case 'Note':
        return 'text-gray-400';
      default:
        return 'text-white';
    }
  };

  const getActivityIcon = (type: Activity['activity_type']) => {
    switch (type) {
      case 'Interest':
        return <TrendingUp size={16} className="text-blue-400" />;
      case 'Note':
        return <FileText size={16} className="text-gray-400" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((n) => (
          <div key={n} className="bg-gray-800 rounded-lg p-4">
            <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
            <div className="h-3 bg-gray-700 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!activities.length) {
    return (
      <div className="text-center py-6 text-gray-400">
        No activities yet
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className="bg-gray-800 rounded-lg p-4 space-y-2"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {getActivityIcon(activity.activity_type)}
              <h3 className={`text-base font-medium ${getActivityTypeColor(activity.activity_type)}`}>
                {activity.activity_type}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {onEdit && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(activity);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <Edit size={14} />
                </button>
              )}
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(activity.id);
                  }}
                  className="text-gray-400 hover:text-red-400 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="text-sm text-gray-400">
            {formatDate(activity.activity_date)}
          </div>

          {activity.activity_type === 'Interest' && (
            <div className="text-sm">
              <span className="text-gray-400">Amount:</span>{' '}
              <span className={debtType === 'I Owe' ? 'text-red-400' : 'text-green-400'}>
                {formatCurrency(activity.amount)}
              </span>
              {activity.months && (
                <>
                  <span className="text-gray-400 ml-2">Period:</span>{' '}
                  <span className="text-white">{activity.months} month{activity.months !== 1 ? 's' : ''}</span>
                </>
              )}
              {activity.closing_debt && (
                <span className="ml-2 text-green-400">(Final Payment)</span>
              )}
            </div>
          )}

          {activity.notes && (
            <div className="text-sm text-gray-300">
              {activity.notes}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default ActivityList;