import React, { useState } from 'react';
import { ActivitiesList } from './ActivitiesList';
import { ActivityForm } from './ActivityForm';
import { ActivityFilters } from './ActivityFilters';
import { ImportModal } from '../Common/ImportModal';
import { ExportModal } from '../Common/ExportModal';
import { AdvancedFilters } from '../Common/AdvancedFilters';
import { mockActivities } from '../../data/mockData';
import { Activity } from '../../types';
import { Plus, Upload, Download, Filter, Calendar, CheckSquare } from 'lucide-react';

const activityFilterConfigs = [
  { key: 'search', label: 'Search', type: 'text' as const, placeholder: 'Search activities...' },
  { key: 'type', label: 'Type', type: 'select' as const, options: [
    { value: 'call', label: 'Call' },
    { value: 'email', label: 'Email' },
    { value: 'meeting', label: 'Meeting' },
    { value: 'task', label: 'Task' },
    { value: 'note', label: 'Note' }
  ]},
  { key: 'status', label: 'Status', type: 'select' as const, options: [
    { value: 'pending', label: 'Pending' },
    { value: 'completed', label: 'Completed' },
    { value: 'overdue', label: 'Overdue' }
  ]},
  { key: 'assignedTo', label: 'Assigned To', type: 'select' as const, options: [
    { value: 'Alice Johnson', label: 'Alice Johnson' },
    { value: 'Bob Smith', label: 'Bob Smith' },
    { value: 'Carol Davis', label: 'Carol Davis' },
    { value: 'David Wilson', label: 'David Wilson' }
  ]},
  { key: 'relatedType', label: 'Related To', type: 'select' as const, options: [
    { value: 'lead', label: 'Lead' },
    { value: 'opportunity', label: 'Opportunity' },
    { value: 'customer', label: 'Customer' }
  ]},
  { key: 'dueDateAfter', label: 'Due After', type: 'date' as const },
  { key: 'dueDateBefore', label: 'Due Before', type: 'date' as const },
  { key: 'createdAfter', label: 'Created After', type: 'date' as const },
  { key: 'createdBefore', label: 'Created Before', type: 'date' as const }
];

const sampleActivityData = {
  type: 'call',
  title: 'Follow-up call',
  description: 'Discuss project requirements',
  assignedTo: 'Alice Johnson',
  relatedType: 'lead',
  relatedName: 'John Doe',
  dueDate: '2024-02-15',
  status: 'pending'
};

