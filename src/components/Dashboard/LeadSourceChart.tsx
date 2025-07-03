import React from 'react';

export const LeadSourceChart: React.FC = () => {
  const sourceData = [
    { source: 'Website', count: 85, percentage: 34, color: 'bg-blue-500' },
    { source: 'Referral', count: 62, percentage: 25, color: 'bg-green-500' },
    { source: 'Social Media', count: 45, percentage: 18, color: 'bg-purple-500' },
    { source: 'Email', count: 35, percentage: 14, color: 'bg-orange-500' },
    { source: 'Manual', count: 20, percentage: 8, color: 'bg-gray-500' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Lead Sources</h3>
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
      
      {/* Simple donut chart representation */}
      <div className="mt-6 flex justify-center">
        <div className="relative w-32 h-32">
          <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="10"
            />
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
              <div className="text-xs text-gray-600">Total Leads</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};