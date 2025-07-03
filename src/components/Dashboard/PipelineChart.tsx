import React from 'react';

export const PipelineChart: React.FC = () => {
  const pipelineData = [
    { stage: 'Prospecting', count: 15, value: 180000, color: 'bg-blue-500' },
    { stage: 'Qualification', count: 8, value: 145000, color: 'bg-indigo-500' },
    { stage: 'Proposal', count: 5, value: 210000, color: 'bg-purple-500' },
    { stage: 'Negotiation', count: 3, value: 95000, color: 'bg-pink-500' },
    { stage: 'Closed Won', count: 2, value: 85000, color: 'bg-green-500' },
  ];

  const maxValue = Math.max(...pipelineData.map(item => item.value));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Sales Pipeline</h3>
      <div className="space-y-4">
        {pipelineData.map((item, index) => (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-24 text-sm font-medium text-gray-700">{item.stage}</div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600">{item.count} opportunities</span>
                <span className="text-sm font-medium text-gray-900">
                  ${(item.value / 1000).toFixed(0)}K
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${item.color}`}
                  style={{ width: `${(item.value / maxValue) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};