export const ActivitiesPage: React.FC = () => {
  const [activities, setActivities] = useState<Activity[]>(mockActivities);
  const [showForm, setShowForm] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    assignedTo: '',
    relatedType: '',
    dueDateAfter: '',
    dueDateBefore: '',
    createdAfter: '',
    createdBefore: ''
  });

  const handleCreateActivity = (activityData: Partial<Activity>) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: activityData.type || 'task',
      title: activityData.title || '',
      description: activityData.description,
      relatedTo: activityData.relatedTo || { type: 'lead', id: '1', name: 'Unknown' },
      assignedTo: activityData.assignedTo || '',
      dueDate: activityData.dueDate,
      completedAt: activityData.completedAt,
      status: activityData.status || 'pending',
      createdAt: new Date()
    };
    setActivities([newActivity, ...activities]);
    setShowForm(false);
  };

  const handleUpdateActivity = (activityData: Partial<Activity>) => {
    if (selectedActivity) {
      setActivities(activities.map(activity => 
        activity.id === selectedActivity.id 
          ? { ...activity, ...activityData }
          : activity
      ));
      setSelectedActivity(null);
      setShowForm(false);
    }
  };

  const handleDeleteActivity = (activityId: string) => {
    setActivities(activities.filter(activity => activity.id !== activityId));
  };

  const handleCompleteActivity = (activityId: string) => {
    setActivities(activities.map(activity => 
      activity.id === activityId 
        ? { ...activity, status: 'completed', completedAt: new Date() }
        : activity
    ));
  };

  const handleImport = (importedData: any[]) => {
    const newActivities: Activity[] = importedData.map((data, index) => ({
      id: `imported-${Date.now()}-${index}`,
      type: data.type || 'task',
      title: data.title || '',
      description: data.description,
      relatedTo: {
        type: data.relatedType || 'lead',
        id: `${index}`,
        name: data.relatedName || 'Unknown'
      },
      assignedTo: data.assignedTo || '',
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
      completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      status: data.status || 'pending',
      createdAt: new Date()
    }));
    setActivities([...newActivities, ...activities]);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = !filters.search || 
      activity.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      activity.description?.toLowerCase().includes(filters.search.toLowerCase()) ||
      activity.relatedTo.name.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesType = !filters.type || activity.type === filters.type;
    const matchesStatus = !filters.status || activity.status === filters.status;
    const matchesAssignedTo = !filters.assignedTo || activity.assignedTo === filters.assignedTo;
    const matchesRelatedType = !filters.relatedType || activity.relatedTo.type === filters.relatedType;
    
    const matchesDueDateAfter = !filters.dueDateAfter || !activity.dueDate || 
      new Date(activity.dueDate) >= new Date(filters.dueDateAfter);
    const matchesDueDateBefore = !filters.dueDateBefore || !activity.dueDate || 
      new Date(activity.dueDate) <= new Date(filters.dueDateBefore);
    
    const matchesCreatedAfter = !filters.createdAfter || 
      new Date(activity.createdAt) >= new Date(filters.createdAfter);
    const matchesCreatedBefore = !filters.createdBefore || 
      new Date(activity.createdAt) <= new Date(filters.createdBefore);

    return matchesSearch && matchesType && matchesStatus && matchesAssignedTo && 
           matchesRelatedType && matchesDueDateAfter && matchesDueDateBefore && 
           matchesCreatedAfter && matchesCreatedBefore;
  });

  // Pagination logic
  const totalItems = filteredActivities.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedActivities = filteredActivities.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const getActivityStats = () => {
    const pending = filteredActivities.filter(a => a.status === 'pending').length;
    const completed = filteredActivities.filter(a => a.status === 'completed').length;
    const overdue = filteredActivities.filter(a => a.status === 'overdue').length;
    
    return { pending, completed, overdue };
  };

  const stats = getActivityStats();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Activities</h1>
          <p className="text-gray-600 mt-2">Manage tasks, calls, meetings, and follow-ups</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowAdvancedFilters(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Advanced Filters</span>
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={() => {
              setSelectedActivity(null);
              setShowForm(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Activity</span>
          </button>
        </div>
      </div>

      {/* Activity Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Total Activities</div>
              <div className="text-2xl font-bold text-gray-900">{totalItems}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckSquare className="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Pending</div>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckSquare className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Completed</div>
              <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <CheckSquare className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <div className="text-sm text-gray-600">Overdue</div>
              <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            </div>
          </div>
        </div>
      </div>

      <ActivityFilters filters={filters} onFiltersChange={setFilters} />

      <div className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems} activities
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        
        <ActivitiesList
          activities={paginatedActivities}
          onEditActivity={(activity) => {
            setSelectedActivity(activity);
            setShowForm(true);
          }}
          onDeleteActivity={handleDeleteActivity}
          onCompleteActivity={handleCompleteActivity}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              
              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-1 text-sm rounded ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <ActivityForm
          activity={selectedActivity}
          onSubmit={selectedActivity ? handleUpdateActivity : handleCreateActivity}
          onCancel={() => {
            setShowForm(false);
            setSelectedActivity(null);
          }}
        />
      )}

      <ImportModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
        onImport={handleImport}
        entityType="activities"
        sampleData={sampleActivityData}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={filteredActivities}
        entityType="activities"
      />

      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
        filterConfigs={activityFilterConfigs}
        onApply={() => {}}
        onReset={() => setFilters({
          search: '',
          type: '',
          status: '',
          assignedTo: '',
          relatedType: '',
          dueDateAfter: '',
          dueDateBefore: '',
          createdAfter: '',
          createdBefore: ''
        })}
      />
    </div>
  );
};