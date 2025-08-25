'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface DashboardStats {
  totalEcrs: number;
  openEcrs: number;
  ecosInProgress: number;
  pendingEcns: number;
  completedThisMonth: number;
  recentActivity: Array<{
    id: string;
    type: 'ECR' | 'ECO' | 'ECN';
    number: string;
    title: string;
    status: string;
    date: string;
    user: string;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    totalEcrs: 0,
    openEcrs: 0,
    ecosInProgress: 0,
    pendingEcns: 0,
    completedThisMonth: 0,
    recentActivity: []
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
            recentActivity: []
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
          recentActivity: []
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

  if (loading) {
    return (
      <div className="space-y-8">
        {/* Welcome Header Skeleton */}
        <div>
          <div className="h-10 bg-gray-200 rounded w-72 animate-pulse"></div>
          <div className="h-5 bg-gray-200 rounded w-80 mt-2 animate-pulse"></div>
        </div>

        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[1, 2, 3, 4].map((card) => (
            <div key={card} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 mb-2 animate-pulse"></div>
                  <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4 animate-pulse"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((action) => (
              <div key={action} className="flex items-center p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-gray-200 rounded-lg mr-4 animate-pulse"></div>
                <div>
                  <div className="h-4 bg-gray-200 rounded w-20 mb-1 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Skeleton */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {[1, 2, 3, 4, 5].map((activity) => (
                <div key={activity} className="flex items-start space-x-3">
                  <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse"></div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-16 animate-pulse"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                    <div className="flex items-center space-x-2">
                      <div className="h-5 bg-gray-200 rounded-full w-16 animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
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

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {session?.user?.name || 'User'}!
        </h1>
        <p className="text-gray-600 mt-2">
          Here&apos;s what&apos;s happening with your engineering changes
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <Link href="/dashboard/ecr" className="block">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Open ECRs</p>
                <div className="flex items-baseline">
                  <p className="text-2xl font-semibold text-gray-900">{stats.openEcrs}</p>
                  <p className="ml-2 text-sm text-gray-500">of {stats.totalEcrs} total</p>
                </div>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/eco" className="block">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">ECOs In Progress</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.ecosInProgress}</p>
              </div>
            </div>
          </div>
        </Link>

        <Link href="/dashboard/ecn" className="block">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-600">Pending ECNs</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.pendingEcns}</p>
              </div>
            </div>
          </div>
        </Link>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="ml-4 flex-1">
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedThisMonth}</p>
              <p className="text-xs text-gray-500">Changes Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            href="/dashboard/ecr/new"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">New ECR</p>
              <p className="text-sm text-gray-500">Create change request</p>
            </div>
          </Link>

          <Link
            href="/dashboard/eco"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">View ECOs</p>
              <p className="text-sm text-gray-500">Track implementation</p>
            </div>
          </Link>

          <Link
            href="/dashboard/ecn"
            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 2v5H4" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4H4a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V8" />
              </svg>
            </div>
            <div>
              <p className="font-medium text-gray-900">Review ECNs</p>
              <p className="text-sm text-gray-500">Approve notifications</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
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
                        <div className="flex items-center justify-between">
                          <div className="text-sm">
                            <Link
                              href={`/dashboard/${activity.type.toLowerCase()}`}
                              className="font-medium text-gray-900 hover:text-blue-600"
                            >
                              {activity.number}
                            </Link>
                          </div>
                          <div className="text-right text-sm whitespace-nowrap text-gray-500">
                            {new Date(activity.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="mt-1">
                          <p className="text-sm text-gray-700">{activity.title}</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={getStatusStyle(activity.status)}
                            >
                              {activity.status.replace(/_/g, ' ')}
                            </span>
                            <span className="text-xs text-gray-500">by {activity.user}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}