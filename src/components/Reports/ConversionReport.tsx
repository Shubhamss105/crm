import React from 'react';
import { Target, TrendingUp, Users, Percent } from 'lucide-react';

interface ConversionReportProps {
  dateRange: { startDate: string; endDate: string };
  filters: any;
}

export const ConversionReport: React.FC<ConversionReportProps> = ({ dateRange, filters }) => {
  const conversionMetrics = [
    { title: 'Overall Conversion', value: '36.2%', change: 3.1, icon: Target },
    { title: 'Lead to Opportunity', value: '42.8%', change: 5.2, icon: TrendingUp },
    { title: 'Opportunity to Customer', value: '68.5%', change: 2.8, icon: Users },
    { title: 'Average Time to Convert', value: '18 days', change: -8.5, icon: Percent }
  ];

  const conversionFunnel = [
    { stage: 'Leads', count: 1247, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Qualified', count: 534, percentage: 43, color: 'bg-indigo-500' },
    { stage: 'Opportunities', count: 289, percentage: 23, color: 'bg-purple-500' },
    { stage: 'Proposals', count: 156, percentage: 13, color: 'bg-pink-500' },
    { stage: 'Customers', count: 89, percentage: 7, color: 'bg-green-500' }
  ];

  const conversionBySource = [
    { source: 'Website', leads: 425, conversions: 89, rate: 20.9 },
    { source: 'Referrals', leads: 298, conversions: 78, rate: 26.2 },
    { source: 'Social Media', leads: 234, conversions: 45, rate: 19.2 },
    { source: 'Email Campaign', leads: 189, conversions: 52, rate: 27.5 },
    { source: 'Cold Outreach', leads: 101, conversions: 18, rate: 17.8 }
  ];

  const monthlyConversion = [
    { month: 'Jan', rate: 32.5 },
    { month: 'Feb', rate: 34.2 },
    { month: 'Mar', rate: 31.8 },
    { month: 'Apr', rate: 35.6 },
    { month: 'May', rate: 38.2 },
    { month: 'Jun', rate: 36.2 }
  ];

  const conversionStages = [
    { from: 'Lead', to: 'Qualified', rate: 42.8, count: 534 },
    { from: 'Qualified', to: 'Opportunity', rate: 54.1, count: 289 },
    { from: 'Opportunity', to: 'Proposal', rate: 54.0, count: 156 },
    { from: 'Proposal', to: 'Customer', rate: 57.1, count: 89 }
  ];

  const maxRate = Math.max(...monthlyConversion.map(m => m.rate));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {conversionMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className={`w-4 h-4 mr-1 ${
                      metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                    <span className={`text-sm font-medium ${
                      metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.change >= 0 ? '+' : ''}{metric.change}%
                    </span>
                    <span className="text-gray-500 text-sm ml-1">vs last period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Conversion Funnel */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion Funnel</h3>
        <div className="space-y-4">
          {conversionFunnel.map((stage, index) => (
            <div key={index} className="relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                <div className="text-right">
                  <span className="text-sm font-medium text-gray-900">{stage.count.toLocaleString()}</span>
                  <span className="text-xs text-gray-500 ml-2">({stage.percentage}%)</span>
                </div>
              </div>
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-8">
                  <div
                    className={`h-8 rounded-full ${stage.color} transition-all duration-500 flex items-center justify-center`}
                    style={{ width: `${stage.percentage}%` }}
                  >
                    <span className="text-white text-sm font-medium">
                      {stage.count.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
              {index < conversionFunnel.length - 1 && (
                <div className="flex justify-center mt-2">
                  <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {((conversionFunnel[index + 1].count / stage.count) * 100).toFixed(1)}% conversion
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion by Source */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Conversion by Source</h3>
          <div className="space-y-4">
            {conversionBySource.map((source, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{source.source}</span>
                  <span className="text-sm font-medium text-purple-600">{source.rate}%</span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>{source.leads} leads</span>
                  <span>{source.conversions} conversions</span>
                </div>
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(source.rate / 30) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Conversion Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Conversion Trend</h3>
          <div className="h-48 flex items-end justify-between space-x-2">
            {monthlyConversion.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-purple-600 rounded-t transition-all duration-300 hover:bg-purple-700"
                  style={{ height: `${(month.rate / maxRate) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">{month.month}</span>
                <span className="text-xs text-gray-500">{month.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stage-by-Stage Conversion */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stage-by-Stage Conversion</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {conversionStages.map((stage, index) => (
            <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 mb-2">
                {stage.from} → {stage.to}
              </div>
              <div className="text-2xl font-bold text-purple-600 mb-1">
                {stage.rate}%
              </div>
              <div className="text-xs text-gray-500">
                {stage.count} conversions
              </div>
              <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full"
                  style={{ width: `${stage.rate}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Conversion Insights */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center mb-2">
              <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-medium text-green-800">Best Performing</span>
            </div>
            <div className="text-sm text-green-700">
              Email campaigns have the highest conversion rate at 27.5%
            </div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Target className="w-5 h-5 text-yellow-600 mr-2" />
              <span className="font-medium text-yellow-800">Opportunity</span>
            </div>
            <div className="text-sm text-yellow-700">
              Cold outreach has potential for improvement at 17.8%
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center mb-2">
              <Users className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">Volume Leader</span>
            </div>
            <div className="text-sm text-blue-700">
              Website generates the most leads with 425 this period
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};