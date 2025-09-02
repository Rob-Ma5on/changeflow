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
  status: string;
  estimatedCostRange?: string;
  targetImplementationDate?: string;
  stakeholders?: string;
  affectedProducts?: string;
  affectedDocuments?: string;
  implementationPlan?: string;
  proposedSolution?: string;
  submitter: {
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  createdAt: string;
  submittedAt?: string;
}

interface ReviewFormData {
  technicalFeasibility: 'YES' | 'NO' | 'CONDITIONAL';
  technicalAssessment: string;
  resourceRequirements: string;
  implementationComplexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  stakeholdersToInvolve: string[];
  engineeringRecommendation: 'PROCEED' | 'REJECT' | 'NEED_MORE_INFO';
  comments: string;
}

const STAKEHOLDER_OPTIONS = [
  'Design Engineering',
  'Test Engineering',
  'Manufacturing Engineering',
  'Quality Engineering',
  'Materials Engineering',
  'Software Engineering',
  'Systems Engineering',
  'Project Management',
  'Purchasing',
  'Production',
  'Quality Assurance',
  'Regulatory Affairs'
];

export default function ECRReviewPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [ecr, setEcr] = useState<ECR | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [formData, setFormData] = useState<ReviewFormData>({
    technicalFeasibility: 'YES',
    technicalAssessment: '',
    resourceRequirements: '',
    implementationComplexity: 'MODERATE',
    stakeholdersToInvolve: [],
    engineeringRecommendation: 'PROCEED',
    comments: ''
  });

  useEffect(() => {
    const fetchECR = async () => {
      try {
        const response = await fetch(`/api/ecr/${params.id}`);
        if (response.ok) {
          const ecrData = await response.json();
          setEcr(ecrData);
          
          // Pre-populate existing assessment data if available
          if (ecrData.technicalAssessment) {
            setFormData(prev => ({
              ...prev,
              technicalAssessment: ecrData.technicalAssessment || '',
              resourceRequirements: ecrData.resourceRequirements || '',
              implementationComplexity: ecrData.implementationComplexity || 'MODERATE'
            }));
          }
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
            if (!hasPermission(currentUser.role, 'ECR', 'UPDATE') || currentUser.role !== 'ENGINEER') {
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

  const handleStakeholderToggle = (stakeholder: string) => {
    setFormData(prev => ({
      ...prev,
      stakeholdersToInvolve: prev.stakeholdersToInvolve.includes(stakeholder)
        ? prev.stakeholdersToInvolve.filter(s => s !== stakeholder)
        : [...prev.stakeholdersToInvolve, stakeholder]
    }));
  };

  const handleSubmitReview = async (action: 'ANALYZE' | 'REJECT' | 'REQUEST_INFO') => {
    if (!ecr) return;
    
    setIsSubmitting(true);
    setError('');

    // Validation
    if (!formData.technicalAssessment.trim()) {
      setError('Technical assessment is required');
      setIsSubmitting(false);
      return;
    }

    try {
      // Update ECR with engineering assessment
      const updateResponse = await fetch(`/api/ecr/${ecr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          technicalAssessment: formData.technicalAssessment,
          resourceRequirements: formData.resourceRequirements,
          implementationComplexity: formData.implementationComplexity,
          revisionNote: `Engineering review completed: ${action}`
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update ECR assessment');
      }

      // Update status based on action
      let newStatus = '';
      let comments = formData.comments;

      switch (action) {
        case 'ANALYZE':
          newStatus = 'IN_ANALYSIS';
          comments = `Engineering assessment completed. Recommendation: ${formData.engineeringRecommendation}. ${formData.comments}`;
          break;
        case 'REJECT':
          newStatus = 'REJECTED';
          comments = `Rejected by Engineering. ${formData.comments}`;
          break;
        case 'REQUEST_INFO':
          newStatus = 'UNDER_REVIEW'; // Stay in review but add comment
          comments = `More information requested. ${formData.comments}`;
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
      setError(err instanceof Error ? err.message : 'Failed to submit review');
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

  // Check if ECR is in reviewable state
  if (ecr.status !== 'SUBMITTED' && ecr.status !== 'UNDER_REVIEW') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded-md">
          This ECR is not available for engineering review. Current status: {ecr.status}
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

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Engineering Review</h1>
          <p className="text-gray-600 mt-2">ECR {ecr.ecrNumber} - Technical Assessment</p>
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
        {/* Original ECR Data - Read Only */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Original ECR Information</h3>
            <p className="text-sm text-gray-500">Read-only view of the submitted request</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Title</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">{ecr.title}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Problem Description</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900 whitespace-pre-wrap">{ecr.description}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Business Justification</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900 whitespace-pre-wrap">{ecr.reason}</div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    ecr.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                    ecr.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                    ecr.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {ecr.priority}
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Customer Impact</label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">
                  {ecr.customerImpact.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Reason for Change</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">{ecr.reasonForChange}</div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Affected Parts</label>
              <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900">{ecr.affectedProducts || 'Not specified'}</div>
            </div>

            {ecr.proposedSolution && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Proposed Solution</label>
                <div className="mt-1 p-2 bg-gray-50 rounded border text-gray-900 whitespace-pre-wrap">{ecr.proposedSolution}</div>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                <p><strong>Submitted by:</strong> {ecr.submitter.name} ({ecr.submitter.department || ecr.submitter.role})</p>
                <p><strong>Submitted on:</strong> {new Date(ecr.submittedAt || ecr.createdAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Engineering Assessment Form */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Engineering Assessment</h3>
            <p className="text-sm text-gray-500">Provide technical evaluation and recommendation</p>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Technical Feasibility <span className="text-red-500">*</span>
              </label>
              <div className="space-y-2">
                {[
                  { value: 'YES', label: 'Yes', desc: 'Technically feasible with current capabilities' },
                  { value: 'NO', label: 'No', desc: 'Not feasible with current technology/resources' },
                  { value: 'CONDITIONAL', label: 'Conditional', desc: 'Feasible with certain conditions or investments' }
                ].map((option) => (
                  <label key={option.value} className="flex items-start">
                    <input
                      type="radio"
                      name="technicalFeasibility"
                      value={option.value}
                      checked={formData.technicalFeasibility === option.value}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="technicalAssessment" className="block text-sm font-medium text-gray-700 mb-1">
                Technical Assessment <span className="text-red-500">*</span>
              </label>
              <textarea
                id="technicalAssessment"
                name="technicalAssessment"
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Detailed technical analysis, feasibility concerns, design considerations..."
                value={formData.technicalAssessment}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="resourceRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                Resource Requirements
              </label>
              <textarea
                id="resourceRequirements"
                name="resourceRequirements"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Engineering hours, tools, equipment, materials, external resources..."
                value={formData.resourceRequirements}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="implementationComplexity" className="block text-sm font-medium text-gray-700 mb-1">
                Implementation Complexity
              </label>
              <select
                id="implementationComplexity"
                name="implementationComplexity"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                value={formData.implementationComplexity}
                onChange={handleChange}
              >
                <option value="SIMPLE">Simple - Straightforward implementation</option>
                <option value="MODERATE">Moderate - Some complexity, standard approach</option>
                <option value="COMPLEX">Complex - High complexity, significant effort</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Stakeholders to Involve
                <span className="text-xs text-gray-500 block mt-1">Select all departments/teams that should be involved</span>
              </label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-3">
                {STAKEHOLDER_OPTIONS.map((stakeholder) => (
                  <label key={stakeholder} className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.stakeholdersToInvolve.includes(stakeholder)}
                      onChange={() => handleStakeholderToggle(stakeholder)}
                    />
                    <span className="ml-2 text-gray-900">{stakeholder}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Engineering Recommendation
              </label>
              <div className="space-y-2">
                {[
                  { value: 'PROCEED', label: 'Proceed to Analysis', desc: 'Move forward with cross-functional analysis' },
                  { value: 'REJECT', label: 'Reject', desc: 'Do not proceed with this change request' },
                  { value: 'NEED_MORE_INFO', label: 'Need More Information', desc: 'Request additional details from submitter' }
                ].map((option) => (
                  <label key={option.value} className="flex items-start">
                    <input
                      type="radio"
                      name="engineeringRecommendation"
                      value={option.value}
                      checked={formData.engineeringRecommendation === option.value}
                      onChange={handleChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                    />
                    <div className="ml-3">
                      <div className="text-sm font-medium text-gray-900">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                Additional Comments
              </label>
              <textarea
                id="comments"
                name="comments"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                placeholder="Any additional notes, concerns, or recommendations..."
                value={formData.comments}
                onChange={handleChange}
              />
            </div>
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
            <h4 className="text-lg font-medium text-gray-900">Review Actions</h4>
            <p className="text-sm text-gray-500">Choose the appropriate action based on your assessment</p>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => handleSubmitReview('REQUEST_INFO')}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-yellow-300 text-sm font-medium rounded-md text-yellow-700 bg-yellow-50 hover:bg-yellow-100 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Request More Info
            </button>
            
            <button
              onClick={() => handleSubmitReview('REJECT')}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100 disabled:opacity-50"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Reject
            </button>
            
            <button
              onClick={() => handleSubmitReview('ANALYZE')}
              disabled={isSubmitting || !formData.technicalAssessment.trim()}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Send to Analysis
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}