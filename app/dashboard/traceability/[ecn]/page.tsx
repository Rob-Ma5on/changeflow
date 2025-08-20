'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
}

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  description: string;
  status: string;
  urgency: string;
  submitter: User;
  assignee?: User;
  approver?: User;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
}

interface ECO {
  id: string;
  ecoNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  submitter: User;
  assignee?: User;
  approver?: User;
  createdAt: string;
  submittedAt?: string;
  approvedAt?: string;
  completedAt?: string;
}

interface ECN {
  id: string;
  ecnNumber: string;
  title: string;
  description: string;
  status: string;
  submitter: User;
  assignee?: User;
  createdAt: string;
  distributedAt?: string;
  effectiveDate?: string;
  changesImplemented?: string;
  affectedItems?: string;
  dispositionInstructions?: string;
  verificationMethod?: string;
}

interface TimelineEvent {
  type: string;
  date: string;
  title: string;
  description: string;
  user?: User;
  status: string;
  recordId: string;
  recordType: 'ECR' | 'ECO' | 'ECN';
  recordNumber: string;
}

interface TraceabilityData {
  type: 'ECR' | 'ECO' | 'ECN';
  ecn?: ECN;
  eco?: ECO;
  ecrs: ECR[];
  timeline: TimelineEvent[];
}

function DetailCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      {children}
    </div>
  );
}

