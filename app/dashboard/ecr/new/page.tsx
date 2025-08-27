'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
}

export default function NewECRPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
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
    implementationPlan: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check if user is logged in
    if (!session?.user) {
      setError('You must be logged in to create an ECR. Please sign up or log in.');
      setIsLoading(false);
      return;
    }

    // Validate required fields
    if (!formData.title.trim()) {
      setError('Title is required');
      setIsLoading(false);
      return;
    }

    if (!formData.description.trim()) {
      setError('Description is required');
      setIsLoading(false);
      return;
    }

    if (!formData.reason.trim()) {
      setError('Business justification is required');
      setIsLoading(false);
      return;
    }

    if (formData.reasonForChange.length === 0) {
      setError('At least one reason for change must be selected');
      setIsLoading(false);
      return;
    }

    if (formData.targetImplementationDate && new Date(formData.targetImplementationDate) <= new Date()) {
      setError('Target implementation date must be in the future');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/ecr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          reason: formData.reason.trim(),
          urgency: formData.priority,
          priority: formData.priority,
          reasonForChange: formData.reasonForChange.join(', '),
          customerImpact: formData.customerImpact,
          estimatedCostRange: formData.estimatedCostRange || null,
          targetImplementationDate: formData.targetImplementationDate || null,
          stakeholders: formData.stakeholders.trim() || null,
          affectedProducts: formData.affectedProducts.trim() || null,
          affectedDocuments: formData.affectedDocuments.trim() || null,
          costImpact: formData.estimatedCost ? parseFloat(formData.estimatedCost) : null,
          implementationPlan: formData.implementationPlan.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ECR');
      }

      const ecr = await response.json();
      
      // Redirect to the ECR list page
      router.push('/dashboard/ecr');
    } catch (error) {
      console.error('Error creating ECR:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the ECR');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Engineering Change Request</h1>
          <p className="text-gray-600 mt-2">Submit a request for engineering changes</p>
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

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-6">
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
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Detailed description of the proposed change"
                  value={formData.description}
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

              <div>
                <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                  Priority <span className="text-red-500">*</span>
                </label>
                <select
                  id="priority"
                  name="priority"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Reason for Change <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
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
                    <label key={reason} className="inline-flex items-center mr-6">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        checked={formData.reasonForChange.includes(reason)}
                        onChange={() => handleReasonForChangeToggle(reason)}
                      />
                      <span className="ml-2 text-sm text-gray-900">{reason}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Impact Assessment */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Impact Assessment</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customerImpact" className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Impact
                  </label>
                  <select
                    id="customerImpact"
                    name="customerImpact"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.customerImpact}
                    onChange={handleChange}
                  >
                    <option value="NO_IMPACT">No Impact</option>
                    <option value="INDIRECT_IMPACT">Indirect Impact</option>
                    <option value="DIRECT_IMPACT">Direct Impact</option>
                  </select>
                </div>

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
              </div>

              <div>
                <label htmlFor="stakeholders" className="block text-sm font-medium text-gray-700 mb-1">
                  Stakeholders
                </label>
                <input
                  type="text"
                  id="stakeholders"
                  name="stakeholders"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="List key stakeholders who should be involved or notified"
                  value={formData.stakeholders}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Planning */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Planning</h3>
            
            <div className="grid grid-cols-1 gap-6">
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
          </div>

          {/* Additional Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Details</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="affectedProducts" className="block text-sm font-medium text-gray-700 mb-1">
                  Affected Products
                </label>
                <input
                  type="text"
                  id="affectedProducts"
                  name="affectedProducts"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="List products that will be affected by this change"
                  value={formData.affectedProducts}
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
                  placeholder="List drawings, specifications, or other documents that need updates"
                  value={formData.affectedDocuments}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="estimatedCost" className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Cost (USD)
                </label>
                <input
                  type="number"
                  id="estimatedCost"
                  name="estimatedCost"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="0.00"
                  value={formData.estimatedCost}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <Link
              href="/dashboard/ecr"
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
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
          </div>
        </form>
      </div>
    </div>
  );
}