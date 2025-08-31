'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Toast from '@/components/Toast';
import RevisionHistory from '@/components/RevisionHistory';

interface ECNDetail {
  id: string;
  ecnNumber: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DISTRIBUTED' | 'EFFECTIVE' | 'CANCELLED';
  effectiveDate?: string;
  distributedAt?: string;
  createdAt: string;
  updatedAt?: string;
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  changesImplemented?: string;
  affectedItems?: string;
  dispositionInstructions?: string;
  verificationMethod?: string;
  distributionList?: string;
  internalStakeholders?: string;
  customerNotificationRequired?: string;
  notificationMethod?: string;
  responseDeadline?: string;
  implementationStatus?: string;
  actualImplementationDate?: string;
  finalDocumentationSummary?: string;
  closureApprover?: string;
  closureDate?: string;
  acknowledgmentStatus?: string;
  eco?: {
    id: string;
    ecoNumber: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    completedAt?: string;
    submitter: { name: string; email: string };
    assignee?: { name: string; email: string };
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

interface User {
  id: string;
  name: string;
  email: string;
}

export default function ECNDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [ecn, setEcn] = useState<ECNDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [showToast, setShowToast] = useState(false);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ECNDetail & { assigneeId?: string }>>({});
  const [originalData, setOriginalData] = useState<ECNDetail | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchECN = async () => {
      if (!params?.id) return;
      
      try {
        const response = await fetch(`/api/ecn/${params.id}`);
        if (response.ok) {
          const ecnData = await response.json();
          setEcn(ecnData);
        } else {
          console.error('Failed to fetch ECN');
          setError('Failed to fetch ECN');
        }
      } catch (error) {
        console.error('Error fetching ECN:', error);
        setError('Error fetching ECN');
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

    fetchECN();
    fetchUsers();
  }, [params?.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!ecn) return;
    
    setUpdating(true);
    try {
      const updateData: { status: string; distributedAt?: string } = { status: newStatus };
      
      if (newStatus === 'DISTRIBUTED') {
        updateData.distributedAt = new Date().toISOString();
      }
      
      const response = await fetch(`/api/ecn/${ecn.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        const updatedEcn = await response.json();
        setEcn(updatedEcn);
        setToastMessage(`ECN status updated to ${newStatus.replace('_', ' ')}`);
        setToastType('success');
        setShowToast(true);
      } else {
        const errorData = await response.json();
        setToastMessage(errorData.error || 'Failed to update ECN status');
        setToastType('error');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error updating ECN status:', error);
      setToastMessage('An error occurred while updating the ECN');
      setToastType('error');
      setShowToast(true);
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatus = (currentStatus: ECNDetail['status']): ECNDetail['status'] | null => {
    const statusFlow: Record<ECNDetail['status'], ECNDetail['status'] | null> = {
      'DRAFT': 'PENDING_APPROVAL',
      'PENDING_APPROVAL': 'APPROVED',
      'APPROVED': 'DISTRIBUTED',
      'DISTRIBUTED': 'EFFECTIVE',
      'EFFECTIVE': null,
      'CANCELLED': null
    };
    return statusFlow[currentStatus];
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      DRAFT: 'bg-gray-100 text-gray-800',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      DISTRIBUTED: 'bg-purple-100 text-purple-800',
      EFFECTIVE: 'bg-green-100 text-green-800',
      CANCELLED: 'bg-red-100 text-red-800'
    };
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800';
  };

  const formatDateForInput = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Edit mode functions
  const handleEdit = () => {
    if (!ecn) return;
    setOriginalData({ ...ecn });
    setEditedData({ ...ecn });
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
    if (!ecn || !editedData) return;
    
    setIsSaving(true);
    setError('');
    
    try {
      const response = await fetch(`/api/ecn/${ecn.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedData),
      });

      if (response.ok) {
        const updatedEcn = await response.json();
        setEcn(updatedEcn);
        setIsEditing(false);
        setEditedData({});
        setOriginalData(null);
        setToastMessage('ECN updated successfully');
        setToastType('success');
        setShowToast(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to save changes');
      }
    } catch (error) {
      console.error('Error saving ECN:', error);
      setError('An error occurred while saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setEditedData(prev => ({ ...prev, [field]: value }));
  };

  const canEdit = ecn && !['EFFECTIVE', 'CANCELLED'].includes(ecn.status);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ecn) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">ECN could not be found.</p>
      </div>
    );
  }

