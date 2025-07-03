import React from 'react';
import { Calendar, Phone, Mail, Users, Clock } from 'lucide-react';

interface ActivityReportProps {
  dateRange: { startDate: string; endDate: string };
  filters: any;
}

export const ActivityReport: React.FC<ActivityReportProps> = ({ dateRange, filters }) => {
  const activityMetrics = [
    { title: 'Total Activities', value: '1,247', change: 18.2, icon: Calendar },
    { title: 'Calls Made', value: '342', change: 12.5, icon: Phone },
    { title: 'Emails Sent', value: '589', change: 25.3, icon: Mail },
    { title: 'Meetings Held', value: '156', change: 8.7, icon: Users }
  ];

  const activityByType = [
    { type: 'Calls', count: 342, percentage: 27, color: 'bg-blue-500' },
    { type: 'Emails', count: 589, percentage: 47, color: 'bg-green-500' },
    { type: 'Meetings', count: 156, percentage: 13, color: 'bg-purple-500' },
    { type: 'Tasks', count: 98, percentage: 8, color: 'bg-orange-500' },
    { type: 'Notes', count: 62, percentage: 5, color: 'bg-gray-500' }
  ];

  const teamActivity = [
    { name: 'Alice Johnson', calls: 89, emails: 156, meetings: 42, total: 287 },
    { name: 'Bob Smith', calls: 76, emails: 134, meetings: 38, total: 248 },
    { name: 'Carol Davis', calls: 82, emails: 142, meetings: 35, total: 259 },
    { name: 'David Wilson', calls: 95, emails: 157, meetings: 41, total: 293 }
  ];

  const activityTrend = [
    { day: 'Mon', activities: 45 },
    { day: 'Tue', activities: 52 },
    { day: 'Wed', activities: 48 },
    { day: 'Thu', activities: 61 },
    { day: 'Fri', activities: 58 },
    { day: 'Sat', activities: 23 },
    { day: 'Sun', activities: 18 }
  ];

  const maxActivities = Math.max(...activityTrend.map(d => d.activities));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {activityMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    <span className="text-sm font-medium text-green-600">
                      +{metric.change}%
                    </span>
                    <span className="text-gray-500 text-sm ml-1">vs last period</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Activity Breakdown */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Breakdown</h3>
          <div className="space-y-4">
            {activityByType.map((activity, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${activity.color}`}></div>
                  <span className="text-sm font-medium text-gray-700">{activity.type}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${activity.color}`}
                      style={{ width: `${activity.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">{activity.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Activity Trend */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Activity Trend</h3>
          <div className="h-48 flex items-end justify-between space-x-2">
            {activityTrend.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div
                  className="w-full bg-blue-600 rounded-t transition-all duration-300 hover:bg-blue-700"
                  style={{ height: `${(day.activities / maxActivities) * 100}%` }}
                ></div>
                <span className="text-xs text-gray-600 mt-2">{day.day}</span>
                <span className="text-xs text-gray-500">{day.activities}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Team Activity Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Activity Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Team Member</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Calls</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Emails</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Meetings</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Total Activities</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">Performance</th>
              </tr>
            </thead>
            <tbody>
              {teamActivity.map((member, index) => (
                <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-medium text-gray-900">{member.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      <span className="text-gray-700">{member.calls}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-green-600" />
                      <span className="text-gray-700">{member.emails}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-purple-600" />
                      <span className="text-gray-700">{member.meetings}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-semibold text-gray-900">{member.total}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${(member.total / 300) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">
                        {Math.round((member.total / 300) * 100)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Heatmap (Last 30 Days)</h3>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 30 }, (_, i) => {
            const intensity = Math.floor(Math.random() * 4);
            const intensityColors = [
              'bg-gray-100',
              'bg-blue-200',
              'bg-blue-400',
              'bg-blue-600'
            ];
            return (
              <div
                key={i}
                className={`w-8 h-8 rounded ${intensityColors[intensity]} flex items-center justify-center text-xs text-white font-medium`}
                title={`Day ${i + 1}: ${intensity * 15} activities`}
              >
                {intensity > 0 && intensity * 15}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between mt-4 text-sm text-gray-600">
          <span>Less</span>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-gray-100 rounded"></div>
            <div className="w-3 h-3 bg-blue-200 rounded"></div>
            <div className="w-3 h-3 bg-blue-400 rounded"></div>
            <div className="w-3 h-3 bg-blue-600 rounded"></div>
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
};