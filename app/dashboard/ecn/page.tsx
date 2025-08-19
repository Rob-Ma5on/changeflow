'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface ECN {
  id: string;
  ecnNumber: string;
  title: string;
  status: string;
  submitter: { name: string };
  assignee?: { name: string };
  effectiveDate?: string;
  distributedAt?: string;
  createdAt: string;
  eco?: {
    ecoNumber: string;
    ecr?: {
      ecrNumber: string;
    };
  };
}

export default function ECNPage() {
  const [ecns, setEcns] = useState<ECN[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchECNs = async () => {
      try {
        // Mock data for now - replace with actual API call
        const mockECNs: ECN[] = [
          {
            id: '1',
            ecnNumber: 'ECN-0001',
            title: 'Material Specification Update Effective - Component X',
            status: 'DISTRIBUTED',
            submitter: { name: 'John Engineer' },
            assignee: { name: 'Sarah Manager' },
            effectiveDate: '2024-02-01T00:00:00Z',
            distributedAt: '2024-02-01T08:00:00Z',
            createdAt: '2024-01-30T14:00:00Z',
            eco: {
              ecoNumber: 'ECO-0001',
              ecr: {
                ecrNumber: 'ECR-0002'
              }
            }
          },
          {
            id: '2',
            ecnNumber: 'ECN-0002',
            title: 'Widget Assembly Process Change Notice',
            status: 'PENDING_APPROVAL',
            submitter: { name: 'Mike Designer' },
            assignee: { name: 'Admin User' },
            effectiveDate: '2024-02-15T00:00:00Z',
            createdAt: '2024-02-05T10:30:00Z',
            eco: {
              ecoNumber: 'ECO-0002',
              ecr: {
                ecrNumber: 'ECR-0001'
              }
            }
          },
          {
            id: '3',
            ecnNumber: 'ECN-0003',
            title: 'Safety Enhancement Implementation Notice',
            status: 'APPROVED',
            submitter: { name: 'Lisa Safety' },
            assignee: { name: 'John Engineer' },
            effectiveDate: '2024-03-01T00:00:00Z',
            createdAt: '2024-02-10T09:15:00Z'
          },
          {
            id: '4',
            ecnNumber: 'ECN-0004',
            title: 'Packaging Design Change Notification',
            status: 'DRAFT',
            submitter: { name: 'Sarah Manager' },
            createdAt: '2024-02-12T16:45:00Z'
          }
        ];
        setEcns(mockECNs);
      } catch (error) {
        console.error('Error fetching ECNs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECNs();
  }, []);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-amber-100 text-amber-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      DISTRIBUTED: 'bg-green-100 text-green-800',
      EFFECTIVE: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const getDistributionStatus = (ecn: ECN) => {
    if (ecn.distributedAt && ecn.effectiveDate) {
      const now = new Date();
      const effectiveDate = new Date(ecn.effectiveDate);
      const distributedDate = new Date(ecn.distributedAt);
      
      if (now >= effectiveDate) {
        return { status: 'Effective', color: 'text-green-600', icon: '✓' };
      } else if (distributedDate) {
        return { status: 'Distributed', color: 'text-blue-600', icon: '📧' };
      }
    }
    
    if (ecn.status === 'APPROVED') {
      return { status: 'Ready to Distribute', color: 'text-amber-600', icon: '⏳' };
    }
    
    return { status: 'Not Distributed', color: 'text-gray-600', icon: '○' };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredECNs = ecns.filter((ecn) => {
    return statusFilter === 'all' || ecn.status === statusFilter;
  });

  const getActionableECNs = () => {
    return ecns.filter(ecn => 
      ['PENDING_APPROVAL', 'APPROVED'].includes(ecn.status)
    );
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
          <p className="text-gray-600 mt-2">Track change notifications and distribution status</p>
        </div>
        <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700">
          <span className="mr-2">+</span>
          New ECN
        </button>
      </div>

      {/* Action Required Section */}
      {getActionableECNs().length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-lg font-medium text-amber-900 mb-3">
            Action Required ({getActionableECNs().length})
          </h3>
          <div className="space-y-2">
            {getActionableECNs().map((ecn) => (
              <div key={ecn.id} className="flex items-center justify-between bg-white p-3 rounded border">
                <div className="flex items-center space-x-3">
                  <span className="text-amber-600 font-medium">{ecn.ecnNumber}</span>
                  <span className="text-gray-900">{ecn.title}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(ecn.status)}`}>
                    {ecn.status.replace('_', ' ')}
                  </span>
                  <Link
                    href={`/dashboard/ecn/${ecn.id}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center space-x-4">
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Filter by Status:
          </label>
          <select
            id="status"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

      {/* ECNs List */}
      <div className="space-y-4">
        {filteredECNs.map((ecn) => {
          const distributionStatus = getDistributionStatus(ecn);
          
          return (
            <div key={ecn.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center space-x-4 mb-3">
                    <Link 
                      href={`/dashboard/ecn/${ecn.id}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800"
                    >
                      {ecn.ecnNumber}
                    </Link>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(ecn.status)}`}>
                      {ecn.status.replace('_', ' ')}
                    </span>
                    <div className={`flex items-center text-sm font-medium ${distributionStatus.color}`}>
                      <span className="mr-1">{distributionStatus.icon}</span>
                      {distributionStatus.status}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {ecn.title}
                  </h3>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Submitter:</span>
                      <span className="ml-2 text-gray-900">{ecn.submitter.name}</span>
                    </div>
                    {ecn.assignee && (
                      <div>
                        <span className="text-gray-500">Assignee:</span>
                        <span className="ml-2 text-gray-900">{ecn.assignee.name}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Created:</span>
                      <span className="ml-2 text-gray-900">{formatDate(ecn.createdAt)}</span>
                    </div>
                  </div>

                  {/* Distribution Timeline */}
                  {(ecn.effectiveDate || ecn.distributedAt) && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-6 text-sm">
                        {ecn.distributedAt && (
                          <div>
                            <span className="text-gray-500">Distributed:</span>
                            <span className="ml-2 text-gray-900">{formatDateTime(ecn.distributedAt)}</span>
                          </div>
                        )}
                        {ecn.effectiveDate && (
                          <div>
                            <span className="text-gray-500">Effective Date:</span>
                            <span className="ml-2 text-gray-900">{formatDate(ecn.effectiveDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Related Documents */}
                  {ecn.eco && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center space-x-4 text-sm">
                        <span className="text-gray-500">Related:</span>
                        <Link 
                          href={`/dashboard/eco/${ecn.eco.ecoNumber}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {ecn.eco.ecoNumber}
                        </Link>
                        {ecn.eco.ecr && (
                          <>
                            <span className="text-gray-300">•</span>
                            <Link 
                              href={`/dashboard/ecr/${ecn.eco.ecr.ecrNumber}`}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              {ecn.eco.ecr.ecrNumber}
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col space-y-2 ml-4">
                  {ecn.status === 'PENDING_APPROVAL' && (
                    <>
                      <button className="px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded">
                        Approve
                      </button>
                      <button className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded">
                        Reject
                      </button>
                    </>
                  )}
                  {ecn.status === 'APPROVED' && (
                    <button className="px-3 py-1 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded">
                      Distribute
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredECNs.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No ECNs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  );
}