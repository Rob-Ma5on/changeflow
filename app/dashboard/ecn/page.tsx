'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface ECN {
  id: string;
  ecnNumber: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DISTRIBUTED' | 'EFFECTIVE' | 'CANCELLED';
  effectiveDate?: string;
  distributedAt?: string;
  createdAt: string;
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  eco?: {
    id: string;
    ecoNumber: string;
    title: string;
    status: string;
    completedAt?: string;
    ecr?: {
      id: string;
      ecrNumber: string;
      title: string;
      submitter: { name: string };
    };
  };
}

interface ECNDetailModalProps {
  ecn: ECN | null;
  isOpen: boolean;
  onClose: () => void;
}

function ECNDetailModal({ ecn, isOpen, onClose }: ECNDetailModalProps) {
  if (!isOpen || !ecn) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{ecn.ecnNumber}</h2>
              <p className="text-gray-600">{ecn.title}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            {/* Traceability Chain */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-medium text-blue-900 mb-3">Traceability Chain</h3>
              <div className="flex items-center space-x-2 text-sm">
                {ecn.eco?.ecr && (
                  <>
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded">
                      {ecn.eco.ecr.ecrNumber}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
                {ecn.eco && (
                  <>
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {ecn.eco.ecoNumber}
                    </span>
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded font-medium">
                  {ecn.ecnNumber}
                </span>
              </div>
              <p className="text-blue-700 text-sm mt-2">
                This ECN notifies of changes implemented through the linked ECO and original ECR
              </p>
            </div>

            {/* Status and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  ecn.status === 'DRAFT' ? 'bg-gray-100 text-gray-800' :
                  ecn.status === 'PENDING_APPROVAL' ? 'bg-amber-100 text-amber-800' :
                  ecn.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                  ecn.status === 'DISTRIBUTED' ? 'bg-blue-100 text-blue-800' :
                  ecn.status === 'EFFECTIVE' ? 'bg-green-100 text-green-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {ecn.status.replace('_', ' ')}
                </span>
              </div>
              {ecn.distributedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Distributed Date</label>
                  <p className="text-gray-900">
                    {new Date(ecn.distributedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              {ecn.effectiveDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                  <p className="text-gray-900">
                    {new Date(ecn.effectiveDate).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {/* Linked ECO Information */}
            {ecn.eco && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Linked ECO</label>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <Link 
                      href={`/dashboard/eco`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      {ecn.eco.ecoNumber}: {ecn.eco.title}
                    </Link>
                    <span className="text-sm text-gray-500">
                      Completed: {ecn.eco.completedAt ? new Date(ecn.eco.completedAt).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  {ecn.eco.ecr && (
                    <div className="text-sm text-gray-600">
                      <strong>Original ECR:</strong> {ecn.eco.ecr.ecrNumber} - {ecn.eco.ecr.title}
                      <br />
                      <strong>Submitted by:</strong> {ecn.eco.ecr.submitter.name}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ECN Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="text-gray-900 mt-1">{ecn.description}</p>
            </div>

            {/* Assignee */}
            {ecn.assignee && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                <p className="text-gray-900">{ecn.assignee.name}</p>
              </div>
            )}

            {/* Created Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Created</label>
              <p className="text-gray-900">
                {new Date(ecn.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ECNPage() {
  const { data: session } = useSession();
  const [ecns, setEcns] = useState<ECN[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedECN, setSelectedECN] = useState<ECN | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchECNs = async () => {
      try {
        const url = statusFilter === 'all' 
          ? '/api/ecn' 
          : `/api/ecn?status=${statusFilter}`;
        
        const response = await fetch(url);
        if (response.ok) {
          const ecnData = await response.json();
          setEcns(ecnData);
        } else {
          console.error('Failed to fetch ECNs');
        }
      } catch (error) {
        console.error('Error fetching ECNs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECNs();
  }, [statusFilter]);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
      APPROVED: 'bg-green-100 text-green-800',
      DISTRIBUTED: 'bg-blue-100 text-blue-800',
      EFFECTIVE: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const handleECNClick = (ecn: ECN) => {
    setSelectedECN(ecn);
    setIsModalOpen(true);
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
          <h1 className="text-3xl font-bold text-gray-900">Engineering Change Notices</h1>
          <p className="text-gray-600 mt-2">Formal notifications of implemented changes</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex space-x-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              Status Filter
            </label>
            <select
              id="status"
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="DISTRIBUTED">Distributed</option>
              <option value="EFFECTIVE">Effective</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* ECN Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        {ecns.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ECN Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Linked ECO
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Original ECR
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ecns.map((ecn) => (
                  <tr 
                    key={ecn.id} 
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleECNClick(ecn)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className="text-purple-600 hover:text-purple-800">
                        {ecn.ecnNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="max-w-xs truncate">
                        {ecn.title}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ecn.eco ? (
                        <span className="text-blue-600">
                          {ecn.eco.ecoNumber}
                        </span>
                      ) : (
                        <span className="text-gray-400">No ECO</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {ecn.eco?.ecr ? (
                        <div>
                          <span className="text-gray-600">{ecn.eco.ecr.ecrNumber}</span>
                          <div className="text-xs text-gray-400">
                            by {ecn.eco.ecr.submitter.name}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400">No ECR</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ecn.status)}`}>
                        {ecn.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(ecn.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No ECNs found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No Engineering Change Notices have been created yet.
            </p>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {ecns.filter(ecn => ecn.status === 'PENDING_APPROVAL').length}
            </div>
            <div className="text-sm text-gray-500">Pending Approval</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {ecns.filter(ecn => ecn.status === 'APPROVED').length}
            </div>
            <div className="text-sm text-gray-500">Approved</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {ecns.filter(ecn => ecn.status === 'DISTRIBUTED').length}
            </div>
            <div className="text-sm text-gray-500">Distributed</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">
              {ecns.filter(ecn => ecn.status === 'EFFECTIVE').length}
            </div>
            <div className="text-sm text-gray-500">Effective</div>
          </div>
        </div>
      </div>

      {/* ECN Detail Modal */}
      <ECNDetailModal
        ecn={selectedECN}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedECN(null);
        }}
      />
    </div>
  );
}