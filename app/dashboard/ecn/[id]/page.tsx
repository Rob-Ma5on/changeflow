'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface ECNDetail {
  id: string;
  ecnNumber: string;
  title: string;
  description: string;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'DISTRIBUTED' | 'EFFECTIVE' | 'CANCELLED';
  effectiveDate?: string;
  distributedAt?: string;
  createdAt: string;
  changesImplemented?: string;
  affectedItems?: string;
  dispositionInstructions?: string;
  verificationMethod?: string;
  submitter: { id: string; name: string; email: string };
  assignee?: { id: string; name: string; email: string };
  eco?: {
    id: string;
    ecoNumber: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    completedAt?: string;
    implementationPlan?: string;
    testingPlan?: string;
    rollbackPlan?: string;
    resourcesRequired?: string;
    estimatedEffort?: string;
    targetDate?: string;
    submitter: { name: string; email: string };
    assignee?: { name: string; email: string };
    ecrs: {
      id: string;
      ecrNumber: string;
      title: string;
      description: string;
      reason: string;
      urgency: string;
      affectedProducts?: string;
      affectedDocuments?: string;
      costImpact?: number;
      scheduleImpact?: string;
      implementationPlan?: string;
      submitter: { name: string; email: string };
      assignee?: { name: string; email: string };
      approver?: { name: string; email: string };
      submittedAt?: string;
      approvedAt?: string;
    }[];
  };
}

