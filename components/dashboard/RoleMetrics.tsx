'use client';

import React from 'react';
import { UserRole } from '@prisma/client';

interface BaseMetric {
  label: string;
  value: number | string;
  target?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  description: string;
}

interface RoleMetricsProps {
  role: UserRole;
  metrics: Record<string, any>;
  period?: string;
}

const METRIC_DEFINITIONS = {
  REQUESTOR: [
    { key: 'ecrsCreated', label: 'ECRs Created', unit: '', description: 'Total ECRs submitted this period' },
    { key: 'approvalRate', label: 'Approval Rate', unit: '%', target: 80, description: 'Percentage of ECRs approved' },
    { key: 'avgResponseTime', label: 'Avg Response Time', unit: 'days', target: 3, description: 'Average time from submission to first response' },
    { key: 'implementedChanges', label: 'Implemented', unit: '', description: 'ECRs successfully implemented' },
    { key: 'costSavings', label: 'Cost Savings', unit: '$', description: 'Estimated cost savings from approved ECRs' }
  ],
  ENGINEER: [
    { key: 'ecrsProcessed', label: 'ECRs Processed', unit: '', description: 'ECRs reviewed and processed' },
    { key: 'ecoCompletionRate', label: 'ECO Completion', unit: '%', target: 90, description: 'Percentage of ECOs completed on time' },
    { key: 'avgProcessingTime', label: 'Avg Processing Time', unit: 'days', target: 5, description: 'Average time to process ECR' },
    { key: 'technicalComplexity', label: 'Avg Complexity', unit: '/5', description: 'Average technical complexity rating' },
    { key: 'overdueTasks', label: 'Overdue Tasks', unit: '', description: 'Number of overdue tasks assigned' }
  ],
  QUALITY: [
    { key: 'verificationsCompleted', label: 'Verifications', unit: '', description: 'ECO verifications completed' },
    { key: 'firstPassRate', label: 'First Pass Rate', unit: '%', target: 95, description: 'Percentage passing verification first time' },
    { key: 'avgTurnaroundTime', label: 'Turnaround Time', unit: 'days', target: 2, description: 'Average verification turnaround time' },
    { key: 'nonConformances', label: 'Non-conformances', unit: '', description: 'Quality issues identified' },
    { key: 'qualityGatesSets', label: 'Quality Gates', unit: '', description: 'Quality gates established this period' }
  ],
  MANUFACTURING: [
    { key: 'implementationsCompleted', label: 'Implementations', unit: '', description: 'ECOs successfully implemented' },
    { key: 'successRate', label: 'Success Rate', unit: '%', target: 98, description: 'Implementation success rate' },
    { key: 'avgImplementationTime', label: 'Implementation Time', unit: 'days', target: 7, description: 'Average time to implement changes' },
    { key: 'productionImpact', label: 'Production Impact', unit: 'hrs', description: 'Total production downtime from changes' },
    { key: 'costsAvoided', label: 'Costs Avoided', unit: '$', description: 'Production costs avoided through changes' }
  ],
  MANAGER: [
    { key: 'approvalsCompleted', label: 'Approvals', unit: '', description: 'Change requests approved/rejected' },
    { key: 'avgApprovalTime', label: 'Approval Time', unit: 'days', target: 2, description: 'Average time to approve requests' },
    { key: 'budgetUtilization', label: 'Budget Used', unit: '%', target: 85, description: 'Change budget utilization' },
    { key: 'teamWorkload', label: 'Team Workload', unit: '%', description: 'Team capacity utilization' },
    { key: 'priorityDistribution', label: 'High Priority Items', unit: '', description: 'High/critical priority items managed' }
  ],
  DOCUMENT_CONTROL: [
    { key: 'ecnsDistributed', label: 'ECNs Distributed', unit: '', description: 'Change notices distributed' },
    { key: 'acknowledgmentRate', label: 'Acknowledgment Rate', unit: '%', target: 100, description: 'Percentage of recipients who acknowledged' },
    { key: 'avgDistributionTime', label: 'Distribution Time', unit: 'hours', target: 24, description: 'Time to distribute ECN after creation' },
    { key: 'overdueResponses', label: 'Overdue Responses', unit: '', description: 'Recipients with overdue acknowledgments' },
    { key: 'documentsUpdated', label: 'Documents Updated', unit: '', description: 'Documents updated this period' }
  ],
  ADMIN: [
    { key: 'systemUptime', label: 'System Uptime', unit: '%', target: 99.5, description: 'Platform availability' },
    { key: 'totalUsers', label: 'Active Users', unit: '', description: 'Users active this period' },
    { key: 'totalChanges', label: 'Total Changes', unit: '', description: 'All changes processed' },
    { key: 'avgCycleTime', label: 'Avg Cycle Time', unit: 'days', target: 15, description: 'Average ECR to ECN cycle time' },
    { key: 'complianceRate', label: 'Compliance Rate', unit: '%', target: 100, description: 'Process compliance rate' }
  ],
  VIEWER: [
    { key: 'accessRequests', label: 'Access Requests', unit: '', description: 'Information access requests made' },
    { key: 'reportsViewed', label: 'Reports Viewed', unit: '', description: 'Reports and dashboards accessed' },
    { key: 'notificationsReceived', label: 'Notifications', unit: '', description: 'Change notifications received' },
    { key: 'feedbackProvided', label: 'Feedback Items', unit: '', description: 'Feedback or comments provided' }
  ]
};

