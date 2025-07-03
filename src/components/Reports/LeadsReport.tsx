import React from 'react';
import { Users, TrendingUp, Target, Globe } from 'lucide-react';

interface LeadsReportProps {
  dateRange: { startDate: string; endDate: string };
  filters: any;
}

export const LeadsReport: React.FC<LeadsReportProps> = ({ dateRange, filters }) => {
  const leadMetrics = [
    { title: 'Total Leads', value: '247', change: 15.3, color: 'blue' },
    { title: 'Qualified Leads', value: '89', change: 22.1, color: 'green' },
    { title: 'Conversion Rate', value: '36.2%', change: 3.1, color: 'purple' },
    { title: 'Avg. Response Time', value: '2.4h', change: -12.5, color: 'orange' }
  ];

  const sourceData = [
    { source: 'Website', count: 85, percentage: 34, color: 'bg-blue-500' },
    { source: 'Referral', count: 62, percentage: 25, color: 'bg-green-500' },
    { source: 'Social Media', count: 45, percentage: 18, color: 'bg-purple-500' },
    { source: 'Email', count: 35, percentage: 14, color: 'bg-orange-500' },
    { source: 'Manual', count: 20, percentage: 8, color: 'bg-gray-500' }
  ];

  const leadsByStage = [
    { stage: 'New', count: 98, percentage: 40 },
    { stage: 'Contacted', count: 74, percentage: 30 },
    { stage: 'Qualified', count: 49, percentage: 20 },
    { stage: 'Converted', count: 26, percentage: 10 }
  ];

  const topSources = [
    { source: 'Organic Search', leads: 45, quality: 85, cost: '$12' },
    { source: 'LinkedIn Ads', leads: 32, quality: 92, cost: '$28' },
    { source: 'Referrals', leads: 28, quality: 95, cost: '$0' },
    { source: 'Email Campaign', leads: 22, quality: 78, cost: '$8' }
  ];

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {leadMetrics.map((metric, index) => (
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
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lead Sources */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Sources</h3>
          <div className="space-y-4">
            {sourceData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.source}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">{item.count}</span>
                  <span className="text-sm font-medium text-gray-900">{item.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
          
          {/* Donut Chart Representation */}
          <div className="mt-6 flex justify-center">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e5e7eb" strokeWidth="10" />
                {sourceData.map((item, index) => {
                  const offset = sourceData.slice(0, index).reduce((sum, s) => sum + s.percentage, 0);
                  const circumference = 2 * Math.PI * 40;
                  const strokeDasharray = `${(item.percentage / 100) * circumference} ${circumference}`;
                  const strokeDashoffset = -((offset / 100) * circumference);
                  
                  return (
                    <circle
                      key={index}
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={item.color.replace('bg-', '').replace('-500', '')}
                      strokeWidth="10"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300"
                    />
                  );
                })}
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">247</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Lead Funnel */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Funnel</h3>
          <div className="space-y-4">
            {leadsByStage.map((stage, index) => (
              <div key={index} className="relative">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                  <span className="text-sm text-gray-600">{stage.count} leads</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stage.percentage}%` }}
                  ></div>
                </div>
                <div className="text-right mt-1">
                  <span className="text-xs text-gray-500">{stage.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Source Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Source</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Leads</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Quality Score</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Cost per Lead</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">ROI</th>
              </tr>
            </thead>
            <tbody>
              {topSources.map((source, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{source.source}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{source.leads}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            source.quality >= 90 ? 'bg-green-500' :
                            source.quality >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${source.quality}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{source.quality}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{source.cost}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      +{Math.floor(Math.random() * 50 + 150)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};