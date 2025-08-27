'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface ECO {
  id: string;
  ecoNumber: string;
  title: string;
  status: string;
}

interface FormData {
  title: string;
  description: string;
  ecoId: string;
  assigneeId: string;
  effectiveDate: string;
  changesImplemented: string;
  affectedItems: string;
  dispositionInstructions: string;
  verificationMethod: string;
  distributionList: string;
  internalStakeholders: string;
  customerNotificationRequired: 'FORMAL' | 'INFORMATIONAL' | 'NOT_REQUIRED';
  responseDeadline: 'HOURS_24' | 'HOURS_48' | 'DAYS_5' | 'DAYS_10' | 'DAYS_30' | '';
  implementationStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETE' | 'VERIFIED';
  actualImplementationDate: string;
  acknowledgmentStatus: string;
  finalDocumentationSummary: string;
  closureApprover: string;
}

export default function NewECNPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedECOs, setCompletedECOs] = useState<ECO[]>([]);
  const [loadingECOs, setLoadingECOs] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    ecoId: '',
    assigneeId: '',
    effectiveDate: '',
    changesImplemented: '',
    affectedItems: '',
    dispositionInstructions: '',
    verificationMethod: '',
    distributionList: '',
    internalStakeholders: '',
    customerNotificationRequired: 'NOT_REQUIRED',
    responseDeadline: '',
    implementationStatus: 'NOT_STARTED',
    actualImplementationDate: '',
    acknowledgmentStatus: 'Pending',
    finalDocumentationSummary: '',
    closureApprover: ''
  });

  useEffect(() => {
    const fetchCompletedECOs = async () => {
      try {
        const response = await fetch('/api/eco');
        if (response.ok) {
          const ecos = await response.json();
          const completed = ecos.filter((eco: ECO) => eco.status === 'COMPLETED');
          setCompletedECOs(completed);
        }
      } catch (error) {
        console.error('Error fetching ECOs:', error);
      } finally {
        setLoadingECOs(false);
      }
    };

    fetchCompletedECOs();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleECOChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedECO = completedECOs.find(eco => eco.id === e.target.value);
    if (selectedECO) {
      setFormData(prev => ({
        ...prev,
        ecoId: selectedECO.id,
        title: `Engineering Change Notice - ${selectedECO.title}`,
        description: `Formal notice of implementation for ${selectedECO.ecoNumber}: ${selectedECO.title}`,
        changesImplemented: 'Implementation completed per ECO specifications',
        dispositionInstructions: 'All existing inventory and work-in-progress should be handled according to standard procedures',
        verificationMethod: 'Implementation verification completed through ECO tracking'
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        ecoId: e.target.value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check if user is logged in
    if (!session?.user) {
      setError('You must be logged in to create an ECN. Please sign up or log in.');
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

    if (!formData.ecoId) {
      setError('Source ECO is required');
      setIsLoading(false);
      return;
    }

    // Validate email format for distribution list
    if (formData.distributionList.trim()) {
      const emails = formData.distributionList.split(',').map(email => email.trim());
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const invalidEmails = emails.filter(email => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        setError(`Invalid email addresses: ${invalidEmails.join(', ')}`);
        setIsLoading(false);
        return;
      }
    }

    try {
      const response = await fetch('/api/ecn', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          ecoId: formData.ecoId,
          assigneeId: formData.assigneeId || null,
          effectiveDate: formData.effectiveDate || null,
          changesImplemented: formData.changesImplemented.trim() || null,
          affectedItems: formData.affectedItems.trim() || null,
          dispositionInstructions: formData.dispositionInstructions.trim() || null,
          verificationMethod: formData.verificationMethod.trim() || null,
          distributionList: formData.distributionList.trim() || null,
          internalStakeholders: formData.internalStakeholders.trim() || null,
          customerNotificationRequired: formData.customerNotificationRequired,
          responseDeadline: formData.responseDeadline || null,
          implementationStatus: formData.implementationStatus,
          actualImplementationDate: formData.actualImplementationDate || null,
          acknowledgmentStatus: formData.acknowledgmentStatus || null,
          finalDocumentationSummary: formData.finalDocumentationSummary.trim() || null,
          closureApprover: formData.closureApprover.trim() || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ECN');
      }

      const ecn = await response.json();
      
      // Redirect to the ECN list page
      router.push('/dashboard/ecn');
    } catch (error) {
      console.error('Error creating ECN:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the ECN');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsClosed = () => {
    const now = new Date().toISOString().split('T')[0]; // Current date in YYYY-MM-DD format
    setFormData(prev => ({
      ...prev,
      closureDate: now,
      acknowledgmentStatus: 'Acknowledged'
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Engineering Change Notice</h1>
          <p className="text-gray-600 mt-2">Communicate implemented changes to stakeholders</p>
        </div>
        <Link
          href="/dashboard/ecn"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to ECNs
        </Link>
      </div>

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Identification */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Identification</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="ecoId" className="block text-sm font-medium text-gray-700 mb-1">
                  Source ECO <span className="text-red-500">*</span>
                </label>
                {loadingECOs ? (
                  <div className="animate-pulse h-10 bg-gray-200 rounded"></div>
                ) : (
                  <select
                    id="ecoId"
                    name="ecoId"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.ecoId}
                    onChange={handleECOChange}
                  >
                    <option value="">Select a completed ECO...</option>
                    {completedECOs.map((eco) => (
                      <option key={eco.id} value={eco.id}>
                        {eco.ecoNumber} - {eco.title}
                      </option>
                    ))}
                  </select>
                )}
                {completedECOs.length === 0 && !loadingECOs && (
                  <p className="text-sm text-amber-600 mt-1">
                    No completed ECOs available. Complete an ECO first to create an ECN.
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  ECN Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Auto-populated when ECO is selected"
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
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Auto-populated when ECO is selected"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Distribution */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Distribution</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="distributionList" className="block text-sm font-medium text-gray-700 mb-1">
                  Distribution List
                </label>
                <textarea
                  id="distributionList"
                  name="distributionList"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Enter comma-separated email addresses (e.g., user1@company.com, user2@company.com)"
                  value={formData.distributionList}
                  onChange={handleChange}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Email addresses separated by commas for automatic notification (Phase 2 feature)
                </p>
              </div>

              <div>
                <label htmlFor="internalStakeholders" className="block text-sm font-medium text-gray-700 mb-1">
                  Internal Stakeholders
                </label>
                <input
                  type="text"
                  id="internalStakeholders"
                  name="internalStakeholders"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Names or departments that need to be informed internally"
                  value={formData.internalStakeholders}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="customerNotificationRequired" className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Notification Required
                  </label>
                  <select
                    id="customerNotificationRequired"
                    name="customerNotificationRequired"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.customerNotificationRequired}
                    onChange={handleChange}
                  >
                    <option value="NOT_REQUIRED">Not Required</option>
                    <option value="INFORMATIONAL">Informational</option>
                    <option value="FORMAL">Formal</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="responseDeadline" className="block text-sm font-medium text-gray-700 mb-1">
                    Response Deadline
                  </label>
                  <select
                    id="responseDeadline"
                    name="responseDeadline"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.responseDeadline}
                    onChange={handleChange}
                  >
                    <option value="">No deadline</option>
                    <option value="HOURS_24">24 Hours</option>
                    <option value="HOURS_48">48 Hours</option>
                    <option value="DAYS_5">5 Days</option>
                    <option value="DAYS_10">10 Days</option>
                    <option value="DAYS_30">30 Days</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Tracking */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Implementation Tracking</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="implementationStatus" className="block text-sm font-medium text-gray-700 mb-1">
                    Implementation Status
                  </label>
                  <select
                    id="implementationStatus"
                    name="implementationStatus"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.implementationStatus}
                    onChange={handleChange}
                  >
                    <option value="NOT_STARTED">Not Started</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETE">Complete</option>
                    <option value="VERIFIED">Verified</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="actualImplementationDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Actual Implementation Date
                  </label>
                  <input
                    type="date"
                    id="actualImplementationDate"
                    name="actualImplementationDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.actualImplementationDate}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="acknowledgmentStatus" className="block text-sm font-medium text-gray-700 mb-1">
                  Acknowledgment Status
                </label>
                <input
                  type="text"
                  id="acknowledgmentStatus"
                  name="acknowledgmentStatus"
                  readOnly
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-900"
                  value={formData.acknowledgmentStatus}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Status will show "Pending" until responses are received or manually marked as acknowledged
                </p>
              </div>
            </div>
          </div>

          {/* Change Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change Details</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Effective Date
                </label>
                <input
                  type="date"
                  id="effectiveDate"
                  name="effectiveDate"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.effectiveDate}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="changesImplemented" className="block text-sm font-medium text-gray-700 mb-1">
                  Changes Implemented
                </label>
                <textarea
                  id="changesImplemented"
                  name="changesImplemented"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Describe the changes that were implemented"
                  value={formData.changesImplemented}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="affectedItems" className="block text-sm font-medium text-gray-700 mb-1">
                  Affected Items
                </label>
                <textarea
                  id="affectedItems"
                  name="affectedItems"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="List products, documents, or other items affected by this change"
                  value={formData.affectedItems}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="dispositionInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                  Disposition Instructions
                </label>
                <textarea
                  id="dispositionInstructions"
                  name="dispositionInstructions"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Instructions for handling existing inventory or work-in-progress"
                  value={formData.dispositionInstructions}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="verificationMethod" className="block text-sm font-medium text-gray-700 mb-1">
                  Verification Method
                </label>
                <textarea
                  id="verificationMethod"
                  name="verificationMethod"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="How the implementation was verified or will be verified"
                  value={formData.verificationMethod}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Closure */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Closure</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="finalDocumentationSummary" className="block text-sm font-medium text-gray-700 mb-1">
                  Final Documentation Summary
                </label>
                <textarea
                  id="finalDocumentationSummary"
                  name="finalDocumentationSummary"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Summary of documentation updates and final status"
                  value={formData.finalDocumentationSummary}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="closureApprover" className="block text-sm font-medium text-gray-700 mb-1">
                  Closure Approver Name
                </label>
                <input
                  type="text"
                  id="closureApprover"
                  name="closureApprover"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Name of person approving closure"
                  value={formData.closureApprover}
                  onChange={handleChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleMarkAsClosed}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Mark as Closed
                </button>
                <p className="text-sm text-gray-500">
                  Sets closure date to today and acknowledgment status to "Acknowledged"
                </p>
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
              href="/dashboard/ecn"
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isLoading || completedECOs.length === 0}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating ECN...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit ECN
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}