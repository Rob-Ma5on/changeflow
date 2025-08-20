'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

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

function VisualTreeView({ data }: { data: TraceabilityData }) {
  const getStatusColor = (status: string, type: 'ECR' | 'ECO' | 'ECN') => {
    const colors = {
      ECR: {
        APPROVED: 'bg-green-100 text-green-800 border-green-200',
        CONVERTED: 'bg-blue-100 text-blue-800 border-blue-200',
        REJECTED: 'bg-red-100 text-red-800 border-red-200',
        default: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      ECO: {
        COMPLETED: 'bg-green-100 text-green-800 border-green-200',
        IN_PROGRESS: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        BACKLOG: 'bg-gray-100 text-gray-800 border-gray-200',
        default: 'bg-gray-100 text-gray-800 border-gray-200'
      },
      ECN: {
        EFFECTIVE: 'bg-green-100 text-green-800 border-green-200',
        DISTRIBUTED: 'bg-blue-100 text-blue-800 border-blue-200',
        APPROVED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        default: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    };
    return colors[type][status] || colors[type].default;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Traceability Tree</h3>
      
      <div className="flex flex-col items-center space-y-8">
        {/* ECN Level */}
        {data.ecn && (
          <div className="relative">
            <div className={`px-6 py-4 rounded-lg border-2 ${getStatusColor(data.ecn.status, 'ECN')} max-w-md`}>
              <div className="text-center">
                <div className="text-sm font-medium text-purple-600 mb-1">Engineering Change Notice</div>
                <Link 
                  href={`/dashboard/ecn/${data.ecn.id}`}
                  className="text-lg font-bold hover:underline"
                >
                  {data.ecn.ecnNumber}
                </Link>
                <div className="text-sm text-gray-600 mt-1">{data.ecn.title}</div>
                <div className="text-xs text-gray-500 mt-2">
                  Status: {data.ecn.status.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  Created: {formatDate(data.ecn.createdAt)}
                </div>
                {data.ecn.effectiveDate && (
                  <div className="text-xs text-gray-500">
                    Effective: {formatDate(data.ecn.effectiveDate)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Arrow down to ECO */}
            {data.eco && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* ECO Level */}
        {data.eco && (
          <div className="relative">
            <div className={`px-6 py-4 rounded-lg border-2 ${getStatusColor(data.eco.status, 'ECO')} max-w-md`}>
              <div className="text-center">
                <div className="text-sm font-medium text-green-600 mb-1">Engineering Change Order</div>
                <Link 
                  href={`/dashboard/eco`}
                  className="text-lg font-bold hover:underline"
                >
                  {data.eco.ecoNumber}
                </Link>
                <div className="text-sm text-gray-600 mt-1">{data.eco.title}</div>
                <div className="text-xs text-gray-500 mt-2">
                  Status: {data.eco.status.replace('_', ' ')}
                </div>
                <div className="text-xs text-gray-500">
                  Priority: {data.eco.priority}
                </div>
                <div className="text-xs text-gray-500">
                  Created: {formatDate(data.eco.createdAt)}
                </div>
                {data.eco.completedAt && (
                  <div className="text-xs text-gray-500">
                    Completed: {formatDate(data.eco.completedAt)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Arrow down to ECRs */}
            {data.ecrs.length > 0 && (
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            )}
          </div>
        )}

        {/* ECRs Level */}
        {data.ecrs.length > 0 && (
          <div className="relative">
            <div className="text-sm font-medium text-blue-600 mb-4 text-center">
              Engineering Change Requests ({data.ecrs.length})
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
              {data.ecrs.map((ecr) => (
                <div key={ecr.id} className={`px-4 py-3 rounded-lg border ${getStatusColor(ecr.status, 'ECR')}`}>
                  <div className="text-center">
                    <Link 
                      href={`/dashboard/ecr/${ecr.id}`}
                      className="text-sm font-bold hover:underline"
                    >
                      {ecr.ecrNumber}
                    </Link>
                    <div className="text-xs text-gray-600 mt-1 truncate">{ecr.title}</div>
                    <div className="text-xs text-gray-500 mt-2">
                      Status: {ecr.status.replace('_', ' ')}
                    </div>
                    <div className="text-xs text-gray-500">
                      Urgency: {ecr.urgency}
                    </div>
                    <div className="text-xs text-gray-500">
                      By: {ecr.submitter.name}
                    </div>
                    <div className="text-xs text-gray-500">
                      Created: {formatDate(ecr.createdAt)}
                    </div>
                    {ecr.approvedAt && (
                      <div className="text-xs text-gray-500">
                        Approved: {formatDate(ecr.approvedAt)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Timeline({ events }: { events: TimelineEvent[] }) {
  const getEventColor = (type: string) => {
    if (type.includes('CREATED')) return 'bg-blue-100 text-blue-800';
    if (type.includes('SUBMITTED')) return 'bg-yellow-100 text-yellow-800';
    if (type.includes('APPROVED')) return 'bg-green-100 text-green-800';
    if (type.includes('REJECTED')) return 'bg-red-100 text-red-800';
    if (type.includes('COMPLETED')) return 'bg-green-100 text-green-800';
    if (type.includes('DISTRIBUTED')) return 'bg-blue-100 text-blue-800';
    if (type.includes('EFFECTIVE')) return 'bg-purple-100 text-purple-800';
    return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Complete Timeline</h3>
      
      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${getEventColor(event.type)}`}>
                {event.recordType.charAt(0)}
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
                    by {event.user.name}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function TraceabilityPage() {
  const { data: session } = useSession();
  const [searchNumber, setSearchNumber] = useState('');
  const [data, setData] = useState<TraceabilityData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!searchNumber.trim()) {
      setError('Please enter an ECR, ECO, or ECN number');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`/api/traceability/${encodeURIComponent(searchNumber.trim())}`);
      
      if (response.ok) {
        const traceabilityData = await response.json();
        setData(traceabilityData);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        setError(errorData.error || 'Failed to fetch traceability data');
        setData(null);
      }
    } catch (error) {
      console.error('Error searching traceability:', error);
      setError('Network error occurred');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Traceability</h1>
          <p className="text-gray-600 mt-2">
            Track complete history from ECRs through ECOs to ECNs
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="max-w-md">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            Search by Number
          </label>
          <p className="text-xs text-gray-500 mb-3">
            Enter any ECR, ECO, or ECN number to see the complete chain
          </p>
          <div className="flex space-x-3">
            <input
              type="text"
              id="search"
              placeholder="e.g., ECR-2025-001, ECO-2025-001, ECN-2025-001"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              value={searchNumber}
              onChange={(e) => setSearchNumber(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-2">{error}</p>
          )}
        </div>
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Traceability Chain Found
            </h3>
            <div className="text-sm text-blue-700">
              <p>
                <span className="font-medium">Search started from:</span> {data.type} ({searchNumber})
              </p>
              <div className="mt-2 grid grid-cols-3 gap-4">
                <div>
                  <span className="font-medium">ECRs:</span> {data.ecrs.length}
                </div>
                <div>
                  <span className="font-medium">ECO:</span> {data.eco ? data.eco.ecoNumber : 'None'}
                </div>
                <div>
                  <span className="font-medium">ECN:</span> {data.ecn ? data.ecn.ecnNumber : 'None'}
                </div>
              </div>
            </div>
          </div>

          {/* Visual Tree */}
          <VisualTreeView data={data} />

          {/* Timeline */}
          <Timeline events={data.timeline} />
        </div>
      )}

      {/* Help */}
      {!data && !loading && !error && (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How to Use Traceability</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-medium text-blue-600 mb-2">Search by ECR</h4>
              <p className="text-sm text-gray-600">
                Enter an ECR number to see what ECO it was bundled into and the final ECN that was created.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-green-600 mb-2">Search by ECO</h4>
              <p className="text-sm text-gray-600">
                Enter an ECO number to see all the ECRs it contains and any ECN that was generated from it.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-purple-600 mb-2">Search by ECN</h4>
              <p className="text-sm text-gray-600">
                Enter an ECN number to see the parent ECO and all the original ECRs that led to this change notice.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}