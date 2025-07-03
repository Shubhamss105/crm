import React from 'react';
import { Users, Target, TrendingUp, Award } from 'lucide-react';

interface TeamPerformanceReportProps {
  dateRange: { startDate: string; endDate: string };
  filters: any;
}

export const TeamPerformanceReport: React.FC<TeamPerformanceReportProps> = ({ dateRange, filters }) => {
  const teamMetrics = [
    { title: 'Team Members', value: '12', change: 0, icon: Users },
    { title: 'Avg Performance', value: '87%', change: 5.2, icon: Target },
    { title: 'Top Performer', value: 'Alice J.', change: 0, icon: Award },
    { title: 'Team Growth', value: '+15%', change: 15, icon: TrendingUp }
  ];

  const teamMembers = [
    {
      name: 'Alice Johnson',
      role: 'Senior Sales Rep',
      deals: 23,
      revenue: 485000,
      target: 450000,
      activities: 287,
      performance: 108
    },
    {
      name: 'Bob Smith',
      role: 'Sales Rep',
      deals: 18,
      revenue: 342000,
      target: 350000,
      activities: 248,
      performance: 98
    },
    {
      name: 'Carol Davis',
      role: 'Sales Rep',
      deals: 16,
      revenue: 298000,
      target: 300000,
      activities: 259,
      performance: 99
    },
    {
      name: 'David Wilson',
      role: 'Marketing Specialist',
      deals: 12,
      revenue: 156000,
      target: 200000,
      activities: 293,
      performance: 78
    }
  ];

  const teamComparison = [
    { team: 'Sales Team A', members: 4, revenue: 1280000, target: 1300000, performance: 98 },
    { team: 'Sales Team B', members: 3, revenue: 890000, target: 900000, performance: 99 },
    { team: 'Marketing Team', members: 5, revenue: 450000, target: 500000, performance: 90 }
  ];

  const monthlyProgress = [
    { month: 'Jan', teamA: 85, teamB: 78, marketing: 82 },
    { month: 'Feb', teamA: 88, teamB: 85, marketing: 79 },
    { month: 'Mar', teamA: 92, teamB: 89, marketing: 85 },
    { month: 'Apr', teamA: 95, teamB: 92, marketing: 88 },
    { month: 'May', teamA: 98, teamB: 99, marketing: 90 },
    { month: 'Jun', teamA: 102, teamB: 96, marketing: 92 }
  ];

  const getPerformanceColor = (performance: number) => {
    if (performance >= 100) return 'text-green-600 bg-green-100';
    if (performance >= 90) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {teamMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  {metric.change !== 0 && (
                    <div className="flex items-center mt-2">
                      <span className={`text-sm font-medium ${
                        metric.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {metric.change >= 0 ? '+' : ''}{metric.change}%
                      </span>
                      <span className="text-gray-500 text-sm ml-1">vs last period</span>
                    </div>
                  )}
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Individual Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Individual Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Team Member</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Deals Closed</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Revenue</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Target</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Activities</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">{member.name}</div>
                        <div className="text-sm text-gray-600">{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">{member.deals}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">
                      ${(member.revenue / 1000).toFixed(0)}K
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-700">
                      ${(member.target / 1000).toFixed(0)}K
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-gray-700">{member.activities}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor(member.performance)}`}>
                        {member.performance}%
                      </span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            member.performance >= 100 ? 'bg-green-500' :
                            member.performance >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(member.performance, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Comparison */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Comparison</h3>
          <div className="space-y-4">
            {teamComparison.map((team, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-medium text-gray-900">{team.team}</h4>
                    <p className="text-sm text-gray-600">{team.members} members</p>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      ${(team.revenue / 1000).toFixed(0)}K
                    </div>
                    <div className="text-sm text-gray-600">
                      of ${(team.target / 1000).toFixed(0)}K target
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        team.performance >= 100 ? 'bg-green-500' :
                        team.performance >= 90 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(team.performance, 100)}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {team.performance}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Progress</h3>
          <div className="h-64 flex items-end justify-between space-x-2">
            {monthlyProgress.map((month, index) => (
              <div key={index} className="flex-1 flex flex-col items-center space-y-1">
                <div className="w-full flex flex-col space-y-1">
                  <div
                    className="w-full bg-blue-500 rounded-t"
                    style={{ height: `${(month.teamA / 120) * 100}px` }}
                    title={`Team A: ${month.teamA}%`}
                  ></div>
                  <div
                    className="w-full bg-green-500"
                    style={{ height: `${(month.teamB / 120) * 100}px` }}
                    title={`Team B: ${month.teamB}%`}
                  ></div>
                  <div
                    className="w-full bg-purple-500"
                    style={{ height: `${(month.marketing / 120) * 100}px` }}
                    title={`Marketing: ${month.marketing}%`}
                  ></div>
                </div>
                <span className="text-xs text-gray-600 mt-2">{month.month}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center space-x-6 mt-4">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Team A</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Team B</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded"></div>
              <span className="text-sm text-gray-600">Marketing</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};