'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface DashboardStats {
  ecrCount: number;
  ecoCount: number;
  ecnCount: number;
  recentActivity: Array<{
    id: string;
    type: 'ECR' | 'ECO' | 'ECN';
    number: string;
    title: string;
    status: string;
    date: string;
  }>;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStats>({
    ecrCount: 0,
    ecoCount: 0,
    ecnCount: 0,
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call - replace with actual API calls
    const fetchStats = async () => {
      try {
        // Mock data for now
        setStats({
          ecrCount: 8,
          ecoCount: 5,
          ecnCount: 12,
          recentActivity: [
            {
              id: '1',
              type: 'ECR',
              number: 'ECR-0001',
              title: 'Improve Widget Assembly Process',
              status: 'Submitted',
              date: '2024-01-15'
            },
            {
              id: '2',
              type: 'ECO',
              number: 'ECO-0001',
              title: 'Material Specification Update',
              status: 'In Progress',
              date: '2024-01-23'
            },
            {
              id: '3',
              type: 'ECN',
              number: 'ECN-0001',
              title: 'Material Spec Change Effective',
              status: 'Distributed',
              date: '2024-02-01'
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'pending':
        return 'bg-amber-100 text-amber-800';
      case 'approved':
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
      case 'distributed':
        return 'bg-green-100 text-green-800';
      case 'rejected':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ECR':
        return 'bg-blue-500';
      case 'ECO':
        return 'bg-green-500';
      case 'ECN':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Engineering Change Management Overview
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'requests'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Requests (ECR)
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Orders (ECO)
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notices'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notices (ECN)
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/dashboard/ecr" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">R</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Engineering Change Requests</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.ecrCount}</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/eco" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">O</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Engineering Change Orders</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.ecoCount}</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/ecn" className="block">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">N</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Engineering Change Notices</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats.ecnCount}</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 ${getTypeColor(activity.type)} rounded-full`}></div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {activity.number}: {activity.title}
                      </p>
                      <p className="text-sm text-gray-500">{activity.date}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick navigation for other tabs */}
      {activeTab === 'requests' && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Engineering Change Requests</h3>
          <Link
            href="/dashboard/ecr"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            View All ECRs
          </Link>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Engineering Change Orders</h3>
          <Link
            href="/dashboard/eco"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            View All ECOs
          </Link>
        </div>
      )}

      {activeTab === 'notices' && (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Engineering Change Notices</h3>
          <Link
            href="/dashboard/ecn"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700"
          >
            View All ECNs
          </Link>
        </div>
      )}
    </div>
  );
}