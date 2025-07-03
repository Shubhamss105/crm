import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Calendar } from 'lucide-react';

interface SalesReportProps {
  dateRange: { startDate: string; endDate: string };
  filters: any;
}

export const SalesReport: React.FC<SalesReportProps> = ({ dateRange, filters }) => {
  const salesMetrics = [
    {
      title: 'Total Revenue',
      value: '$892,000',
      change: 12.5,
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Opportunities Won',
      value: '23',
      change: 8.2,
      icon: Target,
      color: 'blue'
    },
    {
      title: 'Average Deal Size',
      value: '$38,000',
      change: 5.1,
      icon: TrendingUp,
      color: 'purple'
    },
    {
      title: 'Sales Cycle (Days)',
      value: '45',
      change: -3.2,
      icon: Calendar,
      color: 'orange'
    }
  ];

  const pipelineData = [
    { stage: 'Prospecting', count: 15, value: 180000, percentage: 25 },
    { stage: 'Qualification', count: 8, value: 145000, percentage: 20 },
    { stage: 'Proposal', count: 5, value: 210000, percentage: 30 },
    { stage: 'Negotiation', count: 3, value: 95000, percentage: 15 },
    { stage: 'Closed Won', count: 2, value: 85000, percentage: 10 }
  ];

  const topPerformers = [
    { name: 'Alice Johnson', deals: 8, revenue: 320000, target: 300000 },
    { name: 'Bob Smith', deals: 6, revenue: 245000, target: 250000 },
    { name: 'Carol Davis', deals: 5, revenue: 189000, target: 200000 },
    { name: 'David Wilson', deals: 4, revenue: 138000, target: 150000 }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      green: 'bg-green-50 text-green-600 border-green-200',
      blue: 'bg-blue-50 text-blue-600 border-blue-200',
      purple: 'bg-purple-50 text-purple-600 border-purple-200',
      orange: 'bg-orange-50 text-orange-600 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {salesMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    {metric.change >= 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-600 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${
                      metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change >= 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span className="text-gray-500 text-sm ml-1">vs last period</span>
                  </div>
                </div>
                <div className={`w-12 h-12 rounded-lg border flex items-center justify-center ${getColorClasses(metric.color)}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Analysis */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Pipeline</h3>
          <div className="space-y-4">
            {pipelineData.map((stage, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                    <span className="text-sm text-gray-600">{stage.count} deals</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    ></div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">${(stage.value / 1000).toFixed(0)}K</span>
                    <span className="text-xs text-gray-500">{stage.percentage}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Performers */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-4">
            {topPerformers.map((performer, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">{performer.name}</div>
                    <div className="text-sm text-gray-600">{performer.deals} deals closed</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">
                    ${(performer.revenue / 1000).toFixed(0)}K
                  </div>
                  <div className="text-sm text-gray-600">
                    {((performer.revenue / performer.target) * 100).toFixed(0)}% of target
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Trend Chart */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <div className="h-64 flex items-end justify-between space-x-2">
          {[65, 78, 82, 95, 88, 92, 105, 98, 112, 125, 118, 135].map((value, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-700"
                style={{ height: `${(value / 135) * 100}%` }}
              ></div>
              <span className="text-xs text-gray-600 mt-2">
                {new Date(2024, index, 1).toLocaleDateString('en-US', { month: 'short' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};