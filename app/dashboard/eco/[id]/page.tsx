'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';
import WorkflowBreadcrumbs from '@/components/WorkflowBreadcrumbs';
import RevisionHistory from '@/components/RevisionHistory';

interface ECO {
  id: string;
  ecoNumber: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'BACKLOG' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  approver?: { id: string; name: string; email: string };
  organization: { id: string; name: string };
  createdAt: string;
  updatedAt: string;
  targetDate?: string;
  completedAt?: string;
  effectiveDate?: string;
  implementationPlan?: string;
  testingPlan?: string;
  rollbackPlan?: string;
  resourcesRequired?: string;
  estimatedEffort?: string;
  effectivityType?: string;
  materialDisposition?: string;
  documentUpdates?: string;
  implementationTeam?: string;
  estimatedTotalCost?: number;
  inventoryImpact?: boolean;
  customerImpact?: string;
  ecrs: Array<{
    id: string;
    ecrNumber: string;
    title: string;
    description: string;
    submitter?: { name: string };
  }>;
  ecns: Array<{
    id: string;
    ecnNumber: string;
    title: string;
    status: string;
  }>;
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

interface User {
  id: string;
  name: string;
  email: string;
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
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ECO & { assigneeId?: string }>>({});
  const [originalData, setOriginalData] = useState<ECO | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

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
          setError('Failed to fetch ECO');
        }
      } catch (error) {
        console.error('Error fetching ECO:', error);
        setError('Error fetching ECO');
      } finally {
        setLoading(false);
      }
    };

    // Fetch users for assignee dropdown
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (response.ok) {
          const usersData = await response.json();
          setUsers(usersData);
        }
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchECO();
    fetchUsers();
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

  const getNextStatus = (currentStatus: ECO['status']): ECO['status'] | null => {
    const statusFlow: Record<ECO['status'], ECO['status'] | null> = {
      'DRAFT': 'SUBMITTED',
      'SUBMITTED': 'APPROVED',
      'APPROVED': 'BACKLOG',
      'BACKLOG': 'IN_PROGRESS',
      'IN_PROGRESS': 'REVIEW',
      'REVIEW': 'COMPLETED',
      'COMPLETED': null,
      'CANCELLED': null
    };
    return statusFlow[currentStatus];
  };

  const getNextStepLabel = (currentStatus: ECO['status']): string => {
    const labels: Record<ECO['status'], string> = {
      'DRAFT': 'Submit for Approval',
      'SUBMITTED': 'Approve ECO',
      'APPROVED': 'Move to Backlog',
      'BACKLOG': 'Start Implementation',
      'IN_PROGRESS': 'Move to Review',
      'REVIEW': 'Mark as Completed',
      'COMPLETED': 'Generate ECN',
      'CANCELLED': ''
    };
    return labels[currentStatus] || '';
  };

  const handleNextStep = async () => {
    if (!eco) return;

    const nextStatus = getNextStatus(eco.status);
    if (nextStatus) {
      await handleStatusUpdate(nextStatus);
    } else if (eco.status === 'COMPLETED') {
      handleGenerateECN();
    }
  };

  const handleGenerateECN = () => {
    if (!eco || eco.status !== 'COMPLETED') return;
    router.push(`/dashboard/ecn/new?ecoId=${eco.id}`);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Draft' },
      SUBMITTED: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Submitted' },
      APPROVED: { bg: 'bg-green-100', text: 'text-green-800', label: 'Approved' },
      BACKLOG: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Backlog' },
      IN_PROGRESS: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'In Progress' },
      REVIEW: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Review' },
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

  // Progress Bar Component
  const WorkflowProgressBar = ({ currentStatus }: { currentStatus: ECO['status'] }) => {
    const steps = [
      { key: 'DRAFT', label: 'Draft' },
      { key: 'SUBMITTED', label: 'Submitted' },
      { key: 'APPROVED', label: 'Approved' },
      { key: 'BACKLOG', label: 'Backlog' },
      { key: 'IN_PROGRESS', label: 'In Progress' },
      { key: 'REVIEW', label: 'Review' },
      { key: 'COMPLETED', label: 'Completed' }
    ];
    
    const getCurrentStepIndex = () => {
      return steps.findIndex(step => step.key === currentStatus);
    };

    const currentIndex = getCurrentStepIndex();

    return (
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isCurrent = index === currentIndex;
            const isUpcoming = index > currentIndex;

            return (
              <div key={step.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium ${
                    isCompleted ? 'bg-green-500 border-green-500 text-white' :
                    isCurrent ? 'bg-blue-500 border-blue-500 text-white' :
                    'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-500 text-gray-500'
                  }`}>
                    {isCompleted ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    isCompleted || isCurrent ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>
      </div>
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

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Edit mode functions
  const handleEdit = () => {
    if (!eco) return;
    setOriginalData({ ...eco });
    setEditedData({ ...eco });
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
    if (!eco || !editedData) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await fetch(`/api/eco/${eco.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (response.ok) {
        const updatedEco = await response.json();
        setEco(updatedEco);
        setIsEditing(false);
        setEditedData({});
        setOriginalData(null);
        setToastMessage('ECO updated successfully');
        setToastType('success');
        setShowToast(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving ECO:', error);
      setError('An error occurred while saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const canEdit = eco && !['COMPLETED', 'CANCELLED'].includes(eco.status);

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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">ECO Not Found</h2>
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{eco.ecoNumber}</h1>
            <p className="text-gray-600 mt-2">{eco.title}</p>
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
            
            <div className="flex items-center space-x-4">
              {getStatusBadge(eco.status)}
              {getPriorityBadge(eco.priority)}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Mode Banner */}
      {isEditing && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
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

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Workflow Progress Bar */}
      {eco.status !== 'CANCELLED' && (
        <WorkflowProgressBar currentStatus={eco.status} />
      )}

      {/* Next Step Button - disabled during edit mode */}
      {eco.status !== 'CANCELLED' && !isEditing && (
        <div className="mb-8">
          {(getNextStatus(eco.status) || eco.status === 'COMPLETED') && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Ready for Next Step</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {eco.status === 'COMPLETED' && canGenerateECN ? 
                      'ECO is completed and ready for formal change notification' :
                      eco.status === 'COMPLETED' && !canGenerateECN ?
                      'ECN has already been generated for this ECO' :
                      `Take the next step to move this ECO forward in the workflow`
                    }
                  </p>
                </div>
                {(getNextStatus(eco.status) || (eco.status === 'COMPLETED' && canGenerateECN)) && (
                  <button
                    onClick={handleNextStep}
                    disabled={updating}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {updating ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        {getNextStepLabel(eco.status)}
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ECO Details */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">ECO Details</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">
                Title {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Brief descriptive title for the change order"
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">{eco.title}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">
                Description {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <textarea
                  value={editedData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Detailed description of the change order"
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">{eco.description}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <div className="mt-1">{getStatusBadge(eco.status)}</div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">
                Priority {isEditing && <span className="text-red-500">*</span>}
              </label>
              {isEditing ? (
                <select
                  value={editedData.priority || eco.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              ) : (
                <div className="mt-1">{getPriorityBadge(eco.priority)}</div>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Material Disposition</label>
              {isEditing ? (
                <select
                  value={editedData.materialDisposition || eco.materialDisposition || ''}
                  onChange={(e) => handleInputChange('materialDisposition', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select disposition...</option>
                  <option value="USE_AS_IS">Use as is</option>
                  <option value="REWORK">Rework</option>
                  <option value="SCRAP">Scrap</option>
                  <option value="RETURN_TO_VENDOR">Return to vendor</option>
                  <option value="SORT_INSPECT">Sort/Inspect</option>
                  <option value="NO_IMPACT">No impact</option>
                </select>
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">{eco.materialDisposition ? eco.materialDisposition.replace('_', ' ') : 'N/A'}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Estimated Total Cost</label>
              {isEditing ? (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedData.estimatedTotalCost || ''}
                  onChange={(e) => handleInputChange('estimatedTotalCost', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="0.00"
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {eco.estimatedTotalCost !== undefined && eco.estimatedTotalCost !== null 
                    ? `$${eco.estimatedTotalCost.toLocaleString()}` 
                    : 'N/A'
                  }
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Inventory Impact</label>
              {isEditing ? (
                <select
                  value={editedData.inventoryImpact !== undefined ? editedData.inventoryImpact.toString() : (eco.inventoryImpact !== undefined ? eco.inventoryImpact.toString() : 'false')}
                  onChange={(e) => handleInputChange('inventoryImpact', e.target.value === 'true')}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              ) : (
                <span className={`mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  eco.inventoryImpact ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {eco.inventoryImpact ? 'Yes' : 'No'}
                </span>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Effectivity Type</label>
              {isEditing ? (
                <select
                  value={editedData.effectivityType || eco.effectivityType || 'DATE_BASED'}
                  onChange={(e) => handleInputChange('effectivityType', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="DATE_BASED">Date Based</option>
                  <option value="IMMEDIATE">Immediate</option>
                </select>
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {eco.effectivityType ? eco.effectivityType.replace('_', ' ') : 'N/A'}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Team & Dates */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Team & Dates</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Submitter</label>
              <div className="mt-1">
                <p className="text-gray-900 dark:text-gray-100">{eco.submitter.name}</p>
                <p className="text-sm text-gray-500">{eco.submitter.email}</p>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Assigned Engineer</label>
              {isEditing ? (
                <select
                  value={editedData.assigneeId || eco.assignee?.id || ''}
                  onChange={(e) => handleInputChange('assigneeId', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Select engineer...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.email})
                    </option>
                  ))}
                </select>
              ) : eco.assignee ? (
                <div className="mt-1">
                  <p className="text-gray-900 dark:text-gray-100">{eco.assignee.name}</p>
                  <p className="text-sm text-gray-500">{eco.assignee.email}</p>
                </div>
              ) : (
                <p className="mt-1 text-gray-500 italic">No engineer assigned</p>
              )}
            </div>
            
            {eco.approver && (
              <div>
                <label className="text-sm font-medium text-gray-500">Approver</label>
                <div className="mt-1">
                  <p className="text-gray-900 dark:text-gray-100">{eco.approver.name}</p>
                  <p className="text-sm text-gray-500">{eco.approver.email}</p>
                </div>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-500">Implementation Team</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.implementationTeam || eco.implementationTeam || ''}
                  onChange={(e) => handleInputChange('implementationTeam', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="List key team members or departments"
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">{eco.implementationTeam || 'N/A'}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Resources Required</label>
              {isEditing ? (
                <textarea
                  value={editedData.resourcesRequired || eco.resourcesRequired || ''}
                  onChange={(e) => handleInputChange('resourcesRequired', e.target.value)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Describe required resources (people, equipment, materials)"
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">{eco.resourcesRequired || 'N/A'}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Estimated Effort</label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedData.estimatedEffort || eco.estimatedEffort || ''}
                  onChange={(e) => handleInputChange('estimatedEffort', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="e.g., 40 hours, 2 weeks, 3 person-days"
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">{eco.estimatedEffort || 'N/A'}</p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Created Date</label>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                {new Date(eco.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Target Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formatDateForInput(editedData.targetDate) || formatDateForInput(eco.targetDate)}
                  onChange={(e) => handleInputChange('targetDate', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {eco.targetDate ? new Date(eco.targetDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Effective Date</label>
              {isEditing ? (
                <input
                  type="date"
                  value={formatDateForInput(editedData.effectiveDate) || formatDateForInput(eco.effectiveDate)}
                  onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {eco.effectiveDate ? new Date(eco.effectiveDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </p>
              )}
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Document Updates</label>
              {isEditing ? (
                <textarea
                  value={editedData.documentUpdates || eco.documentUpdates || ''}
                  onChange={(e) => handleInputChange('documentUpdates', e.target.value)}
                  rows={2}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="List drawings, specifications, or other documents that need updates"
                />
              ) : (
                <p className="mt-1 text-gray-900 dark:text-gray-100">{eco.documentUpdates || 'N/A'}</p>
              )}
            </div>
            
            {eco.completedAt && (
              <div>
                <label className="text-sm font-medium text-gray-500">Completed Date</label>
                <p className="mt-1 text-gray-900 dark:text-gray-100">
                  {new Date(eco.completedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium text-gray-500">Last Updated</label>
              <p className="mt-1 text-gray-900 dark:text-gray-100">
                {new Date(eco.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Linked ECRs */}
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Linked ECRs ({eco.ecrs.length})</h2>
          {eco.ecrs.length > 0 ? (
            <div className="space-y-3">
              {eco.ecrs.map((ecr) => (
                <div key={ecr.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 hover:bg-gray-50 dark:bg-gray-700">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/dashboard/ecr/${ecr.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 block"
                      >
                        {ecr.ecrNumber}
                      </Link>
                      <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">{ecr.title}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        <svg className="inline w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Submitted by {ecr.submitter?.name || 'Unknown'}
                      </p>
                      {ecr.description && (
                        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{ecr.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 italic mt-2">No ECRs linked to this ECO</p>
            </div>
          )}
        </div>
      </div>

      {/* Implementation Details */}
      {(eco.implementationPlan || eco.testingPlan || eco.rollbackPlan || isEditing) && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {(eco.implementationPlan || isEditing) && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Implementation Plan</h2>
              {isEditing ? (
                <textarea
                  value={editedData.implementationPlan || eco.implementationPlan || ''}
                  onChange={(e) => handleInputChange('implementationPlan', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Detailed plan for implementing the change"
                />
              ) : (
                <div className="prose max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{eco.implementationPlan}</p>
                </div>
              )}
            </div>
          )}
          
          {(eco.testingPlan || isEditing) && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Testing Plan</h2>
              {isEditing ? (
                <textarea
                  value={editedData.testingPlan || eco.testingPlan || ''}
                  onChange={(e) => handleInputChange('testingPlan', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Testing procedures and validation steps"
                />
              ) : (
                <div className="prose max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{eco.testingPlan}</p>
                </div>
              )}
            </div>
          )}
          
          {(eco.rollbackPlan || isEditing) && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Rollback Plan</h2>
              {isEditing ? (
                <textarea
                  value={editedData.rollbackPlan || eco.rollbackPlan || ''}
                  onChange={(e) => handleInputChange('rollbackPlan', e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  placeholder="Plan for rolling back changes if needed"
                />
              ) : (
                <div className="prose max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{eco.rollbackPlan}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Generated ECNs */}
      {eco.ecns.length > 0 && (
        <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Generated ECNs ({eco.ecns.length})</h2>
          <div className="space-y-3">
            {eco.ecns.map((ecn) => (
              <div key={ecn.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3">
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

      {/* Revision History */}
      <RevisionHistory revisions={eco.revisions || []} entityType="ECO" />

      <Toast
        message={toastMessage}
        type={toastType}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}