function MetricCard({ metric, value, target, unit, trend, trendValue, description }: {
  metric: { key: string; label: string; unit?: string; target?: number; description: string };
  value: number | string;
  target?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  description: string;
}) {
  const numericValue = typeof value === 'string' ? parseFloat(value) || 0 : value;
  const isOnTarget = target ? numericValue >= target : true;
  
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return (
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'down':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        );
      case 'stable':
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return null;
    }
  };

  const formatValue = (val: number | string) => {
    if (typeof val === 'string') return val;
    if (unit === '%') return `${val.toFixed(1)}%`;
    if (unit === '$') return `$${val.toLocaleString()}`;
    if (unit === 'days' || unit === 'hours') return `${val.toFixed(1)} ${unit}`;
    return val.toLocaleString();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-600">{metric.label}</h4>
        {trend && getTrendIcon()}
      </div>
      
      <div className="flex items-baseline space-x-2">
        <span className={`text-2xl font-bold ${
          target ? (isOnTarget ? 'text-green-600' : 'text-red-600') : 'text-gray-900'
        }`}>
          {formatValue(value)}
        </span>
        
        {target && (
          <span className="text-sm text-gray-500">
            / {formatValue(target)} target
          </span>
        )}
      </div>
      
      {trendValue !== undefined && (
        <div className="flex items-center mt-1">
          <span className={`text-xs ${
            trend === 'up' ? 'text-green-600' : 
            trend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {trend === 'up' && '+'}
            {trendValue}% from last period
          </span>
        </div>
      )}
      
      <p className="text-xs text-gray-500 mt-2">{description}</p>
    </div>
  );
}

export default function RoleMetrics({ role, metrics, period = 'This Month' }: RoleMetricsProps) {
  const roleMetrics = METRIC_DEFINITIONS[role] || [];
  
  if (roleMetrics.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No metrics available for this role</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">
          {role.replace('_', ' ')} Metrics
        </h3>
        <span className="text-sm text-gray-500">{period}</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {roleMetrics.map((metricDef) => {
          const metricData = metrics[metricDef.key] || {};
          return (
            <MetricCard
              key={metricDef.key}
              metric={metricDef}
              value={metricData.value || 0}
              target={metricDef.target}
              unit={metricDef.unit}
              trend={metricData.trend}
              trendValue={metricData.trendValue}
              description={metricDef.description}
            />
          );
        })}
      </div>
      
      {/* Performance Summary */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Performance Summary</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {roleMetrics.filter(m => {
                const value = metrics[m.key]?.value || 0;
                return m.target ? value >= m.target : true;
              }).length}
            </div>
            <div className="text-gray-600">Targets Met</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {roleMetrics.filter(m => metrics[m.key]?.trend === 'up').length}
            </div>
            <div className="text-gray-600">Improving</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {roleMetrics.filter(m => {
                const value = metrics[m.key]?.value || 0;
                return m.target && value < m.target;
              }).length}
            </div>
            <div className="text-gray-600">Below Target</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper function to get role-specific insights
export function getRoleInsights(role: UserRole, metrics: Record<string, any>): string[] {
  const insights: string[] = [];
  
  switch (role) {
    case 'REQUESTOR':
      if (metrics.approvalRate?.value < 70) {
        insights.push('Consider improving ECR quality - approval rate is below average');
      }
      if (metrics.avgResponseTime?.value > 5) {
        insights.push('Response times are longer than usual - follow up on pending ECRs');
      }
      break;
      
    case 'ENGINEER':
      if (metrics.overdueTasks?.value > 3) {
        insights.push('You have several overdue tasks - prioritize completion');
      }
      if (metrics.ecoCompletionRate?.value < 85) {
        insights.push('ECO completion rate is below target - review project timelines');
      }
      break;
      
    case 'QUALITY':
      if (metrics.firstPassRate?.value < 90) {
        insights.push('First pass rate is low - consider additional pre-verification checks');
      }
      if (metrics.avgTurnaroundTime?.value > 3) {
        insights.push('Verification turnaround time is high - streamline the process');
      }
      break;
      
    case 'MANUFACTURING':
      if (metrics.productionImpact?.value > 40) {
        insights.push('Production impact is high - optimize implementation scheduling');
      }
      if (metrics.successRate?.value < 95) {
        insights.push('Implementation success rate needs improvement - review procedures');
      }
      break;
      
    case 'MANAGER':
      if (metrics.avgApprovalTime?.value > 3) {
        insights.push('Approval times are above target - expedite decision making');
      }
      if (metrics.teamWorkload?.value > 90) {
        insights.push('Team is at high capacity - consider workload balancing');
      }
      break;
      
    case 'DOCUMENT_CONTROL':
      if (metrics.acknowledgmentRate?.value < 95) {
        insights.push('Acknowledgment rate is low - increase follow-up efforts');
      }
      if (metrics.overdueResponses?.value > 5) {
        insights.push('Multiple overdue responses - escalation may be needed');
      }
      break;
  }
  
  return insights;
}

// Quick metrics summary component
export function MetricsSummary({ role, metrics }: { role: UserRole; metrics: Record<string, any> }) {
  const roleMetrics = METRIC_DEFINITIONS[role] || [];
  const targetsMetCount = roleMetrics.filter(m => {
    const value = metrics[m.key]?.value || 0;
    return m.target ? value >= m.target : true;
  }).length;
  
  const totalTargets = roleMetrics.filter(m => m.target).length;
  const performanceScore = totalTargets > 0 ? Math.round((targetsMetCount / totalTargets) * 100) : 100;
  
  return (
    <div className="flex items-center space-x-4">
      <div className={`text-2xl font-bold ${
        performanceScore >= 80 ? 'text-green-600' :
        performanceScore >= 60 ? 'text-yellow-600' : 'text-red-600'
      }`}>
        {performanceScore}%
      </div>
      <div>
        <div className="text-sm font-medium text-gray-900">Performance Score</div>
        <div className="text-xs text-gray-500">
          {targetsMetCount} of {totalTargets} targets met
        </div>
      </div>
    </div>
  );
}