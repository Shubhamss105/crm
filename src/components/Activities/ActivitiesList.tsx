import React from 'react';
import { Activity } from '../../types';
import { Phone, Mail, Calendar, CheckSquare, FileText, Edit, Trash2, Check, Clock, AlertTriangle, User, Building2 } from 'lucide-react';

interface ActivitiesListProps {
  activities: Activity[];
  onEditActivity: (activity: Activity) => void;
  onDeleteActivity: (activityId: string) => void;
  onCompleteActivity: (activityId: string) => void;
}

export const ActivitiesList: React.FC<ActivitiesListProps> = ({ 
  activities, 
  onEditActivity, 
  onDeleteActivity,
  onCompleteActivity 
}) => {
  const getActivityIcon = (type: Activity['type']) => {
    const iconProps = { className: 'w-5 h-5' };
    switch (type) {
      case 'call': return <Phone {...iconProps} />;
      case 'email': return <Mail {...iconProps} />;
      case 'meeting': return <Calendar {...iconProps} />;
      case 'task': return <CheckSquare {...iconProps} />;
      case 'note': return <FileText {...iconProps} />;
      default: return <FileText {...iconProps} />;
    }
  };

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'call': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'email': return 'bg-green-100 text-green-600 border-green-200';
      case 'meeting': return 'bg-purple-100 text-purple-600 border-purple-200';
      case 'task': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'note': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusColor = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Activity['status']) => {
    switch (status) {
      case 'completed': return <Check className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getRelatedIcon = (type: string) => {
    switch (type) {
      case 'customer': return <Building2 className="w-4 h-4" />;
      case 'opportunity': return <CheckSquare className="w-4 h-4" />;
      case 'lead': return <User className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateShort = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Activity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Related To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Due Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {activities.map((activity) => (
              <tr key={activity.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">{activity.title}</div>
                      {activity.description && (
                        <div className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {activity.description}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mt-1 capitalize">
                        {activity.type}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="text-gray-400">
                      {getRelatedIcon(activity.relatedTo.type)}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {activity.relatedTo.name}
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
                        {activity.relatedTo.type}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="text-sm text-gray-900">{activity.assignedTo}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {activity.dueDate ? (
                    <div className="text-sm text-gray-900">
                      {formatDateShort(activity.dueDate)}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">No due date</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                    {getStatusIcon(activity.status)}
                    <span className="ml-1 capitalize">{activity.status}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDateShort(activity.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    {activity.status === 'pending' && (
                      <button
                        onClick={() => onCompleteActivity(activity.id)}
                        className="text-green-600 hover:text-green-900 p-1 hover:bg-green-50 rounded transition-colors"
                        title="Mark as completed"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onEditActivity(activity)}
                      className="text-blue-600 hover:text-blue-900 p-1 hover:bg-blue-50 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteActivity(activity.id)}
                      className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {activities.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <div className="text-gray-500 text-lg">No activities found</div>
          <div className="text-gray-400 text-sm mt-1">Create your first activity to get started</div>
        </div>
      )}
    </div>
  );
};