export default function ECNDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const [ecn, setEcn] = useState<ECNDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
        }
      } catch (error) {
        console.error('Error fetching ECN:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchECN();
  }, [params?.id]);

  const handleStatusUpdate = async (newStatus: string) => {
    if (!ecn) return;
    
    setUpdating(true);
    try {
      const updateData: any = { status: newStatus };
      
      // Auto-set distributedAt if moving to DISTRIBUTED
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
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to update ECN status');
      }
    } catch (error) {
      console.error('Error updating ECN status:', error);
      alert('An error occurred while updating the ECN');
    } finally {
      setUpdating(false);
    }
  };

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

  const getNextStatusActions = (currentStatus: string) => {
    switch (currentStatus) {
      case 'DRAFT':
      case 'PENDING_APPROVAL':
        return [
          { status: 'APPROVED', label: 'Approve', color: 'bg-green-600 hover:bg-green-700' },
          { status: 'CANCELLED', label: 'Cancel', color: 'bg-red-600 hover:bg-red-700' }
        ];
      case 'APPROVED':
        return [
          { status: 'DISTRIBUTED', label: 'Distribute', color: 'bg-blue-600 hover:bg-blue-700' }
        ];
      case 'DISTRIBUTED':
        return [
          { status: 'EFFECTIVE', label: 'Mark Effective', color: 'bg-green-600 hover:bg-green-700' }
        ];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!ecn) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">ECN not found</h3>
        <p className="text-gray-500">The requested Engineering Change Notice could not be found.</p>
      </div>
    );
  }

  const nextActions = getNextStatusActions(ecn.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-gray-900">{ecn.ecnNumber}</h1>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(ecn.status)}`}>
              {ecn.status.replace('_', ' ')}
            </span>
          </div>
          <p className="text-gray-600 mt-2">{ecn.title}</p>
        </div>
        <div className="flex space-x-2">
          {nextActions.map((action) => (
            <button
              key={action.status}
              onClick={() => handleStatusUpdate(action.status)}
              disabled={updating}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${action.color} disabled:opacity-50`}
            >
              {updating ? 'Updating...' : action.label}
            </button>
          ))}
          <Link
            href={`/dashboard/traceability/${encodeURIComponent(ecn.ecnNumber)}`}
            className="px-4 py-2 text-sm font-medium text-purple-700 bg-purple-100 border border-purple-200 rounded-md hover:bg-purple-200"
          >
            <svg className="w-4 h-4 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            View Traceability
          </Link>
          <Link
            href="/dashboard/ecn"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Back to ECNs
          </Link>
        </div>
      </div>

      {/* Traceability Chain */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-4">Traceability Chain</h3>
        
        {/* ECRs Section */}
        {ecn.eco?.ecrs && ecn.eco.ecrs.length > 0 && (
          <div className="mb-6">
            <h4 className="text-md font-medium text-blue-800 mb-3">
              Original ECRs ({ecn.eco.ecrs.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {ecn.eco.ecrs.map((ecr) => (
                <div key={ecr.id} className="bg-white p-3 rounded border border-blue-200">
                  <div className="font-medium text-gray-900">{ecr.ecrNumber}</div>
                  <div className="text-gray-600 text-xs truncate">{ecr.title}</div>
                  <div className="text-gray-500 text-xs">Request by {ecr.submitter.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Flow Visualization */}
        <div className="flex items-center justify-center space-x-4 text-sm">
          <div className="text-center">
            <div className="bg-gray-100 p-2 rounded-lg">
              <span className="text-xs font-medium text-gray-600">
                {ecn.eco?.ecrs?.length || 0} ECR{(ecn.eco?.ecrs?.length || 0) !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-xs text-gray-500 mt-1">Original Requests</div>
          </div>
          
          <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          
          {ecn.eco && (
            <>
              <div className="text-center">
                <div className="bg-white p-2 rounded-lg border border-blue-200">
                  <div className="font-medium text-blue-700 text-xs">{ecn.eco.ecoNumber}</div>
                  <div className="text-gray-600 text-xs truncate max-w-20">{ecn.eco.title}</div>
                </div>
                <div className="text-xs text-gray-500 mt-1">Implementation Order</div>
              </div>
              
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
          
          <div className="text-center">
            <div className="bg-purple-50 p-2 rounded-lg border border-purple-200">
              <div className="font-medium text-purple-700 text-xs">{ecn.ecnNumber}</div>
              <div className="text-gray-600 text-xs truncate max-w-20">{ecn.title}</div>
            </div>
            <div className="text-xs text-gray-500 mt-1">Change Notice</div>
          </div>
        </div>
        
        <p className="text-blue-700 text-sm mt-4">
          This ECN notifies of changes implemented through the linked ECO{ecn.eco?.ecrs && ecn.eco.ecrs.length > 1 ? ` and ${ecn.eco.ecrs.length} original ECRs` : ' and original ECR'}.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ECN Details */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">ECN Details</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <p className="mt-1 text-gray-900">{ecn.description}</p>
            </div>

            {ecn.changesImplemented && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Changes Implemented</label>
                <p className="mt-1 text-gray-900">{ecn.changesImplemented}</p>
              </div>
            )}

            {ecn.affectedItems && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Affected Items</label>
                <p className="mt-1 text-gray-900">{ecn.affectedItems}</p>
              </div>
            )}

            {ecn.dispositionInstructions && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Disposition Instructions</label>
                <p className="mt-1 text-gray-900">{ecn.dispositionInstructions}</p>
              </div>
            )}

            {ecn.verificationMethod && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Verification Method</label>
                <p className="mt-1 text-gray-900">{ecn.verificationMethod}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Submitted By</label>
                <p className="mt-1 text-gray-900">{ecn.submitter.name}</p>
              </div>
              {ecn.assignee && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Assigned To</label>
                  <p className="mt-1 text-gray-900">{ecn.assignee.name}</p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created Date</label>
                <p className="mt-1 text-gray-900">
                  {new Date(ecn.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              {ecn.distributedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Distributed Date</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(ecn.distributedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>

            {ecn.effectiveDate && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Effective Date</label>
                <p className="mt-1 text-gray-900">
                  {new Date(ecn.effectiveDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Original ECRs Details */}
        {ecn.eco?.ecrs && ecn.eco.ecrs.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Original ECR Details ({ecn.eco.ecrs.length})
            </h3>
            
            {ecn.eco.ecrs.length === 1 ? (
              // Single ECR - show full details
              <div className="space-y-4">
                {(() => {
                  const ecr = ecn.eco.ecrs[0];
                  return (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">ECR Number</label>
                        <p className="mt-1 text-blue-600 font-medium">{ecr.ecrNumber}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Title</label>
                        <p className="mt-1 text-gray-900">{ecr.title}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <p className="mt-1 text-gray-900">{ecr.description}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
                        <p className="mt-1 text-gray-900">{ecr.reason}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Urgency</label>
                          <span className={`inline-flex mt-1 px-2 py-1 text-xs font-medium rounded-full ${
                            ecr.urgency === 'LOW' ? 'bg-green-100 text-green-800' :
                            ecr.urgency === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                            ecr.urgency === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {ecr.urgency}
                          </span>
                        </div>
                        {ecr.costImpact && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Cost Impact</label>
                            <p className="mt-1 text-gray-900">
                              ${ecr.costImpact.toLocaleString()}
                            </p>
                          </div>
                        )}
                      </div>

                      {ecr.affectedProducts && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Affected Products</label>
                          <p className="mt-1 text-gray-900">{ecr.affectedProducts}</p>
                        </div>
                      )}

                      {ecr.affectedDocuments && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Affected Documents</label>
                          <p className="mt-1 text-gray-900">{ecr.affectedDocuments}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Submitted By</label>
                          <p className="mt-1 text-gray-900">{ecr.submitter.name}</p>
                        </div>
                        {ecr.approver && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Approved By</label>
                            <p className="mt-1 text-gray-900">{ecr.approver.name}</p>
                          </div>
                        )}
                      </div>

                      {ecr.submittedAt && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Submitted Date</label>
                            <p className="mt-1 text-gray-900">
                              {new Date(ecr.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {ecr.approvedAt && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700">Approved Date</label>
                              <p className="mt-1 text-gray-900">
                                {new Date(ecr.approvedAt).toLocaleDateString()}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()
                }
              </div>
            ) : (
              // Multiple ECRs - show summary cards
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  This ECN was created from {ecn.eco.ecrs.length} bundled ECRs. Click on any ECR number to view full details.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {ecn.eco.ecrs.map((ecr) => (
                    <div key={ecr.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-blue-600">{ecr.ecrNumber}</h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          ecr.urgency === 'LOW' ? 'bg-green-100 text-green-800' :
                          ecr.urgency === 'MEDIUM' ? 'bg-amber-100 text-amber-800' :
                          ecr.urgency === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {ecr.urgency}
                        </span>
                      </div>
                      <h5 className="font-medium text-gray-900 mb-2">{ecr.title}</h5>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{ecr.description}</p>
                      <div className="text-xs text-gray-500">
                        <div>Submitted by: {ecr.submitter.name}</div>
                        {ecr.costImpact && (
                          <div>Cost Impact: ${ecr.costImpact.toLocaleString()}</div>
                        )}
                        {ecr.approvedAt && (
                          <div>Approved: {new Date(ecr.approvedAt).toLocaleDateString()}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Linked ECO Summary */}
      {ecn.eco && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Linked ECO Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">ECO Number</label>
                <p className="mt-1 text-blue-600 font-medium">{ecn.eco.ecoNumber}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <p className="mt-1 text-gray-900">{ecn.eco.title}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <span 
                  className="inline-flex mt-1 px-2 py-1 text-xs font-medium rounded-full text-white"
                  style={{
                    backgroundColor: 
                      ecn.eco.priority === 'LOW' ? '#22C55E' :
                      ecn.eco.priority === 'MEDIUM' ? '#EAB308' :
                      ecn.eco.priority === 'HIGH' ? '#EF4444' :
                      '#6B7280'
                  }}
                >
                  {ecn.eco.priority}
                </span>
              </div>
            </div>
            <div className="space-y-4">
              {ecn.eco.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completed Date</label>
                  <p className="mt-1 text-gray-900">
                    {new Date(ecn.eco.completedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Implementation Owner</label>
                <p className="mt-1 text-gray-900">{ecn.eco.assignee?.name || ecn.eco.submitter.name}</p>
              </div>
              {ecn.eco.estimatedEffort && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Estimated Effort</label>
                  <p className="mt-1 text-gray-900">{ecn.eco.estimatedEffort}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}