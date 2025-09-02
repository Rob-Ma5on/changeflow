'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { hasPermission } from '@/lib/permissions';

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  description: string;
  reason: string;
  priority: string;
  reasonForChange: string;
  customerImpact: string;
  estimatedCostRange?: string;
  status: string;
  technicalAssessment?: string;
  resourceRequirements?: string;
  implementationComplexity?: string;
  rootCauseAnalysis?: string;
  riskAssessment?: string;
  timelineEstimate?: string;
  qualityImpact?: string;
  manufacturingImpact?: string;
  submitter: {
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  createdAt: string;
}

interface ApprovalFormData {
  decision: 'APPROVE' | 'REJECT' | 'HOLD';
  approvalComments: string;
  budgetAuthorization: string;
  implementationPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  holdUntilDate: string;
}

export default function ECRApprovePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [ecr, setEcr] = useState<ECR | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<ApprovalFormData>({
    decision: 'APPROVE',
    approvalComments: '',
    budgetAuthorization: '',
    implementationPriority: 'MEDIUM',
    holdUntilDate: ''
  });

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
      } catch (err) {
        setError('Failed to load ECR');
      } finally {
        setIsLoading(false);
      }
    };

    const checkPermissions = async () => {
      if (session?.user) {
        const response = await fetch('/api/users');
        if (response.ok) {
          const userData = await response.json();
          const currentUser = userData.find((u: any) => u.email === session.user?.email);
          if (currentUser) {
            setUserRole(currentUser.role);
            if (!hasPermission(currentUser.role, 'ECR', 'APPROVE') || currentUser.role !== 'MANAGER') {
              router.push(`/dashboard/ecr/${params.id}`);
              return;
            }
          }
        }
      }
    };

    if (params.id) {
      fetchECR();
      checkPermissions();
    }
  }, [params.id, session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmitDecision = async () => {
    if (!ecr) return;
    
    setIsSubmitting(true);
    setError('');

    // Validation
    if (!formData.approvalComments.trim()) {
      setError('Approval comments are required');
      setIsSubmitting(false);
      return;
    }

    if (formData.decision === 'HOLD' && !formData.holdUntilDate) {
      setError('Hold until date is required when putting on hold');
      setIsSubmitting(false);
      return;
    }

    try {
      // Update ECR with approval decision
      const updateData: any = {
        approvalComments: formData.approvalComments,
        revisionNote: `Management decision: ${formData.decision}`
      };

      if (formData.decision === 'APPROVE') {
        updateData.budgetAuthorization = formData.budgetAuthorization ? parseFloat(formData.budgetAuthorization) : null;
        updateData.priority = formData.implementationPriority;
      }

      const updateResponse = await fetch(`/api/ecr/${ecr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update ECR');
      }

      // Update status based on decision
      let newStatus = '';
      let comments = '';

      switch (formData.decision) {
        case 'APPROVE':
          newStatus = 'APPROVED';
          comments = `Approved by Management. ${formData.approvalComments}`;
          if (formData.budgetAuthorization) {
            comments += ` Budget authorized: $${formData.budgetAuthorization}`;
          }
          break;
        case 'REJECT':
          newStatus = 'REJECTED';
          comments = `Rejected by Management. ${formData.approvalComments}`;
          break;
        case 'HOLD':
          newStatus = 'PENDING_APPROVAL'; // Keep in pending but add hold note
          comments = `Put on hold until ${formData.holdUntilDate}. ${formData.approvalComments}`;
          break;
      }

      const statusResponse = await fetch(`/api/ecr/${ecr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          comments: comments
        })
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to update ECR status');
      }

      // Redirect back to ECR detail
      router.push(`/dashboard/ecr/${ecr.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!ecr || !userRole) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error || 'ECR not found or access denied'}
        </div>
      </div>
    );
  }

  // Check if ECR is in approvable state
  if (ecr.status !== 'PENDING_APPROVAL') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded-md">
          This ECR is not pending management approval. Current status: {ecr.status}
        </div>
        <Link
          href={`/dashboard/ecr/${ecr.id}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          Back to ECR
        </Link>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    const riskNum = parseInt(risk || '3');
    if (riskNum >= 4) return 'text-red-600';
    if (riskNum >= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getCostRangeDisplay = (range: string) => {
    const ranges: Record<string, string> = {
      'UNDER_1K': '< $1,000',
      'FROM_1K_TO_10K': '$1,000 - $10,000',
      'FROM_10K_TO_50K': '$10,000 - $50,000',
      'FROM_50K_TO_100K': '$50,000 - $100,000',
      'OVER_100K': '> $100,000'
    };
    return ranges[range] || 'Not specified';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Management Approval</h1>
          <p className="text-gray-600 mt-2">ECR {ecr.ecrNumber} - Final Decision</p>
        </div>
        <Link
          href={`/dashboard/ecr/${ecr.id}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to ECR
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Complete Analysis Summary */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Complete Analysis Summary</h3>
            <p className="text-sm text-gray-500">All department inputs and assessments</p>
          </div>
          <div className="p-6 space-y-6">
            {/* ECR Overview */}
            <div className="border-b border-gray-100 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">ECR Overview</h4>
              <div className="space-y-2 text-sm">
                <div><strong>Title:</strong> {ecr.title}</div>
                <div><strong>Submitted by:</strong> {ecr.submitter.name} ({ecr.submitter.department || ecr.submitter.role})</div>
                <div className="flex items-center">
                  <strong className="mr-2">Priority:</strong>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    ecr.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    ecr.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    ecr.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ecr.priority}
                  </span>
                </div>
                <div><strong>Customer Impact:</strong> {ecr.customerImpact.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}</div>
                <div><strong>Estimated Cost:</strong> {getCostRangeDisplay(ecr.estimatedCostRange || '')}</div>
              </div>
            </div>

            {/* Problem Description */}
            <div className="border-b border-gray-100 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Problem Description</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                {ecr.description}
              </div>
            </div>

            {/* Business Justification */}
            <div className="border-b border-gray-100 pb-4">
              <h4 className="font-medium text-gray-900 mb-2">Business Justification</h4>
              <div className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 p-3 rounded">
                {ecr.reason}
              </div>
            </div>

            {/* Engineering Assessment */}
            {ecr.technicalAssessment && (
              <div className="border-b border-gray-100 pb-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  <span className="inline-flex items-center">
                    ⚙️ Engineering Assessment
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">Completed</span>
                  </span>
                </h4>
                <div className="space-y-2">
                  <div className="text-sm text-gray-700 bg-blue-50 p-3 rounded">
                    <strong>Technical Assessment:</strong> {ecr.technicalAssessment}
                  </div>
                  {ecr.resourceRequirements && (
                    <div className="text-sm text-gray-700">
                      <strong>Resource Requirements:</strong> {ecr.resourceRequirements}
                    </div>
                  )}
                  {ecr.implementationComplexity && (
                    <div className="text-sm text-gray-700">
                      <strong>Complexity:</strong> {ecr.implementationComplexity}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Cross-Functional Analysis */}
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Cross-Functional Analysis</h4>
              
              {ecr.rootCauseAnalysis && (
                <div className="bg-blue-50 p-3 rounded">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">⚙️</span>
                    <strong className="text-sm">Engineering - Root Cause Analysis:</strong>
                  </div>
                  <div className="text-sm text-gray-700">{ecr.rootCauseAnalysis}</div>
                  {ecr.riskAssessment && (
                    <div className="mt-2 text-sm">
                      <strong>Risk Level:</strong> <span className={getRiskColor(ecr.riskAssessment)}>Level {ecr.riskAssessment}/5</span>
                    </div>
                  )}
                  {ecr.timelineEstimate && (
                    <div className="mt-1 text-sm">
                      <strong>Timeline:</strong> {ecr.timelineEstimate}
                    </div>
                  )}
                </div>
              )}

              {ecr.qualityImpact && (
                <div className="bg-green-50 p-3 rounded">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">✅</span>
                    <strong className="text-sm">Quality Assessment:</strong>
                  </div>
                  <div className="text-sm text-gray-700">{ecr.qualityImpact}</div>
                </div>
              )}

              {ecr.manufacturingImpact && (
                <div className="bg-orange-50 p-3 rounded">
                  <div className="flex items-center mb-2">
                    <span className="text-lg mr-2">🏭</span>
                    <strong className="text-sm">Manufacturing Impact:</strong>
                  </div>
                  <div className="text-sm text-gray-700">{ecr.manufacturingImpact}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Decision Form */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Management Decision</h3>
            <p className="text-sm text-gray-500">Provide final approval decision and guidance</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Approval Decision <span className="text-red-500">*</span>
              </label>
              <div className="space-y-3">
                {[
                  { 
                    value: 'APPROVE', 
                    label: 'Approve', 
                    desc: 'Approve this change request for implementation',
                    color: 'text-green-700',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200'
                  },
                  { 
                    value: 'REJECT', 
                    label: 'Reject', 
                    desc: 'Reject this change request',
                    color: 'text-red-700',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200'
                  },
                  { 
                    value: 'HOLD', 
                    label: 'Put On Hold', 
                    desc: 'Delay decision pending additional information or timing',
                    color: 'text-yellow-700',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200'
                  }
                ].map((option) => (
                  <div key={option.value} className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                    formData.decision === option.value 
                      ? `${option.borderColor} ${option.bgColor}` 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="radio"
                        name="decision"
                        value={option.value}
                        checked={formData.decision === option.value}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                      />
                      <div className="ml-3 flex-1">
                        <div className={`text-base font-medium ${option.color}`}>{option.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{option.desc}</div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="approvalComments" className="block text-sm font-medium text-gray-700 mb-1">
                Approval Comments <span className="text-red-500">*</span>
              </label>
              <textarea
                id="approvalComments"
                name="approvalComments"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Provide detailed comments explaining your decision, any conditions, or guidance for implementation..."
                value={formData.approvalComments}
                onChange={handleChange}
              />
            </div>

            {formData.decision === 'APPROVE' && (
              <>
                <div>
                  <label htmlFor="budgetAuthorization" className="block text-sm font-medium text-gray-700 mb-1">
                    Budget Authorization (USD)
                  </label>
                  <input
                    type="number"
                    id="budgetAuthorization"
                    name="budgetAuthorization"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0.00"
                    value={formData.budgetAuthorization}
                    onChange={handleChange}
                  />
                  <p className="text-xs text-gray-500 mt-1">Maximum budget authorized for this implementation</p>
                </div>

                <div>
                  <label htmlFor="implementationPriority" className="block text-sm font-medium text-gray-700 mb-1">
                    Implementation Priority
                  </label>
                  <select
                    id="implementationPriority"
                    name="implementationPriority"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.implementationPriority}
                    onChange={handleChange}
                  >
                    <option value="LOW">Low - Implement when convenient</option>
                    <option value="MEDIUM">Medium - Standard timeline</option>
                    <option value="HIGH">High - Expedite implementation</option>
                    <option value="CRITICAL">Critical - Immediate implementation required</option>
                  </select>
                </div>
              </>
            )}

            {formData.decision === 'HOLD' && (
              <div>
                <label htmlFor="holdUntilDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Hold Until Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="holdUntilDate"
                  name="holdUntilDate"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.holdUntilDate}
                  onChange={handleChange}
                />
                <p className="text-xs text-gray-500 mt-1">Date when this ECR should be reconsidered</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-lg font-medium text-gray-900">Submit Decision</h4>
            <p className="text-sm text-gray-500">This decision will be final and will notify all stakeholders</p>
          </div>
          
          <div className="flex space-x-4">
            <Link
              href={`/dashboard/ecr/${ecr.id}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            
            <button
              onClick={handleSubmitDecision}
              disabled={isSubmitting || !formData.approvalComments.trim()}
              className={`inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                formData.decision === 'APPROVE' 
                  ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                  : formData.decision === 'REJECT'
                  ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  : 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formData.decision === 'APPROVE' && 'Approve ECR'}
                  {formData.decision === 'REJECT' && 'Reject ECR'}
                  {formData.decision === 'HOLD' && 'Put On Hold'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}