'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  status: string;
  urgency: string;
  submitter: { name: string };
  assignee?: { name: string };
  createdAt: string;
  submittedAt?: string;
}

export default function ECRPage() {
  const [ecrs, setEcrs] = useState<ECR[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState('all');

  useEffect(() => {
    const fetchECRs = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockECRs: ECR[] = [
          {
            id: '1',
            ecrNumber: 'ECR-0001',
            title: 'Improve Widget Assembly Process',
            status: 'SUBMITTED',
            urgency: 'HIGH',
            submitter: { name: 'John Engineer' },
            assignee: { name: 'Sarah Manager' },
            createdAt: '2024-01-15T10:00:00Z',
            submittedAt: '2024-01-15T10:00:00Z'
          },
          {
            id: '2',
            ecrNumber: 'ECR-0002',
            title: 'Update Material Specification for Component X',
            status: 'APPROVED',
            urgency: 'MEDIUM',
            submitter: { name: 'Sarah Manager' },
            assignee: { name: 'John Engineer' },
            createdAt: '2024-01-20T14:30:00Z',
            submittedAt: '2024-01-20T14:30:00Z'
          },
          {
            id: '3',
            ecrNumber: 'ECR-0003',
            title: 'Redesign Packaging for Product Line A',
            status: 'UNDER_REVIEW',
            urgency: 'LOW',
            submitter: { name: 'Mike Designer' },
            createdAt: '2024-01-25T09:15:00Z'
          },
          {
            id: '4',
            ecrNumber: 'ECR-0004',
            title: 'Safety Enhancement for Manufacturing Line 2',
            status: 'DRAFT',
            urgency: 'CRITICAL',
            submitter: { name: 'Lisa Safety' },
            createdAt: '2024-01-28T11:45:00Z'
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
      DRAFT: 'bg-gray-100 text-gray-800',
      SUBMITTED: 'bg-blue-100 text-blue-800',
      UNDER_REVIEW: 'bg-amber-100 text-amber-800',
      APPROVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      IMPLEMENTED: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-gray-100 text-gray-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const getUrgencyBadge = (urgency: string) => {
    const urgencyConfig = {
      LOW: 'bg-green-100 text-green-800',
      MEDIUM: 'bg-amber-100 text-amber-800',
      HIGH: 'bg-orange-100 text-orange-800',
      CRITICAL: 'bg-red-100 text-red-800'
    };
    return urgencyConfig[urgency as keyof typeof urgencyConfig] || 'bg-gray-100 text-gray-800';
  };

  const filteredECRs = ecrs.filter((ecr) => {
    const matchesSearch = ecr.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ecr.ecrNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ecr.status === statusFilter;
    const matchesUrgency = urgencyFilter === 'all' || ecr.urgency === urgencyFilter;
    
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
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
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
          <span className="mr-2">+</span>
          New ECR
        </button>
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
              placeholder="Search ECRs..."
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
            <label htmlFor="urgency" className="block text-sm font-medium text-gray-700 mb-1">
              Urgency
            </label>
            <select
              id="urgency"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={urgencyFilter}
              onChange={(e) => setUrgencyFilter(e.target.value)}
            >
              <option value="all">All Urgencies</option>
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
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Urgency
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assignee
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredECRs.map((ecr) => (
                <tr key={ecr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                    <Link href={`/dashboard/ecr/${ecr.id}`} className="hover:text-blue-800">
                      {ecr.ecrNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="max-w-xs truncate">
                      {ecr.title}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ecr.status)}`}>
                      {ecr.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getUrgencyBadge(ecr.urgency)}`}>
                      {ecr.urgency}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecr.submitter.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecr.assignee?.name || 'Unassigned'}
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
            <p className="text-gray-500">No ECRs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}