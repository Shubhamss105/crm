import React from 'react';
import { DollarSign, TrendingUp, Calendar, Target } from 'lucide-react';

interface RevenueReportProps {
  dateRange: { startDate: string; endDate: string };
  filters: any;
}

export const RevenueReport: React.FC<RevenueReportProps> = ({ dateRange, filters }) => {
  const revenueMetrics = [
    { title: 'Total Revenue', value: '$892K', change: 12.5, icon: DollarSign },
    { title: 'Monthly Recurring', value: '$156K', change: 8.3, icon: Calendar },
    { title: 'Average Deal Size', value: '$38K', change: 5.1, icon: Target },
    { title: 'Growth Rate', value: '15.2%', change: 2.8, icon: TrendingUp }
  ];

  const monthlyRevenue = [
    { month: 'Jan', revenue: 65000, target: 70000 },
    { month: 'Feb', revenue: 78000, target: 75000 },
    { month: 'Mar', revenue: 82000, target: 80000 },
    { month: 'Apr', revenue: 95000, target: 85000 },
    { month: 'May', revenue: 88000, target: 90000 },
    { month: 'Jun', revenue: 92000, target: 95000 },
    { month: 'Jul', revenue: 105000, target: 100000 },
    { month: 'Aug', revenue: 98000, target: 105000 },
    { month: 'Sep', revenue: 112000, target: 110000 },
    { month: 'Oct', revenue: 125000, target: 115000 },
    { month: 'Nov', revenue: 118000, target: 120000 },
    { month: 'Dec', revenue: 135000, target: 125000 }
  ];

  const revenueBySource = [
    { source: 'New Customers', amount: 485000, percentage: 54, color: 'bg-blue-500' },
    { source: 'Existing Customers', amount: 287000, percentage: 32, color: 'bg-green-500' },
    { source: 'Upsells', amount: 89000, percentage: 10, color: 'bg-purple-500' },
    { source: 'Cross-sells', amount: 31000, percentage: 4, color: 'bg-orange-500' }
  ];

  const topDeals = [
    { customer: 'GlobalTech Industries', amount: 125000, stage: 'Closed Won', date: '2024-01-15' },
    { customer: 'Innovate Solutions', amount: 85000, stage: 'Closed Won', date: '2024-01-22' },
    { customer: 'TechCorp Enterprise', amount: 75000, stage: 'Closed Won', date: '2024-01-28' },
    { customer: 'StartupCo Growth', amount: 45000, stage: 'Closed Won', date: '2024-01-30' }
  ];

  const maxRevenue = Math.max(...monthlyRevenue.map(m => Math.max(m.revenue, m.target)));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {revenueMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-green-600 mr-1" />
                    <span className="text-sm font-medium text-green-600">
                      +{metric.change}%
                    </span>
                    <span className="text-gray-500 text-sm ml-1">vs last period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Revenue Trend */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Target</h3>
        <div className="h-80 flex items-end justify-between space-x-1">
          {monthlyRevenue.map((month, index) => (
            <div key={index} className="flex-1 flex flex-col items-center space-y-1">
              <div className="w-full flex space-x-1">
                <div className="flex-1 flex flex-col items-end space-y-1">
                  <div
                    className="w-full bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-700"
                    style={{ height: `${(month.revenue / maxRevenue) * 250}px` }}
                    title={`Revenue: $${(month.revenue / 1000).toFixed(0)}K`}
                  ></div>
                  <div
                    className="w-full bg-gray-300 rounded-t"
                    style={{ height: `${(month.target / maxRevenue) * 250}px` }}
                    title={`Target: $${(month.target / 1000).toFixed(0)}K`}
                  ></div>
                </div>
              </div>
              <span className="text-xs text-gray-600 mt-2">{month.month}</span>
              <div className="text-center">
                <div className="text-xs font-medium text-gray-900">
                  ${(month.revenue / 1000).toFixed(0)}K
                </div>
                <div className="text-xs text-gray-500">
                  ${(month.target / 1000).toFixed(0)}K
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center space-x-6 mt-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
            <span className="text-sm text-gray-600">Actual Revenue</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gray-300 rounded"></div>
            <span className="text-sm text-gray-600">Target</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Source */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue by Source</h3>
          <div className="space-y-4">
            {revenueBySource.map((source, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{source.source}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${source.color}`}
                      style={{ width: `${source.percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      ${(source.amount / 1000).toFixed(0)}K
                    </div>
                    <div className="text-xs text-gray-500">{source.percentage}%</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Deals */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Deals This Period</h3>
          <div className="space-y-4">
            {topDeals.map((deal, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900">{deal.customer}</div>
                  <div className="text-sm text-gray-600">{deal.stage}</div>
                  <div className="text-xs text-gray-500">{new Date(deal.date).toLocaleDateString()}</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">
                    ${(deal.amount / 1000).toFixed(0)}K
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Revenue Forecast */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecast</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">$1.2M</div>
            <div className="text-sm text-blue-700">Next Quarter</div>
            <div className="text-xs text-blue-600 mt-1">+18% confidence</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">$4.8M</div>
            <div className="text-sm text-green-700">Next Year</div>
            <div className="text-xs text-green-600 mt-1">+22% growth</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">$450K</div>
            <div className="text-sm text-purple-700">Pipeline Value</div>
            <div className="text-xs text-purple-600 mt-1">High probability</div>
          </div>
        </div>
      </div>
    </div>
  );
};