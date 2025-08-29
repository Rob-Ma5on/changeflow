'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';
import WorkflowBreadcrumbs from '@/components/WorkflowBreadcrumbs';

interface ECO {
  id: string;
  ecoNumber: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  approver?: { id: string; name: string; email: string };
  organization: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  targetDate?: string;
  completedAt?: string;
  implementationPlan?: string;
  testingPlan?: string;
  rollbackPlan?: string;
  ecrs: Array<{
    id: string;
    ecrNumber: string;
    title: string;
    description: string;
    submitter: { name: string };
  }>;
  ecns: Array<{
    id: string;
    ecnNumber: string;
    title: string;
    status: string;
  }>;
}

export default function ECODetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession();
  const router = useRouter();
  const [eco, setEco] = useState<ECO | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const fetchECO = async () => {
      try {
        const resolvedParams = await params;
        const response = await fetch(`/api/eco/${resolvedParams.id}`);
        if (response.ok) {
          const ecoData = await response.json();
          setEco(ecoData);
        } else {
          console.error('Failed to fetch ECO');
        }
      } catch (error) {
        console.error('Error fetching ECO:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECO();
  }, [params]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!eco) return;
    
    setUpdating(true);
    try {
      const updateData: { status: string; completedAt?: string } = { status: newStatus };
      
      // Auto-set completedAt if moving to COMPLETED
      if (newStatus === 'COMPLETED') {
        updateData.completedAt = new Date().toISOString();
      }
      
      const response = await fetch(`/api/eco/${eco.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedEco = await response.json();
        setEco(updatedEco);
        setToastMessage(`ECO status updated to ${newStatus}`);
        setToastType('success');
        setShowToast(true);
      } else {
        setToastMessage('Failed to update ECO status');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error updating ECO:', error);
      setToastMessage('Failed to update ECO status');
      setToastType('error');
      setShowToast(true);
    } finally {
      setUpdating(false);
    }
  };

  const handleGenerateECN = () => {
    if (!eco || eco.status !== 'COMPLETED') return;
    router.push(`/dashboard/ecn/new?ecoId=${eco.id}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      BACKLOG: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Backlog' },
      IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Progress' },
      TESTING: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Testing' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completed' },
      CANCELLED: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' }
    };
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.DRAFT;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      LOW: { bg: 'bg-green-100', text: 'text-green-800' },
      MEDIUM: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
      HIGH: { bg: 'bg-orange-100', text: 'text-orange-800' },
      CRITICAL: { bg: 'bg-red-100', text: 'text-red-800' }
    };
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.MEDIUM;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
        {priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!eco) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">ECO Not Found</h2>
          <Link
            href="/dashboard/eco"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to ECOs
          </Link>
        </div>
      </div>
    );
  }

  const canGenerateECN = eco.status === 'COMPLETED' && eco.ecns.length === 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Workflow Breadcrumbs */}
      {eco.ecrs.length > 0 && (
        <WorkflowBreadcrumbs
          currentStep="ECO"
          ecr={eco.ecrs.length === 1 ? {
            id: eco.ecrs[0].id,
            ecrNumber: eco.ecrs[0].ecrNumber,
            title: eco.ecrs[0].title
          } : undefined}
          eco={{
            id: eco.id,
            ecoNumber: eco.ecoNumber,
            title: eco.title
          }}
          ecn={eco.ecns.length > 0 ? {
            id: eco.ecns[0].id,
            ecnNumber: eco.ecns[0].ecnNumber,
            title: eco.ecns[0].title
          } : undefined}
        />
      )}

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/dashboard/eco"
              className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
            >
              ← Back to ECOs
            </Link>
            <h1 className="text-3xl font-bold text-gray-900">{eco.ecoNumber}</h1>
            <p className="text-gray-600 mt-2">{eco.title}</p>
          </div>
          <div className="flex items-center space-x-4">
            {canGenerateECN && (
              <button
                onClick={handleGenerateECN}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Generate ECN
              </button>
            )}
            {getStatusBadge(eco.status)}
            {getPriorityBadge(eco.priority)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ECO Details */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">ECO Details</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Description</label>
              <p className="mt-1 text-gray-900">{eco.description}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Submitter</label>
              <p className="mt-1 text-gray-900">{eco.submitter.name}</p>
            </div>
            {eco.assignee && (
              <div>
                <label className="text-sm font-medium text-gray-500">Assignee</label>
                <p className="mt-1 text-gray-900">{eco.assignee.name}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-500">Created</label>
              <p className="mt-1 text-gray-900">{new Date(eco.createdAt).toLocaleDateString()}</p>
            </div>
            {eco.targetDate && (
              <div>
                <label className="text-sm font-medium text-gray-500">Target Date</label>
                <p className="mt-1 text-gray-900">{new Date(eco.targetDate).toLocaleDateString()}</p>
              </div>
            )}
            {eco.completedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500">Completed</label>
                <p className="mt-1 text-gray-900">{new Date(eco.completedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>

          {/* Status Update */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="text-sm font-medium text-gray-500">Update Status</label>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {['BACKLOG', 'IN_PROGRESS', 'TESTING', 'COMPLETED'].map((status) => (
                <button
                  key={status}
                  onClick={() => handleStatusUpdate(status)}
                  disabled={updating || eco.status === status}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    eco.status === status
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {status.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Linked ECRs */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Linked ECRs ({eco.ecrs.length})</h2>
          {eco.ecrs.length > 0 ? (
            <div className="space-y-3">
              {eco.ecrs.map((ecr) => (
                <div key={ecr.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Link
                        href={`/dashboard/ecr/${ecr.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800"
                      >
                        {ecr.ecrNumber}
                      </Link>
                      <p className="text-sm text-gray-600 mt-1">{ecr.title}</p>
                      <p className="text-xs text-gray-500">Submitted by {ecr.submitter.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 italic">No ECRs linked to this ECO</p>
          )}
        </div>
      </div>

      {/* Generated ECNs */}
      {eco.ecns.length > 0 && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Generated ECNs ({eco.ecns.length})</h2>
          <div className="space-y-3">
            {eco.ecns.map((ecn) => (
              <div key={ecn.id} className="border border-gray-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Link
                      href={`/dashboard/ecn/${ecn.id}`}
                      className="font-medium text-blue-600 hover:text-blue-800"
                    >
                      {ecn.ecnNumber}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">{ecn.title}</p>
                  </div>
                  {getStatusBadge(ecn.status)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ECN Generation Status Messages */}
      {!canGenerateECN && (
        <>
          {eco.status !== 'COMPLETED' && eco.status !== 'CANCELLED' && (
            <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-amber-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-amber-800">ECN Generation Not Available</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    Complete ECO implementation before generating ECN.
                  </p>
                </div>
              </div>
            </div>
          )}

          {eco.status === 'CANCELLED' && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Cannot Generate ECN</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Cancelled ECOs cannot generate ECNs.
                  </p>
                </div>
              </div>
            </div>
          )}

          {eco.status === 'COMPLETED' && eco.ecns.length > 0 && (
            <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-green-800">ECN Already Generated</h3>
                  <p className="text-sm text-green-700 mt-1">
                    ECN has already been generated for this completed ECO.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {canGenerateECN && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="text-sm font-medium text-blue-800">Ready to Generate ECN</h3>
                <p className="text-sm text-blue-700 mt-1">
                  ECO is completed and ready for formal change notification.
                </p>
              </div>
              <button
                onClick={handleGenerateECN}
                className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Generate ECN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Implementation Plan */}
      {eco.implementationPlan && (
        <div className="mt-8 bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Implementation Plan</h2>
          <p className="text-gray-700 whitespace-pre-wrap">{eco.implementationPlan}</p>
        </div>
      )}

      <Toast
        message={toastMessage}
        type={toastType}
        isVisible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}