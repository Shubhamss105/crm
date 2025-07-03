import React from 'react';
import { MetricCard } from './MetricCard';
import { ActivityFeed } from './ActivityFeed';
import { PipelineChart } from './PipelineChart';
import { LeadSourceChart } from './LeadSourceChart';
import { mockDashboardMetrics, mockActivities } from '../../data/mockData';
import { Users, Target, DollarSign, TrendingUp } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const metrics = mockDashboardMetrics;
  const recentActivities = mockActivities.slice(0, 5);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with your sales.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Total Leads"
          value={metrics.totalLeads}
          change={8.2}
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Opportunities"
          value={metrics.totalOpportunities}
          change={12.5}
          icon={Target}
          color="purple"
        />
        <MetricCard
          title="Revenue"
          value={`$${(metrics.totalRevenue / 1000).toFixed(0)}K`}
          change={metrics.monthlyGrowth}
          icon={DollarSign}
          color="green"
        />
        <MetricCard
          title="Conversion Rate"
          value={`${metrics.conversionRate}%`}
          change={3.1}
          icon={TrendingUp}
          color="orange"
        />
      </div>

      {/* Charts and Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <PipelineChart />
        </div>
        <div>
          <LeadSourceChart />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActivityFeed activities={recentActivities} />
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Opportunities</h3>
          <div className="space-y-4">
            {[
              { name: 'TechCorp Enterprise Deal', value: '$125,000', probability: 75, stage: 'Proposal' },
              { name: 'Innovate Solutions Custom', value: '$85,000', probability: 40, stage: 'Qualification' },
              { name: 'StartupCo Initial Package', value: '$15,000', probability: 60, stage: 'Negotiation' },
            ].map((opp, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{opp.name}</p>
                  <p className="text-sm text-gray-600">{opp.stage} • {opp.probability}% probability</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{opp.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};