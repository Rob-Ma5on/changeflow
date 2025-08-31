'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import WorkflowBreadcrumbs from '@/components/WorkflowBreadcrumbs';
import RevisionHistory from '@/components/RevisionHistory';

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  description: string;
  reason: string;
  status: string;
  urgency: string;
  priority: string;
  customerImpact: string;
  estimatedCostRange?: string;
  targetImplementationDate?: string;
  stakeholders?: string;
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  approver?: { id: string; name: string; email: string };
  organization: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  costImpact?: number;
  scheduleImpact?: string;
  affectedProducts?: string;
  affectedDocuments?: string;
  implementationPlan?: string;
  eco?: {
    id: string;
    ecoNumber: string;
    title: string;
    status: string;
    createdAt: string;
    completedAt?: string;
    ecns: Array<{
      id: string;
      ecnNumber: string;
      title: string;
      status: string;
    }>;
  };
  revisions?: Array<{
    id: string;
    changedAt: string;
    revisionNote?: string;
    previousData: any;
    newData: any;
    changedFields: string[];
    user: {
      id: string;
      name: string;
      email: string;
    };
  }>;
}

export default function ECRDetailPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const params = useParams();
  const [ecr, setEcr] = useState<ECR | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ECR>>({});
  const [originalData, setOriginalData] = useState<ECR | null>(null);

  useEffect(() => {
    const fetchECR = async () => {
      try {
        const response = await fetch(`/api/ecr/${params.id}`);
        if (response.ok) {
          const ecrData = await response.json();
          setEcr(ecrData);
        } else {
          setError('ECR not found');
        }
      } catch (error) {
        console.error('Error fetching ECR:', error);
        setError('Failed to load ECR');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchECR();
    }
  }, [params.id]);

  const updateECRStatus = async (newStatus: string) => {
    if (!ecr) return;
    
    setUpdating(true);
    try {
      const response = await fetch(`/api/ecr/${ecr.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        const updatedEcr = await response.json();
        setEcr(updatedEcr);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update ECR status');
      }
    } catch (error) {
      console.error('Error updating ECR status:', error);
      setError('An error occurred while updating the ECR');
    } finally {
      setUpdating(false);
    }
  };

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
    return { className: `${config.bg} ${config.text}`, label: config.label };
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

  const getCustomerImpactBadge = (impact: string) => {
    const impactConfig = {
      NO_IMPACT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'No Impact' },
      INDIRECT_IMPACT: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Indirect Impact' },
      DIRECT_IMPACT: { bg: 'bg-red-100', text: 'text-red-800', label: 'Direct Impact' }
    };
    const config = impactConfig[impact as keyof typeof impactConfig] || impactConfig.NO_IMPACT;
    return { className: `${config.bg} ${config.text}`, label: config.label };
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Edit mode functions
  const handleEdit = () => {
    if (!ecr) return;
    setOriginalData({ ...ecr });
    setEditedData({ ...ecr });
    setIsEditing(true);
    setError('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedData({});
    setOriginalData(null);
    setError('');
  };

  const handleSave = async () => {
    if (!ecr || !editedData) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await fetch(`/api/ecr/${ecr.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (response.ok) {
        const updatedEcr = await response.json();
        setEcr(updatedEcr);
        setIsEditing(false);
        setEditedData({});
        setOriginalData(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving ECR:', error);
      setError('An error occurred while saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const canEdit = ecr && !['APPROVED', 'REJECTED', 'IMPLEMENTED', 'CANCELLED'].includes(ecr.status);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !ecr) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">Error</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <div className="mt-6">
          <Link
            href="/dashboard/ecr"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Back to ECRs
          </Link>
        </div>
      </div>
    );
  }

  const statusBadge = getStatusBadge(ecr.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Workflow Breadcrumbs */}
      {ecr.eco && (
        <WorkflowBreadcrumbs
          currentStep="ECR"
          ecr={{
            id: ecr.id,
            ecrNumber: ecr.ecrNumber,
            title: ecr.title
          }}
          eco={{
            id: ecr.eco.id,
            ecoNumber: ecr.eco.ecoNumber,
            title: ecr.eco.title
          }}
          ecn={ecr.eco.ecns?.[0] ? {
            id: ecr.eco.ecns[0].id,
            ecnNumber: ecr.eco.ecns[0].ecnNumber,
            title: ecr.eco.ecns[0].title
          } : undefined}
        />
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{ecr.ecrNumber}</h1>
          <p className="text-gray-600 mt-2">{ecr.title}</p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Edit Mode Buttons */}
          {canEdit && !isEditing && (
            <button
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
          
          {isEditing && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Save
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-700 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </button>
            </>
          )}
          
          {/* Next Step Button - disabled during edit mode */}
          {ecr.status === 'APPROVED' && !isEditing && (
            <Link
              href={`/dashboard/eco/new?ecrId=${ecr.id}`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Convert to ECO
            </Link>
          )}
          <Link
            href="/dashboard/ecr"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to ECRs
          </Link>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-amber-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-amber-800">Editing Mode</h3>
              <p className="text-sm text-amber-700 mt-1">
                Changes are not saved yet. Click Save to apply changes or Cancel to discard them.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Status and Actions */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Status</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusBadge.className}`}>
                {statusBadge.label}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getPriorityBadge(ecr.priority || ecr.urgency)}`}>
                {ecr.priority || ecr.urgency}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Impact</label>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCustomerImpactBadge(ecr.customerImpact || 'NO_IMPACT').className}`}>
                {getCustomerImpactBadge(ecr.customerImpact || 'NO_IMPACT').label}
              </span>
            </div>
          </div>
          
          {/* Status Change Actions - disabled during edit mode */}
          {!isEditing && (
            <div className="flex space-x-2">
              {ecr.status === 'DRAFT' && (
              <button
                onClick={() => updateECRStatus('SUBMITTED')}
                disabled={updating}
                className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
              >
                Submit for Review
              </button>
            )}
            {ecr.status === 'SUBMITTED' && (
              <>
                <button
                  onClick={() => updateECRStatus('UNDER_REVIEW')}
                  disabled={updating}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
                >
                  Start Review
                </button>
              </>
            )}
            {ecr.status === 'UNDER_REVIEW' && (
              <>
                <button
                  onClick={() => updateECRStatus('APPROVED')}
                  disabled={updating}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => updateECRStatus('REJECTED')}
                  disabled={updating}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  ✗ Reject
                </button>
              </>
            )}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
      </div>

      {/* ECR Details */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">ECR Details</h3>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Title {isEditing && <span className="text-red-500">*</span>}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.title || ''}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Brief descriptive title for the change request"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.title}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description {isEditing && <span className="text-red-500">*</span>}
                </label>
                {isEditing ? (
                  <textarea
                    value={editedData.description || ''}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Detailed description of the proposed change"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.description}</p>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Business Justification {isEditing && <span className="text-red-500">*</span>}
                </label>
                {isEditing ? (
                  <textarea
                    value={editedData.reason || ''}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Explain why this change is needed and its business benefits"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.reason}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priority {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <select
                      value={editedData.priority || ecr.priority || ecr.urgency}
                      onChange={(e) => handleInputChange('priority', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityBadge(ecr.priority || ecr.urgency)}`}>
                        {ecr.priority || ecr.urgency}
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Customer Impact {isEditing && <span className="text-red-500">*</span>}
                  </label>
                  {isEditing ? (
                    <select
                      value={editedData.customerImpact || ecr.customerImpact || 'NO_IMPACT'}
                      onChange={(e) => handleInputChange('customerImpact', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="NO_IMPACT">No Impact</option>
                      <option value="INDIRECT_IMPACT">Indirect Impact</option>
                      <option value="DIRECT_IMPACT">Direct Impact</option>
                    </select>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCustomerImpactBadge(ecr.customerImpact || 'NO_IMPACT').className}`}>
                        {getCustomerImpactBadge(ecr.customerImpact || 'NO_IMPACT').label}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Impact Assessment */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Impact Assessment</h4>
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Cost Range</label>
                  {isEditing ? (
                    <select
                      value={editedData.estimatedCostRange || ecr.estimatedCostRange || ''}
                      onChange={(e) => handleInputChange('estimatedCostRange', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select range...</option>
                      <option value="UNDER_1K">&lt;$1K</option>
                      <option value="FROM_1K_TO_10K">$1K-$10K</option>
                      <option value="FROM_10K_TO_50K">$10K-$50K</option>
                      <option value="FROM_50K_TO_100K">$50K-$100K</option>
                      <option value="OVER_100K">&gt;$100K</option>
                    </select>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.estimatedCostRange || 'N/A'}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estimated Cost (USD)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={editedData.costImpact || ''}
                      onChange={(e) => handleInputChange('costImpact', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="0.00"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{formatCurrency(ecr.costImpact)}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Target Implementation Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formatDateForInput(editedData.targetImplementationDate) || formatDateForInput(ecr.targetImplementationDate)}
                      onChange={(e) => handleInputChange('targetImplementationDate', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {ecr.targetImplementationDate ? new Date(ecr.targetImplementationDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Schedule Impact</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.scheduleImpact || ecr.scheduleImpact || ''}
                      onChange={(e) => handleInputChange('scheduleImpact', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Describe any schedule impacts"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.scheduleImpact || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stakeholders</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.stakeholders || ecr.stakeholders || ''}
                    onChange={(e) => handleInputChange('stakeholders', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="List key stakeholders who should be involved or notified"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.stakeholders || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Affected Products</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.affectedProducts || ecr.affectedProducts || ''}
                      onChange={(e) => handleInputChange('affectedProducts', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="List products that will be affected by this change"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.affectedProducts || 'N/A'}</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Affected Documents</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.affectedDocuments || ecr.affectedDocuments || ''}
                      onChange={(e) => handleInputChange('affectedDocuments', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="List drawings, specifications, or other documents that need updates"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.affectedDocuments || 'N/A'}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Plan */}
          {(ecr.implementationPlan || isEditing) && (
            <div>
              <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Implementation Plan</h4>
              {isEditing ? (
                <textarea
                  value={editedData.implementationPlan || ecr.implementationPlan || ''}
                  onChange={(e) => handleInputChange('implementationPlan', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="High-level plan for implementing this change"
                />
              ) : (
                <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.implementationPlan}</p>
                </div>
              )}
            </div>
          )}

          {/* People and Dates */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">People & Dates</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Submitter</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.submitter.name}</p>
                  <p className="text-xs text-gray-500">{ecr.submitter.email}</p>
                </div>
              </div>
              {ecr.assignee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assignee</label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.assignee.name}</p>
                    <p className="text-xs text-gray-500">{ecr.assignee.email}</p>
                  </div>
                </div>
              )}
              {ecr.approver && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Approver</label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecr.approver.name}</p>
                    <p className="text-xs text-gray-500">{ecr.approver.email}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(ecr.createdAt)}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(ecr.updatedAt)}</p>
                </div>
              </div>
              {ecr.approvedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Approved</label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{formatDate(ecr.approvedAt)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Traceability Chain */}
      {ecr.eco && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Traceability Chain</h3>
            <p className="text-sm text-gray-600 mt-1">Track this ECR through the change management workflow</p>
          </div>
          
          <div className="p-6">
            {/* Current ECR */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 text-center min-w-[200px]">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-lg">📝</span>
                  <span className="font-bold text-blue-600">{ecr.ecrNumber}</span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{ecr.title}</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(ecr.status).className}`}>
                    {getStatusBadge(ecr.status).label}
                  </span>
                </div>
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center mb-4">
              <div className="text-gray-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>

            {/* Linked ECO */}
            <div className="flex items-center justify-center mb-8">
              <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4 text-center min-w-[200px]">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <span className="text-lg">🔧</span>
                  <Link
                    href={`/dashboard/eco/${ecr.eco.id}`}
                    className="font-bold text-yellow-600 hover:text-yellow-800"
                  >
                    {ecr.eco.ecoNumber}
                  </Link>
                </div>
                <p className="text-sm text-gray-600 mb-2">{ecr.eco.title}</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    ecr.eco.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                    ecr.eco.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-800' :
                    ecr.eco.status === 'TESTING' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {ecr.eco.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Created: {new Date(ecr.eco.createdAt).toLocaleDateString()}
                </p>
                {ecr.eco.completedAt && (
                  <p className="text-xs text-gray-500">
                    Completed: {new Date(ecr.eco.completedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            {/* ECNs if any */}
            {ecr.eco.ecns.length > 0 && (
              <>
                {/* Arrow Down */}
                <div className="flex justify-center mb-4">
                  <div className="text-gray-400">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  </div>
                </div>

                {/* Generated ECNs */}
                <div className="flex flex-wrap justify-center gap-4">
                  {ecr.eco.ecns.map((ecn) => (
                    <div key={ecn.id} className="bg-green-50 border border-green-200 rounded-lg p-4 text-center min-w-[180px]">
                      <div className="flex items-center justify-center space-x-2 mb-2">
                        <span className="text-lg">📢</span>
                        <Link
                          href={`/dashboard/ecn/${ecn.id}`}
                          className="font-bold text-green-600 hover:text-green-800"
                        >
                          {ecn.ecnNumber}
                        </Link>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{ecn.title}</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        ecn.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                        ecn.status === 'DISTRIBUTED' ? 'bg-blue-100 text-blue-800' :
                        ecn.status === 'PENDING_APPROVAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {ecn.status.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Quick Actions */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
              <div className="flex justify-center space-x-4">
                <Link
                  href="/dashboard/traceability"
                  className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Full Traceability Search
                </Link>
                <Link
                  href={`/dashboard/eco/${ecr.eco.id}`}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  View ECO Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ECO Conversion Status Messages */}
      {!ecr.eco && (
        <>
          {ecr.status === 'APPROVED' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Ready for ECO Conversion</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    This ECR is approved and ready to be bundled into an ECO for implementation.
                  </p>
                  <Link
                    href={`/dashboard/eco/new?ecrId=${ecr.id}`}
                    className="mt-2 inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    Convert to ECO →
                  </Link>
                </div>
              </div>
            </div>
          )}

          {(ecr.status === 'DRAFT' || ecr.status === 'SUBMITTED') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-amber-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.664-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Approval Required</h3>
                  <p className="text-sm text-amber-700 mt-1">
                    ECR must be approved before converting to ECO.
                  </p>
                </div>
              </div>
            </div>
          )}

          {ecr.status === 'REJECTED' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Cannot Convert to ECO</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Rejected ECRs cannot be converted to ECO.
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {ecr.eco && ecr.status === 'IMPLEMENTED' && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">Already Linked to ECO</h3>
              <p className="text-sm text-green-700 mt-1">
                ECR already linked to {ecr.eco.ecoNumber} and marked as implemented.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Revision History */}
      <RevisionHistory revisions={ecr.revisions || []} entityType="ECR" />
    </div>
  );
}