  const nextStatus = getNextStatus(ecn.status);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <Link
            href="/dashboard/ecn"
            className="text-blue-600 hover:text-blue-800 mb-2 inline-block"
          >
            ← Back to ECNs
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{ecn.ecnNumber}</h1>
          <p className="text-gray-600 mt-2">{ecn.title}</p>
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Status and Actions - disabled during edit mode */}
      {!isEditing && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Current Status</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(ecn.status)}`}>
                  {ecn.status.replace('_', ' ')}
                </span>
              </div>
            </div>
            
            {/* Status Change Actions */}
            <div className="flex space-x-2">
              {nextStatus && (
                <button
                  onClick={() => handleStatusUpdate(nextStatus)}
                  disabled={updating}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? 'Updating...' : `Move to ${nextStatus.replace('_', ' ')}`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ECN Details */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">ECN Details</h3>
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
                    placeholder="Brief descriptive title for the change notice"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.title}</p>
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
                    placeholder="Detailed description of the change notice"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.description}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Effective Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formatDateForInput(editedData.effectiveDate) || formatDateForInput(ecn.effectiveDate)}
                      onChange={(e) => handleInputChange('effectiveDate', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {ecn.effectiveDate ? new Date(ecn.effectiveDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Assigned Engineer</label>
                  {isEditing ? (
                    <select
                      value={editedData.assigneeId || ecn.assignee?.id || ''}
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
                  ) : ecn.assignee ? (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.assignee.name}</p>
                      <p className="text-xs text-gray-500">{ecn.assignee.email}</p>
                    </div>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-500 italic">No engineer assigned</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Details */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Implementation Details</h4>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Changes Implemented</label>
                {isEditing ? (
                  <textarea
                    value={editedData.changesImplemented || ecn.changesImplemented || ''}
                    onChange={(e) => handleInputChange('changesImplemented', e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Describe the changes that were implemented"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.changesImplemented || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Affected Items</label>
                {isEditing ? (
                  <textarea
                    value={editedData.affectedItems || ecn.affectedItems || ''}
                    onChange={(e) => handleInputChange('affectedItems', e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="List all items affected by this change"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.affectedItems || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Implementation Status</label>
                  {isEditing ? (
                    <select
                      value={editedData.implementationStatus || ecn.implementationStatus || 'NOT_STARTED'}
                      onChange={(e) => handleInputChange('implementationStatus', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETE">Complete</option>
                      <option value="VERIFIED">Verified</option>
                    </select>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {ecn.implementationStatus ? ecn.implementationStatus.replace('_', ' ') : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Actual Implementation Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formatDateForInput(editedData.actualImplementationDate) || formatDateForInput(ecn.actualImplementationDate)}
                      onChange={(e) => handleInputChange('actualImplementationDate', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {ecn.actualImplementationDate ? new Date(ecn.actualImplementationDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Disposition Instructions</label>
                {isEditing ? (
                  <textarea
                    value={editedData.dispositionInstructions || ecn.dispositionInstructions || ''}
                    onChange={(e) => handleInputChange('dispositionInstructions', e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Instructions for handling existing inventory or work-in-progress"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.dispositionInstructions || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Verification Method</label>
                {isEditing ? (
                  <textarea
                    value={editedData.verificationMethod || ecn.verificationMethod || ''}
                    onChange={(e) => handleInputChange('verificationMethod', e.target.value)}
                    rows={2}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="How the implementation will be verified"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.verificationMethod || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Communication Details */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Communication Details</h4>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Distribution List</label>
                {isEditing ? (
                  <textarea
                    value={editedData.distributionList || ecn.distributionList || ''}
                    onChange={(e) => handleInputChange('distributionList', e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="List of external parties to be notified"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.distributionList || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Internal Stakeholders</label>
                {isEditing ? (
                  <textarea
                    value={editedData.internalStakeholders || ecn.internalStakeholders || ''}
                    onChange={(e) => handleInputChange('internalStakeholders', e.target.value)}
                    rows={2}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Internal teams or departments to be notified"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.internalStakeholders || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Customer Notification Required</label>
                  {isEditing ? (
                    <select
                      value={editedData.customerNotificationRequired || ecn.customerNotificationRequired || 'NOT_REQUIRED'}
                      onChange={(e) => handleInputChange('customerNotificationRequired', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="NOT_REQUIRED">Not Required</option>
                      <option value="INFORMATIONAL">Informational</option>
                      <option value="FORMAL">Formal</option>
                    </select>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {ecn.customerNotificationRequired ? ecn.customerNotificationRequired.replace('_', ' ') : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Response Deadline</label>
                  {isEditing ? (
                    <select
                      value={editedData.responseDeadline || ecn.responseDeadline || ''}
                      onChange={(e) => handleInputChange('responseDeadline', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    >
                      <option value="">Select deadline...</option>
                      <option value="HOURS_24">24 Hours</option>
                      <option value="HOURS_48">48 Hours</option>
                      <option value="DAYS_5">5 Days</option>
                      <option value="DAYS_10">10 Days</option>
                      <option value="DAYS_30">30 Days</option>
                    </select>
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {ecn.responseDeadline ? ecn.responseDeadline.replace('_', ' ') : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Acknowledgment Status</label>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedData.acknowledgmentStatus || ecn.acknowledgmentStatus || ''}
                    onChange={(e) => handleInputChange('acknowledgmentStatus', e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Status of stakeholder acknowledgments"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.acknowledgmentStatus || 'N/A'}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Closure Details */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">Closure Details</h4>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Final Documentation Summary</label>
                {isEditing ? (
                  <textarea
                    value={editedData.finalDocumentationSummary || ecn.finalDocumentationSummary || ''}
                    onChange={(e) => handleInputChange('finalDocumentationSummary', e.target.value)}
                    rows={3}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    placeholder="Summary of final documentation and lessons learned"
                  />
                ) : (
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.finalDocumentationSummary || 'N/A'}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Closure Approver</label>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editedData.closureApprover || ecn.closureApprover || ''}
                      onChange={(e) => handleInputChange('closureApprover', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      placeholder="Person who approved the closure"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.closureApprover || 'N/A'}</p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Closure Date</label>
                  {isEditing ? (
                    <input
                      type="date"
                      value={formatDateForInput(editedData.closureDate) || formatDateForInput(ecn.closureDate)}
                      onChange={(e) => handleInputChange('closureDate', e.target.value)}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 dark:border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                      <p className="text-sm text-gray-900 dark:text-gray-100">
                        {ecn.closureDate ? new Date(ecn.closureDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* People and Dates - Read-only system fields */}
          <div>
            <h4 className="text-md font-medium text-gray-900 dark:text-gray-100 mb-4">People & Dates</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Submitter</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.submitter.name}</p>
                  <p className="text-xs text-gray-500">{ecn.submitter.email}</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                  <p className="text-sm text-gray-900 dark:text-gray-100">
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
              {ecn.updatedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(ecn.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
              {ecn.distributedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Distributed</label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
                    <p className="text-sm text-gray-900 dark:text-gray-100">
                      {new Date(ecn.distributedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Related ECO */}
      {ecn.eco && (
        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg border border-gray-200 dark:border-gray-600">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Related ECO</h3>
            <p className="text-sm text-gray-600 mt-1">Track this ECN through the change management workflow</p>
          </div>
          
          <div className="p-6">
            <Link
              href={`/dashboard/eco/${ecn.eco.id}`}
              className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {ecn.eco.ecoNumber}
            </Link>
            <p className="mt-1 text-gray-900 dark:text-gray-100">{ecn.eco.title}</p>
            <p className="mt-2 text-sm text-gray-600">{ecn.eco.description}</p>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500">Status</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.eco.status.replace('_', ' ')}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500">Priority</label>
                <p className="text-sm text-gray-900 dark:text-gray-100">{ecn.eco.priority}</p>
              </div>
              {ecn.eco.completedAt && (
                <div>
                  <label className="block text-xs font-medium text-gray-500">Completed</label>
                  <p className="text-sm text-gray-900 dark:text-gray-100">
                    {new Date(ecn.eco.completedAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revision History */}
      <RevisionHistory revisions={ecn.revisions || []} entityType="ECN" />

      <Toast
        message={toastMessage}
        type={toastType}
        isOpen={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}