'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  status: string;
  priority: string;
  submitter: { name: string };
  assignee?: { name: string };
  createdAt: string;
  estimatedCost?: number;
}

export default function ECRPage() {
  const { data: session } = useSession();
  const [ecrs, setEcrs] = useState<ECR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  useEffect(() => {
    const fetchECRs = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockECRs: ECR[] = [
          {
            id: '1',
            ecrNumber: 'ECR-2025-001',
            title: 'Update Material Specification for Component X',
            status: 'SUBMITTED',
            priority: 'HIGH',
            submitter: { name: 'John Engineer' },
            assignee: { name: 'Sarah Manager' },
            createdAt: '2025-01-15T10:00:00Z',
            estimatedCost: 15000
          },
          {
            id: '2',
            ecrNumber: 'ECR-2025-002',
            title: 'Widget Assembly Process Improvement',
            status: 'DRAFT',
            priority: 'MEDIUM',
            submitter: { name: 'Lisa Engineer' },
            createdAt: '2025-01-12T14:30:00Z',
            estimatedCost: 8500
          },
          {
            id: '3',
            ecrNumber: 'ECR-2025-003',
            title: 'Safety Enhancement for Manufacturing Line 2',
            status: 'APPROVED',
            priority: 'HIGH',
            submitter: { name: 'Mike Safety' },
            assignee: { name: 'John Engineer' },
            createdAt: '2025-01-10T09:15:00Z',
            estimatedCost: 25000
          },
          {
            id: '4',
            ecrNumber: 'ECR-2025-004',
            title: 'Packaging Design Update for Product Line A',
            status: 'UNDER_REVIEW',
            priority: 'LOW',
            submitter: { name: 'Anna Designer' },
            assignee: { name: 'Sarah Manager' },
            createdAt: '2025-01-08T11:45:00Z',
            estimatedCost: 5000
          },
          {
            id: '5',
            ecrNumber: 'ECR-2025-005',
            title: 'Environmental Compliance Update',
            status: 'REJECTED',
            priority: 'MEDIUM',
            submitter: { name: 'Tom Compliance' },
            createdAt: '2025-01-05T16:20:00Z'
          }
        ];
        setEcrs(mockECRs);
      } catch (error) {
        console.error('Error fetching ECRs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECRs();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      UNDER_REVIEW: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Under Review' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
      IMPLEMENTED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Implemented' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelled' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return `${config.bg} ${config.text}`;
  };

  const getStatusLabel = (status: string) => {
    const statusConfig = {
      DRAFT: 'Draft',
      SUBMITTED: 'Submitted',
      UNDER_REVIEW: 'Under Review',
      APPROVED: 'Approved',
      REJECTED: 'Rejected',
      IMPLEMENTED: 'Implemented',
      CANCELLED: 'Cancelled'
    };
    return statusConfig[status as keyof typeof statusConfig] || status;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { bg: 'bg-green-100', text: 'text-green-800' },
      MEDIUM: { bg: 'bg-amber-100', text: 'text-amber-800' },
      HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
      CRITICAL: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
    return `${config.bg} ${config.text}`;
  };

  const filteredECRs = ecrs.filter((ecr) => {
    const matchesSearch = ecr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ecr.ecrNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ecr.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ecr.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Engineering Change Requests</h1>
          <p className="text-gray-600 mt-2">Manage and track all change requests</p>
        </div>
        <Link
          href="/dashboard/ecr/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New ECR
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <input
              type="text"
              id="search"
              placeholder="Search by title or ECR number..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              id="status"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="UNDER_REVIEW">Under Review</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="IMPLEMENTED">Implemented</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </label>
            <select
              id="priority"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="CRITICAL">Critical</option>
            </select>
          </div>
        </div>
      </div>

      {/* ECR Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  ECR Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Requestor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estimated Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredECRs.map((ecr) => (
                <tr key={ecr.id} className="hover:bg-gray-50 cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/dashboard/ecr/${ecr.id}`} className="text-blue-600 hover:text-blue-800">
                      {ecr.ecrNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {ecr.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityBadge(ecr.priority)}`}>
                      {ecr.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ecr.status)}`}>
                      {getStatusLabel(ecr.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecr.submitter.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatCurrency(ecr.estimatedCost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(ecr.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredECRs.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No ECRs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || priorityFilter !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Get started by creating your first Engineering Change Request.'}
            </p>
            {!searchTerm && statusFilter === 'all' && priorityFilter === 'all' && (
              <div className="mt-6">
                <Link
                  href="/dashboard/ecr/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  New ECR
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}