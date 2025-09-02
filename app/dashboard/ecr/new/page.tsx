'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { UserRole } from '@prisma/client';
import { hasPermission } from '@/lib/permissions';

interface FormData {
  title: string;
  description: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reasonForChange: string[];
  customerImpact: 'DIRECT_IMPACT' | 'INDIRECT_IMPACT' | 'NO_IMPACT';
  estimatedCostRange: string;
  targetImplementationDate: string;
  stakeholders: string;
  estimatedCost: string;
  affectedProducts: string;
  affectedDocuments: string;
  implementationPlan: string;
  proposedSolution: string;
  attachments: File[];
}

type FormStep = 1 | 2;

const PROBLEM_DESCRIPTION_MIN_LENGTH = 50;

export default function NewECRPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [isDraft, setIsDraft] = useState(false);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    reason: '',
    priority: 'MEDIUM',
    reasonForChange: [],
    customerImpact: 'NO_IMPACT',
    estimatedCostRange: '',
    targetImplementationDate: '',
    stakeholders: '',
    estimatedCost: '',
    affectedProducts: '',
    affectedDocuments: '',
    implementationPlan: '',
    proposedSolution: '',
    attachments: []
  });

  // Check permissions on load
  useEffect(() => {
    const checkPermissions = async () => {
      if (session?.user) {
        const response = await fetch('/api/users');
        if (response.ok) {
          const userData = await response.json();
          const currentUser = userData.find((u: any) => u.email === session.user?.email);
          if (currentUser) {
            setUserRole(currentUser.role);
            if (!hasPermission(currentUser.role, 'ECR', 'CREATE')) {
              router.push('/dashboard/ecr');
              return;
            }
          }
        }
      }
    };
    checkPermissions();
  }, [session, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleReasonForChangeToggle = (reason: string) => {
    setFormData(prev => ({
      ...prev,
      reasonForChange: prev.reasonForChange.includes(reason)
        ? prev.reasonForChange.filter(r => r !== reason)
        : [...prev.reasonForChange, reason]
    }));
  };

  const validateStep1 = (): boolean => {
    if (!formData.description.trim()) {
      setError('Problem description is required');
      return false;
    }
    
    if (formData.description.trim().length < PROBLEM_DESCRIPTION_MIN_LENGTH) {
      setError(`Problem description must be at least ${PROBLEM_DESCRIPTION_MIN_LENGTH} characters`);
      return false;
    }

    if (formData.reasonForChange.length === 0) {
      setError('At least one reason for change must be selected');
      return false;
    }

    if (!formData.affectedProducts.trim()) {
      setError('Affected part numbers are required');
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
      setError('');
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
      setError('');
    }
  };

  const handleSaveDraft = async () => {
    setIsDraft(true);
    await handleSubmit(null, true);
  };

  const handleSubmit = async (e: React.FormEvent | null, saveAsDraft: boolean = false) => {
    if (e) e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check if user is logged in
    if (!session?.user) {
      setError('You must be logged in to create an ECR. Please sign up or log in.');
      setIsLoading(false);
      return;
    }

    // For submission (not draft), validate all required fields
    if (!saveAsDraft) {
      if (!formData.title.trim()) {
        setError('Title is required');
        setIsLoading(false);
        return;
      }

      if (!validateStep1()) {
        setCurrentStep(1);
        setIsLoading(false);
        return;
      }

      if (!formData.reason.trim()) {
        setError('Business justification is required');
        setIsLoading(false);
        return;
      }

      if (formData.targetImplementationDate && new Date(formData.targetImplementationDate) <= new Date()) {
        setError('Target implementation date must be in the future');
        setIsLoading(false);
        return;
      }
    }

    try {
      // For now, skip file upload - would need FormData and file handling
      const response = await fetch('/api/ecr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim() || `ECR - ${new Date().toLocaleDateString()}`,
          description: formData.description.trim(),
          reason: formData.reason.trim() || formData.proposedSolution.trim(),
          priority: formData.priority,
          reasonForChange: formData.reasonForChange.join(', '),
          customerImpact: formData.customerImpact,
          estimatedCostRange: formData.estimatedCostRange || null,
          targetImplementationDate: formData.targetImplementationDate || null,
          stakeholders: formData.stakeholders.trim() || null,
          affectedProducts: formData.affectedProducts.trim() || null,
          affectedDocuments: formData.affectedDocuments.trim() || null,
          costImpact: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
          implementationPlan: formData.implementationPlan.trim() || formData.proposedSolution.trim() || null,
          status: saveAsDraft ? 'DRAFT' : 'DRAFT' // Always start as draft for new workflow
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ECR');
      }

      const ecr = await response.json();
      
      if (saveAsDraft) {
        // Show success message for draft
        alert('ECR saved as draft successfully!');
      }
      
      // Redirect to the ECR list page
      router.push('/dashboard/ecr');
    } catch (error) {
      console.error('Error creating ECR:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the ECR');
    } finally {
      setIsLoading(false);
    }
  };

  if (!userRole) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Engineering Change Request</h1>
          <p className="text-gray-600 mt-2">
            Step {currentStep} of 2: {currentStep === 1 ? 'Problem Identification' : 'Details & Planning'}
          </p>
        </div>
        <Link
          href="/dashboard/ecr"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to ECRs
        </Link>
      </div>

      {/* Progress Steps */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="p-4">
          <div className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            } text-sm font-semibold`}>
              1
            </div>
            <div className={`flex-1 h-1 mx-4 ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`}></div>
            <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            } text-sm font-semibold`}>
              2
            </div>
          </div>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">Problem Identification</span>
            <span className="text-sm text-gray-600">Details & Planning</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <form onSubmit={(e) => handleSubmit(e)} className="p-6 space-y-6">
          {currentStep === 1 && (
            <>
              {/* Step 1: Problem Identification */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Step 1: Problem Identification</h3>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Problem Description <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 ml-2">(minimum {PROBLEM_DESCRIPTION_MIN_LENGTH} characters)</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    required
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Describe the problem or opportunity in detail. What is the current situation? What needs to change? Include any symptoms, failures, or issues observed."
                    value={formData.description}
                    onChange={handleChange}
                  />
                  <div className="text-xs text-gray-500 mt-1">
                    {formData.description.length}/{PROBLEM_DESCRIPTION_MIN_LENGTH} characters minimum
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Reason for Change <span className="text-red-500">*</span>
                    <span className="text-xs text-gray-500 block mt-1">Select all that apply</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      'Quality Issue',
                      'Cost Reduction',
                      'Customer Request',
                      'Regulatory Compliance',
                      'Safety Concern',
                      'Performance Improvement',
                      'Obsolescence',
                      'Manufacturing Issue',
                      'Field Failure',
                      'Supplier Change'
                    ].map((reason) => (
                      <label key={reason} className="flex items-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={formData.reasonForChange.includes(reason)}
                          onChange={() => handleReasonForChangeToggle(reason)}
                        />
                        <span className="ml-2 text-sm text-gray-900">{reason}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="affectedProducts" className="block text-sm font-medium text-gray-700 mb-1">
                    Affected Part Numbers <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="affectedProducts"
                    name="affectedProducts"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="List part numbers, model numbers, or products affected (separate with commas)"
                    value={formData.affectedProducts}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Priority <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'LOW', label: 'Low', desc: 'Minor improvement, can wait' },
                        { value: 'MEDIUM', label: 'Medium', desc: 'Important, schedule within quarter' },
                        { value: 'HIGH', label: 'High', desc: 'Urgent, affects operations' },
                        { value: 'CRITICAL', label: 'Critical', desc: 'Safety or compliance issue' }
                      ].map((priority) => (
                        <label key={priority.value} className="flex items-start">
                          <input
                            type="radio"
                            name="priority"
                            value={priority.value}
                            checked={formData.priority === priority.value}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{priority.label}</div>
                            <div className="text-xs text-gray-500">{priority.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      Customer Impact <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-3">
                      {[
                        { value: 'NO_IMPACT', label: 'No Impact', desc: 'Internal change, no customer effect' },
                        { value: 'INDIRECT_IMPACT', label: 'Indirect Impact', desc: 'May affect performance or features' },
                        { value: 'DIRECT_IMPACT', label: 'Direct Impact', desc: 'Visible change to customer experience' }
                      ].map((impact) => (
                        <label key={impact.value} className="flex items-start">
                          <input
                            type="radio"
                            name="customerImpact"
                            value={impact.value}
                            checked={formData.customerImpact === impact.value}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 mt-0.5"
                          />
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{impact.label}</div>
                            <div className="text-xs text-gray-500">{impact.desc}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="proposedSolution" className="block text-sm font-medium text-gray-700 mb-1">
                    Proposed Solution <span className="text-gray-400">(Optional)</span>
                  </label>
                  <textarea
                    id="proposedSolution"
                    name="proposedSolution"
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="If you have ideas for how to solve this problem, describe them here..."
                    value={formData.proposedSolution}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="attachments" className="block text-sm font-medium text-gray-700 mb-1">
                    Attachments <span className="text-gray-400">(Optional)</span>
                  </label>
                  <input
                    type="file"
                    id="attachments"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                    onChange={handleFileChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {formData.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {formData.attachments.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                          <span className="text-sm text-gray-700">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="text-red-500 hover:text-red-700 text-sm"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {currentStep === 2 && (
            <>
              {/* Step 2: Details & Planning */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Step 2: Details & Planning</h3>
                
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Brief descriptive title for the change request"
                    value={formData.title}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                    Business Justification <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="reason"
                    name="reason"
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Explain why this change is needed and its business benefits"
                    value={formData.reason}
                    onChange={handleChange}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="estimatedCostRange" className="block text-sm font-medium text-gray-700 mb-1">
                      Estimated Cost Range
                    </label>
                    <select
                      id="estimatedCostRange"
                      name="estimatedCostRange"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={formData.estimatedCostRange}
                      onChange={handleChange}
                    >
                      <option value="">Select range...</option>
                      <option value="UNDER_1K">&lt;$1K</option>
                      <option value="FROM_1K_TO_10K">$1K-$10K</option>
                      <option value="FROM_10K_TO_50K">$10K-$50K</option>
                      <option value="FROM_50K_TO_100K">$50K-$100K</option>
                      <option value="OVER_100K">&gt;$100K</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="targetImplementationDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Target Implementation Date
                    </label>
                    <input
                      type="date"
                      id="targetImplementationDate"
                      name="targetImplementationDate"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      value={formData.targetImplementationDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="stakeholders" className="block text-sm font-medium text-gray-700 mb-1">
                    Stakeholders
                  </label>
                  <textarea
                    id="stakeholders"
                    name="stakeholders"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="List key people, departments, or teams who should be involved"
                    value={formData.stakeholders}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="affectedDocuments" className="block text-sm font-medium text-gray-700 mb-1">
                    Affected Documents
                  </label>
                  <input
                    type="text"
                    id="affectedDocuments"
                    name="affectedDocuments"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Drawings, specifications, procedures, etc."
                    value={formData.affectedDocuments}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="implementationPlan" className="block text-sm font-medium text-gray-700 mb-1">
                    Implementation Plan
                  </label>
                  <textarea
                    id="implementationPlan"
                    name="implementationPlan"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="High-level plan for implementing this change"
                    value={formData.implementationPlan}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6">
            <div className="flex space-x-4">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Previous
                </button>
              )}
              <Link
                href="/dashboard/ecr"
                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </Link>
            </div>

            <div className="flex space-x-4">
              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Save as Draft
                </button>
              )}
              
              {currentStep === 1 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Next: Details & Planning
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating ECR...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Submit ECR
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}