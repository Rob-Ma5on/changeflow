'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import Link from 'next/link';
import { Pie, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { ActionRequiredList } from '@/components/dashboard/ActionRequiredCard';
import RoleMetrics from '@/components/dashboard/RoleMetrics';

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

interface DashboardStats {
  totalEcrs: number;
  openEcrs: number;
  ecosInProgress: number;
  pendingEcns: number;
  completedThisMonth: number;
  priorityBreakdown: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  customerImpactSummary: {
    directImpact: number;
    indirectImpact: number;
    noImpact: number;
  };
  implementationStatus: {
    notStarted: number;
    inProgress: number;
    complete: number;
    verified: number;
  };
  thisWeekTargets: Array<{
    id: string;
    type: 'ECR' | 'ECO';
    number: string;
    title: string;
    targetDate: string;
    priority: string;
    assignee?: string;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'ECR' | 'ECO' | 'ECN';
    number: string;
    title: string;
    status: string;
    priority?: string;
    customerImpact?: string;
    date: string;
    user: string;
  }>;
  myItems: {
    assigned: number;
    submitted: number;
    needsApproval: number;
  };
  highPriorityItems: number;
  customerImpactItems: number;
  dueThisWeek: number;
  actionItems: any[];
  roleMetrics: Record<string, any>;
  userRole: UserRole;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalEcrs: 0,
    openEcrs: 0,
    ecosInProgress: 0,
    pendingEcns: 0,
    completedThisMonth: 0,
    priorityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
    customerImpactSummary: { directImpact: 0, indirectImpact: 0, noImpact: 0 },
    implementationStatus: { notStarted: 0, inProgress: 0, complete: 0, verified: 0 },
    thisWeekTargets: [],
    recentActivity: [],
    myItems: { assigned: 0, submitted: 0, needsApproval: 0 },
    highPriorityItems: 0,
    customerImpactItems: 0,
    dueThisWeek: 0,
    actionItems: [],
    roleMetrics: {},
    userRole: 'VIEWER' as UserRole
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const response = await fetch('/api/dashboard');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Failed to fetch dashboard stats');
          // Fallback to basic stats if API fails
          setStats({
            totalEcrs: 0,
            openEcrs: 0,
            ecosInProgress: 0,
            pendingEcns: 0,
            completedThisMonth: 0,
            priorityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
            customerImpactSummary: { directImpact: 0, indirectImpact: 0, noImpact: 0 },
            implementationStatus: { notStarted: 0, inProgress: 0, complete: 0, verified: 0 },
            thisWeekTargets: [],
            recentActivity: [],
            myItems: { assigned: 0, submitted: 0, needsApproval: 0 },
            highPriorityItems: 0,
            customerImpactItems: 0,
            dueThisWeek: 0,
            actionItems: [],
            roleMetrics: {},
            userRole: 'VIEWER' as UserRole
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        // Fallback to basic stats if API fails
        setStats({
          totalEcrs: 0,
          openEcrs: 0,
          ecosInProgress: 0,
          pendingEcns: 0,
          completedThisMonth: 0,
          priorityBreakdown: { critical: 0, high: 0, medium: 0, low: 0 },
          customerImpactSummary: { directImpact: 0, indirectImpact: 0, noImpact: 0 },
          implementationStatus: { notStarted: 0, inProgress: 0, complete: 0, verified: 0 },
          thisWeekTargets: [],
          recentActivity: [],
          myItems: { assigned: 0, submitted: 0, needsApproval: 0 },
          highPriorityItems: 0,
          customerImpactItems: 0,
          dueThisWeek: 0
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'draft':
        return { backgroundColor: '#F3F4F6', color: '#374151' };
      case 'submitted':
      case 'pending_approval':
      case 'under_review':
        return { backgroundColor: '#FEF3C7', color: '#D97706' };
      case 'approved':
      case 'in_progress':
        return { backgroundColor: '#DBEAFE', color: '#2563EB' };
      case 'completed':
      case 'distributed':
      case 'effective':
      case 'converted':
        return { backgroundColor: '#D1FAE5', color: '#059669' };
      case 'rejected':
      case 'cancelled':
        return { backgroundColor: '#FEE2E2', color: '#DC2626' };
      default:
        return { backgroundColor: '#F3F4F6', color: '#374151' };
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ECR':
        return (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
        );
      case 'ECO':
        return (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
        );
      case 'ECN':
        return (
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
        );
      default:
        return (
          <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
        );
    }
  };

  // Chart configurations
  const priorityChartData = {
    labels: ['Critical', 'High', 'Medium', 'Low'],
    datasets: [{
      data: [
        stats.priorityBreakdown.critical,
        stats.priorityBreakdown.high,
        stats.priorityBreakdown.medium,
        stats.priorityBreakdown.low
      ],
      backgroundColor: ['#dc2626', '#ea580c', '#ca8a04', '#16a34a'],
      borderWidth: 2,
      borderColor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff'
    }]
  };

  const customerImpactChartData = {
    labels: ['Direct Impact', 'Indirect Impact', 'No Impact'],
    datasets: [{
      data: [
        stats.customerImpactSummary.directImpact,
        stats.customerImpactSummary.indirectImpact,
        stats.customerImpactSummary.noImpact
      ],
      backgroundColor: ['#dc2626', '#ea580c', '#16a34a'],
      borderWidth: 2,
      borderColor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff'
    }]
  };

  const implementationStatusChartData = {
    labels: ['Not Started', 'In Progress', 'Complete', 'Verified'],
    datasets: [{
      label: 'ECN Implementation Status',
      data: [
        stats.implementationStatus.notStarted,
        stats.implementationStatus.inProgress,
        stats.implementationStatus.complete,
        stats.implementationStatus.verified
      ],
      backgroundColor: ['#6b7280', '#f59e0b', '#3b82f6', '#10b981'],
      borderWidth: 1,
      borderColor: typeof window !== 'undefined' && document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff'
    }]
  };

  const isDarkMode = typeof window !== 'undefined' && document.documentElement.classList.contains('dark');
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 15,
          usePointStyle: true,
          font: {
            size: 12
          },
          color: isDarkMode ? '#e5e7eb' : '#374151'
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(31, 41, 55, 0.95)' : 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: isDarkMode ? '#6b7280' : '#374151',
        borderWidth: 1
      }
    }
  };

  const barChartOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Quick filter functions
  const getQuickFilterUrl = (filter: string) => {
    switch (filter) {
      case 'my-items':
        return `/dashboard/ecr?assignee=${session?.user?.id}`;
      case 'high-priority':
        return `/dashboard/ecr?priority=CRITICAL,HIGH`;
      case 'customer-impact':
        return `/dashboard/ecr?customerImpact=DIRECT_IMPACT`;
      case 'due-this-week':
        return `/dashboard/ecr?dateRange=this-week`;
      default:
        return '/dashboard';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Welcome Header Skeleton */}
        <div>
          <div className="h-10 bg-gray-200 dark:bg-gray-600 rounded w-72 animate-pulse"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-80 mt-2 animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((card) => (
            <div key={card} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg animate-pulse"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((action) => (
              <div key={action} className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg mr-4 animate-pulse"></div>
                <div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-20 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-32 animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((activity) => (
                <div key={activity} className="flex items-start space-x-3">
                  <div className="h-10 w-10 bg-gray-200 dark:bg-gray-600 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="flex items-center space-x-2">
                      <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-16 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-20 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const getRoleSpecificQuickActions = () => {
    const role = stats.userRole;
    const actions = [];

    switch (role) {
      case 'REQUESTOR':
        actions.push(
          {
            href: '/dashboard/ecr/new',
            icon: (
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            ),
            title: 'New ECR',
            description: 'Create change request',
            bgColor: 'bg-blue-100',
            primary: true
          }
        );
        break;
      case 'ENGINEER':
        actions.push(
          {
            href: '/dashboard/ecr?status=SUBMITTED,UNDER_REVIEW',
            icon: (
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            ),
            title: 'Review ECRs',
            description: 'Pending reviews',
            bgColor: 'bg-green-100'
          }
        );
        break;
      case 'QUALITY':
        actions.push(
          {
            href: '/dashboard/eco?status=VERIFICATION',
            icon: (
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            ),
            title: 'Verify ECOs',
            description: 'Quality verification',
            bgColor: 'bg-purple-100'
          }
        );
        break;
      case 'MANUFACTURING':
        actions.push(
          {
            href: '/dashboard/eco?status=READY_FOR_IMPLEMENTATION',
            icon: (
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
              </svg>
            ),
            title: 'Implement ECOs',
            description: 'Ready to execute',
            bgColor: 'bg-orange-100'
          }
        );
        break;
      case 'MANAGER':
        actions.push(
          {
            href: '/dashboard/ecr?status=PENDING_APPROVAL',
            icon: (
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            title: 'Approve ECRs',
            description: 'Pending approval',
            bgColor: 'bg-red-100',
            primary: true
          }
        );
        break;
      case 'DOCUMENT_CONTROL':
        actions.push(
          {
            href: '/ecn/create-from-eco',
            icon: (
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
              </svg>
            ),
            title: 'Create ECN',
            description: 'From verified ECO',
            bgColor: 'bg-amber-100',
            primary: true
          }
        );
        break;
      default:
        actions.push(
          {
            href: '/dashboard/ecr',
            icon: (
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
            title: 'View ECRs',
            description: 'Browse requests',
            bgColor: 'bg-gray-100'
          }
        );
    }

    // Add common actions
    actions.push(
      {
        href: '/dashboard/eco',
        icon: (
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        ),
        title: 'View ECOs',
        description: 'Track implementation',
        bgColor: 'bg-green-100'
      },
      {
        href: '/dashboard/ecn',
        icon: (
          <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 2v5H4" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8" />
          </svg>
        ),
        title: 'Review ECNs',
        description: 'View notifications',
        bgColor: 'bg-amber-100'
      }
    );

    return actions;
  };

  const getRoleDisplayName = (role: UserRole) => {
    const roleNames = {
      REQUESTOR: 'Requestor',
      ENGINEER: 'Engineer',
      QUALITY: 'Quality Assurance',
      MANUFACTURING: 'Manufacturing',
      MANAGER: 'Manager',
      DOCUMENT_CONTROL: 'Document Control',
      ADMIN: 'Administrator',
      VIEWER: 'Viewer'
    };
    return roleNames[role] || role;
  };

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Welcome back, {session?.user?.name || 'User'}!
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Here&rsquo;s your {getRoleDisplayName(stats.userRole)} dashboard
        </p>
      </div>

      {/* Role-Specific Action Items */}
      {stats.actionItems.length > 0 && (
        <ActionRequiredList
          items={stats.actionItems}
          title="Action Required"
          maxItems={5}
          showViewAll={true}
          viewAllUrl={`/dashboard/${stats.userRole.toLowerCase()}/tasks`}
        />
      )}

      {/* Role-Specific Metrics */}
      <RoleMetrics
        role={stats.userRole}
        metrics={stats.roleMetrics}
      />

      {/* Quick Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href={getQuickFilterUrl('my-items')}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">My Items</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Assigned to me</p>
            </div>
            <span className="bg-blue-100 text-blue-800 text-lg font-semibold px-3 py-1 rounded-full">
              {stats.myItems.assigned}
            </span>
          </Link>
          
          <Link
            href={getQuickFilterUrl('high-priority')}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">High Priority</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Critical & High</p>
            </div>
            <span className="bg-red-100 text-red-800 text-lg font-semibold px-3 py-1 rounded-full">
              {stats.highPriorityItems}
            </span>
          </Link>
          
          <Link
            href={getQuickFilterUrl('customer-impact')}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-orange-50 hover:border-orange-300 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Customer Impact</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Direct impact items</p>
            </div>
            <span className="bg-orange-100 text-orange-800 text-lg font-semibold px-3 py-1 rounded-full">
              {stats.customerImpactItems}
            </span>
          </Link>
          
          <Link
            href={getQuickFilterUrl('due-this-week')}
            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
          >
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Due This Week</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Target dates</p>
            </div>
            <span className="bg-yellow-100 text-yellow-800 text-lg font-semibold px-3 py-1 rounded-full">
              {stats.dueThisWeek}
            </span>
          </Link>
        </div>
      </div>

      {/* Phase 1 Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Priority Breakdown Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Priority Breakdown</h3>
          <div className="h-64">
            <Pie data={priorityChartData} options={chartOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Open ECRs by priority level
          </div>
        </div>

        {/* Customer Impact Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Impact</h3>
          <div className="h-64">
            <Doughnut data={customerImpactChartData} options={chartOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Distribution of customer impact levels
          </div>
        </div>

        {/* Implementation Status Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">ECN Implementation Status</h3>
          <div className="h-64">
            <Bar data={implementationStatusChartData} options={barChartOptions} />
          </div>
          <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
            Current status of ECN implementations
          </div>
        </div>
      </div>

      {/* This Week's Targets */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">This Week's Target Dates</h3>
        </div>
        <div className="p-6">
          {stats.thisWeekTargets.length > 0 ? (
            <div className="space-y-4">
              {stats.thisWeekTargets.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        item.type === 'ECR' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{item.number}</p>
                      <p className="text-sm text-gray-600">{item.title}</p>
                      {item.assignee && (
                        <p className="text-xs text-gray-500">Assigned to: {item.assignee}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatDate(item.targetDate)}</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      item.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      item.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {item.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V7a2 2 0 012-2h4a2 2 0 012 2v0M8 7v8a2 2 0 002 2h4a2 2 0 002-2V7M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
              </svg>
              <p>No target dates scheduled for this week</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link href="/dashboard/ecr" className="block">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Open ECRs</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.openEcrs}</p>
                  <p className="ml-2 text-sm text-gray-500 dark:text-gray-400">of {stats.totalEcrs} total</p>
                </div>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/eco" className="block">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">ECOs In Progress</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.ecosInProgress}</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/ecn" className="block">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending ECNs</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.pendingEcns}</p>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">{stats.completedThisMonth}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Changes Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Specific Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {getRoleSpecificQuickActions().slice(0, 3).map((action, index) => (
            <Link
              key={index}
              href={action.href}
              className={`flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                action.primary ? 'ring-2 ring-blue-500 border-blue-500' : ''
              }`}
            >
              <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mr-4`}>
                {action.icon}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{action.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Enhanced Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Recent Activity</h3>
        </div>
        <div className="p-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {stats.recentActivity.map((activity, index) => (
                <li key={activity.id}>
                  <div className="relative pb-8">
                    {index !== stats.recentActivity.length - 1 && (
                      <span className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true" />
                    )}
                    <div className="relative flex items-start space-x-3">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getTypeIcon(activity.type)}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div>
                          <div className="text-sm">
                            <Link href={`/dashboard/${activity.type.toLowerCase()}/${activity.number}`} className="font-medium text-gray-900 hover:text-blue-600">
                              {activity.number}
                            </Link>
                          </div>
                          <p className="mt-0.5 text-sm text-gray-500">
                            {activity.title}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center space-x-2">
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                            style={getStatusStyle(activity.status)}
                          >
                            {activity.status.replace(/_/g, ' ')}
                          </span>
                          {activity.priority && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              activity.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                              activity.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                              activity.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {activity.priority}
                            </span>
                          )}
                          {activity.customerImpact && (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              activity.customerImpact === 'DIRECT_IMPACT' ? 'bg-red-100 text-red-800' :
                              activity.customerImpact === 'INDIRECT_IMPACT' ? 'bg-orange-100 text-orange-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {activity.customerImpact.replace(/_/g, ' ')}
                            </span>
                          )}
                          <span className="text-xs text-gray-500">by {activity.user}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          {new Date(activity.date).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          {stats.recentActivity.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}