function StatusBadge({ status, type }: { status: string; type: 'ECR' | 'ECO' | 'ECN' }) {
  const getStatusColor = (status: string, type: 'ECR' | 'ECO' | 'ECN') => {
    const colors = {
      ECR: {
        APPROVED: 'bg-green-100 text-green-800',
        CONVERTED: 'bg-blue-100 text-blue-800',
        REJECTED: 'bg-red-100 text-red-800',
        UNDER_REVIEW: 'bg-yellow-100 text-yellow-800',
        SUBMITTED: 'bg-blue-100 text-blue-800',
        DRAFT: 'bg-gray-100 text-gray-800',
        default: 'bg-gray-100 text-gray-800'
      },
      ECO: {
        COMPLETED: 'bg-green-100 text-green-800',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800',
        REVIEW: 'bg-orange-100 text-orange-800',
        BACKLOG: 'bg-gray-100 text-gray-800',
        default: 'bg-gray-100 text-gray-800'
      },
      ECN: {
        EFFECTIVE: 'bg-green-100 text-green-800',
        DISTRIBUTED: 'bg-blue-100 text-blue-800',
        APPROVED: 'bg-yellow-100 text-yellow-800',
        PENDING_APPROVAL: 'bg-orange-100 text-orange-800',
        DRAFT: 'bg-gray-100 text-gray-800',
        default: 'bg-gray-100 text-gray-800'
      }
    };
    return colors[type][status] || colors[type].default;
  };

  return (
    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(status, type)}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function ECNTraceabilityPage({ params }: { params: Promise<{ ecn: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [ecnNumber, setEcnNumber] = useState<string>('');
  const [data, setData] = useState<TraceabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const decodedEcnNumber = decodeURIComponent(resolvedParams.ecn);
        setEcnNumber(decodedEcnNumber);
        
        const response = await fetch(`/api/traceability/${encodeURIComponent(decodedEcnNumber)}`);
        
        if (response.ok) {
          const traceabilityData = await response.json();
          setData(traceabilityData);
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          setError(errorData.error || 'Failed to fetch traceability data');
        }
      } catch (error) {
        console.error('Error fetching traceability data:', error);
        setError('Failed to load traceability data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [params]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Traceability: {ecnNumber}</h1>
          <Link
            href="/dashboard/traceability"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Search
          </Link>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
          <p className="text-red-700">{error || 'No data found for this number'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Traceability: {ecnNumber}</h1>
          <p className="text-gray-600 mt-2">Complete change history and relationships</p>
        </div>
        <div className="flex space-x-3">
          <Link
            href="/dashboard/traceability"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            ← Back to Search
          </Link>
          {data.ecn && (
            <Link
              href={`/dashboard/ecn/${data.ecn.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              View ECN Details
            </Link>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* ECN Overview */}
        {data.ecn && (
          <DetailCard title="Engineering Change Notice">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-purple-600">{data.ecn.ecnNumber}</span>
                <StatusBadge status={data.ecn.status} type="ECN" />
              </div>
              <h4 className="font-medium text-gray-900">{data.ecn.title}</h4>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Submitted by:</span> {data.ecn.submitter.name}</p>
                {data.ecn.assignee && (
                  <p><span className="font-medium">Assigned to:</span> {data.ecn.assignee.name}</p>
                )}
                <p><span className="font-medium">Created:</span> {formatDate(data.ecn.createdAt)}</p>
                {data.ecn.effectiveDate && (
                  <p><span className="font-medium">Effective:</span> {formatDate(data.ecn.effectiveDate)}</p>
                )}
              </div>
            </div>
          </DetailCard>
        )}

        {/* ECO Overview */}
        {data.eco && (
          <DetailCard title="Parent Engineering Change Order">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-green-600">{data.eco.ecoNumber}</span>
                <StatusBadge status={data.eco.status} type="ECO" />
              </div>
              <h4 className="font-medium text-gray-900">{data.eco.title}</h4>
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Submitted by:</span> {data.eco.submitter.name}</p>
                {data.eco.assignee && (
                  <p><span className="font-medium">Assigned to:</span> {data.eco.assignee.name}</p>
                )}
                <p><span className="font-medium">Priority:</span> {data.eco.priority}</p>
                <p><span className="font-medium">Created:</span> {formatDate(data.eco.createdAt)}</p>
                {data.eco.completedAt && (
                  <p><span className="font-medium">Completed:</span> {formatDate(data.eco.completedAt)}</p>
                )}
              </div>
            </div>
          </DetailCard>
        )}

        {/* ECRs Overview */}
        <DetailCard title="Original Change Requests">
          <div className="space-y-3">
            <div className="text-lg font-bold text-blue-600">{data.ecrs.length} ECR{data.ecrs.length !== 1 ? 's' : ''}</div>
            <div className="space-y-2">
              {data.ecrs.slice(0, 3).map((ecr) => (
                <div key={ecr.id} className="text-sm">
                  <div className="flex justify-between items-center">
                    <Link 
                      href={`/dashboard/ecr/${ecr.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {ecr.ecrNumber}
                    </Link>
                    <StatusBadge status={ecr.status} type="ECR" />
                  </div>
                  <p className="text-gray-600 text-xs truncate">{ecr.title}</p>
                </div>
              ))}
              {data.ecrs.length > 3 && (
                <p className="text-xs text-gray-500">+{data.ecrs.length - 3} more ECRs</p>
              )}
            </div>
          </div>
        </DetailCard>
      </div>

      {/* ECN Details */}
      {data.ecn && (
        <DetailCard title="Engineering Change Notice Details">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900 mt-1">{data.ecn.description}</p>
              </div>
              
              {data.ecn.changesImplemented && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Changes Implemented</label>
                  <p className="text-gray-900 mt-1">{data.ecn.changesImplemented}</p>
                </div>
              )}
              
              {data.ecn.affectedItems && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Affected Items</label>
                  <p className="text-gray-900 mt-1">{data.ecn.affectedItems}</p>
                </div>
              )}
            </div>
            
            <div className="space-y-4">
              {data.ecn.dispositionInstructions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Disposition Instructions</label>
                  <p className="text-gray-900 mt-1">{data.ecn.dispositionInstructions}</p>
                </div>
              )}
              
              {data.ecn.verificationMethod && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Verification Method</label>
                  <p className="text-gray-900 mt-1">{data.ecn.verificationMethod}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                {data.ecn.distributedAt && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Distributed</label>
                    <p className="text-gray-900 mt-1">{formatDate(data.ecn.distributedAt)}</p>
                  </div>
                )}
                {data.ecn.effectiveDate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                    <p className="text-gray-900 mt-1">{formatDate(data.ecn.effectiveDate)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </DetailCard>
      )}

      {/* All ECRs */}
      <DetailCard title="All Original Change Requests">
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
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.ecrs.map((ecr) => (
                <tr key={ecr.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/dashboard/ecr/${ecr.id}`} className="text-blue-600 hover:text-blue-800">
                      {ecr.ecrNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{ecr.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={ecr.status} type="ECR" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecr.urgency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {ecr.submitter.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(ecr.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DetailCard>

      {/* Timeline */}
      <DetailCard title="Complete Timeline & Approvals">
        <div className="space-y-4">
          {data.timeline.map((event, index) => {
            const getEventColor = (type: string) => {
              if (type.includes('CREATED')) return 'bg-blue-100 text-blue-800 border-blue-200';
              if (type.includes('SUBMITTED')) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
              if (type.includes('APPROVED')) return 'bg-green-100 text-green-800 border-green-200';
              if (type.includes('REJECTED')) return 'bg-red-100 text-red-800 border-red-200';
              if (type.includes('COMPLETED')) return 'bg-green-100 text-green-800 border-green-200';
              if (type.includes('DISTRIBUTED')) return 'bg-blue-100 text-blue-800 border-blue-200';
              if (type.includes('EFFECTIVE')) return 'bg-purple-100 text-purple-800 border-purple-200';
              return 'bg-gray-100 text-gray-800 border-gray-200';
            };

            return (
              <div key={index} className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-medium ${getEventColor(event.type)}`}>
                    {event.recordType}
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{event.title}</p>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getEventColor(event.type)}`}>
                      {event.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{event.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-500">
                      {formatDateTime(event.date)}
                    </div>
                    {event.user && (
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">{event.recordNumber}</span> by {event.user.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DetailCard>
    </div>
  );
}