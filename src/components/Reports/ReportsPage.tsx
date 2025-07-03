import React, { useState } from 'react';
import { SalesReport } from './SalesReport';
import { LeadsReport } from './LeadsReport';
import { ActivityReport } from './ActivityReport';
import { TeamPerformanceReport } from './TeamPerformanceReport';
import { RevenueReport } from './RevenueReport';
import { ConversionReport } from './ConversionReport';
import { CustomReport } from './CustomReport';
import { ReportFilters } from './ReportFilters';
import { ExportModal } from '../Common/ExportModal';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Target,
  FileText,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

const reportTabs = [
  { id: 'sales', label: 'Sales Overview', icon: BarChart3 },
  { id: 'leads', label: 'Leads Analysis', icon: Users },
  { id: 'activities', label: 'Activities', icon: Calendar },
  { id: 'team', label: 'Team Performance', icon: Target },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'conversion', label: 'Conversion', icon: TrendingUp },
  { id: 'custom', label: 'Custom Reports', icon: FileText }
];

export const ReportsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [showFilters, setShowFilters] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [filters, setFilters] = useState({
    team: '',
    assignedTo: '',
    source: '',
    stage: ''
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate data refresh
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  const renderTabContent = () => {
    const commonProps = { dateRange, filters };
    
    switch (activeTab) {
      case 'sales':
        return <SalesReport {...commonProps} />;
      case 'leads':
        return <LeadsReport {...commonProps} />;
      case 'activities':
        return <ActivityReport {...commonProps} />;
      case 'team':
        return <TeamPerformanceReport {...commonProps} />;
      case 'revenue':
        return <RevenueReport {...commonProps} />;
      case 'conversion':
        return <ConversionReport {...commonProps} />;
      case 'custom':
        return <CustomReport {...commonProps} />;
      default:
        return <SalesReport {...commonProps} />;
    }
  };

  const getExportData = () => {
    // Return data based on active tab
    switch (activeTab) {
      case 'sales':
        return [
          { metric: 'Total Revenue', value: '$892,000', change: '+12.5%' },
          { metric: 'Opportunities Won', value: '23', change: '+8.2%' },
          { metric: 'Average Deal Size', value: '$38,000', change: '+5.1%' }
        ];
      case 'leads':
        return [
          { metric: 'Total Leads', value: '247', change: '+15.3%' },
          { metric: 'Qualified Leads', value: '89', change: '+22.1%' },
          { metric: 'Conversion Rate', value: '36.2%', change: '+3.1%' }
        ];
      default:
        return [];
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights into your sales performance</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </button>
          <button
            onClick={() => setShowExport(true)}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Date Range</h3>
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2 mt-6">
              <button
                onClick={() => {
                  const today = new Date();
                  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  setDateRange({
                    startDate: lastMonth.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  });
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Last Month
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastQuarter = new Date(today.getFullYear(), today.getMonth() - 3, 1);
                  setDateRange({
                    startDate: lastQuarter.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  });
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Last Quarter
              </button>
              <button
                onClick={() => {
                  const today = new Date();
                  const lastYear = new Date(today.getFullYear() - 1, 0, 1);
                  setDateRange({
                    startDate: lastYear.toISOString().split('T')[0],
                    endDate: today.toISOString().split('T')[0]
                  });
                }}
                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
              >
                Last Year
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {reportTabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </div>

      {/* Modals */}
      <ReportFilters
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <ExportModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        data={getExportData()}
        entityType={`${activeTab}-report`}
        filename={`${activeTab}-report-${new Date().toISOString().split('T')[0]}`}
      />
    </div>
  );
};