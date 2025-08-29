'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import WorkflowBreadcrumbs from '@/components/WorkflowBreadcrumbs';
import WorkflowProgress from '@/components/WorkflowProgress';

interface ECR {
  id: string;
  ecrNumber: string;
  title: string;
  description: string;
  reason: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  implementationPlan?: string;
  submitter: { name: string };
}

interface FormData {
  title: string;
  description: string;
  assigneeId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  implementationPlan: string;
  testingPlan: string;
  rollbackPlan: string;
  resourcesRequired: string;
  estimatedEffort: string;
  targetDate: string;
  effectiveDate: string;
  effectivityType: 'DATE_BASED' | 'IMMEDIATE';
  materialDisposition: 'USE_AS_IS' | 'REWORK' | 'SCRAP' | 'RETURN_TO_VENDOR' | 'SORT_INSPECT' | 'NO_IMPACT';
  documentUpdates: string[];
  implementationTeam: string;
  inventoryImpact: boolean;
  estimatedTotalCost: string;
  sourceEcrIds: string[];
}

export default function NewECOPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sourceEcrs, setSourceEcrs] = useState<ECR[]>([]);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    assigneeId: '',
    priority: 'MEDIUM',
    implementationPlan: '',
    testingPlan: '',
    rollbackPlan: '',
    resourcesRequired: '',
    estimatedEffort: '',
    targetDate: '',
    effectiveDate: '',
    effectivityType: 'DATE_BASED',
    materialDisposition: 'NO_IMPACT',
    documentUpdates: [],
    implementationTeam: '',
    inventoryImpact: false,
    estimatedTotalCost: '',
    sourceEcrIds: []
  });

  useEffect(() => {
    const ecrId = searchParams.get('ecrId');
    const ecrIds = searchParams.get('ecrIds');
    
    // If no ECR parameters, redirect back to ECR page with message
    if (!ecrId && !ecrIds) {
      router.replace('/dashboard/ecr?error=ECOs must be created from approved ECRs');
      return;
    }

    const fetchSourceEcrs = async () => {
      try {
        let ecrIdArray: string[] = [];
        
        if (ecrId) {
          ecrIdArray = [ecrId];
        } else if (ecrIds) {
          ecrIdArray = ecrIds.split(',');
        }

        // Fetch ECR data
        const ecrPromises = ecrIdArray.map(id => 
          fetch(`/api/ecr/${id}`).then(res => res.json())
        );
        
        const ecrs = await Promise.all(ecrPromises);
        
        // Check for ECRs that failed to load
        const failedEcrs = ecrs.filter(ecr => !ecr);
        if (failedEcrs.length > 0) {
          router.replace('/dashboard/ecr?error=One or more ECRs could not be found');
          return;
        }

        // Check for non-approved ECRs and provide specific error messages
        const nonApprovedEcrs = ecrs.filter(ecr => ecr.status !== 'APPROVED');
        if (nonApprovedEcrs.length > 0) {
          const errorDetails = nonApprovedEcrs.map(ecr => `${ecr.ecrNumber} is currently ${ecr.status}`).join(', ');
          router.replace(`/dashboard/ecr?error=Only approved ECRs can be converted to ECOs. ${errorDetails}.`);
          return;
        }

        const validEcrs = ecrs; // All are approved at this point

        setSourceEcrs(validEcrs);

        // Pre-populate form based on ECR data
        const highestPriority = getHighestPriority(validEcrs.map(ecr => ecr.priority));
        const combinedDescription = validEcrs.map(ecr => 
          `${ecr.ecrNumber}: ${ecr.description}\nJustification: ${ecr.reason}`
        ).join('\n\n');
        
        const combinedImplementationPlan = validEcrs
          .filter(ecr => ecr.implementationPlan)
          .map(ecr => `From ${ecr.ecrNumber}: ${ecr.implementationPlan}`)
          .join('\n\n');

        setFormData(prev => ({
          ...prev,
          title: validEcrs.length === 1 
            ? `Implement: ${validEcrs[0].title}`
            : `Implementation of ${validEcrs.map(ecr => ecr.ecrNumber).join(', ')}`,
          description: combinedDescription,
          priority: highestPriority,
          implementationPlan: combinedImplementationPlan,
          sourceEcrIds: validEcrs.map(ecr => ecr.id)
        }));
      } catch (error) {
        console.error('Error fetching ECR data:', error);
        setError('Failed to load ECR data. Please try again.');
      }
    };

    fetchSourceEcrs();
  }, [searchParams, router]);

  const getHighestPriority = (priorities: string[]): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    const priorityOrder = { 'LOW': 1, 'MEDIUM': 2, 'HIGH': 3, 'CRITICAL': 4 };
    const highest = priorities.reduce((max, current) => 
      priorityOrder[current as keyof typeof priorityOrder] > priorityOrder[max as keyof typeof priorityOrder] ? current : max
    );
    return highest as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checkbox = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkbox.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleDocumentUpdateToggle = (document: string) => {
    setFormData(prev => ({
      ...prev,
      documentUpdates: prev.documentUpdates.includes(document)
        ? prev.documentUpdates.filter(d => d !== document)
        : [...prev.documentUpdates, document]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Check if user is logged in
    if (!session?.user) {
      setError('You must be logged in to create an ECO. Please sign up or log in.');
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

    if (!formData.effectiveDate) {
      setError('Effective date is required');
      setIsLoading(false);
      return;
    }

    if (new Date(formData.effectiveDate) <= new Date()) {
      setError('Effective date must be in the future');
      setIsLoading(false);
      return;
    }

    if (formData.targetDate && new Date(formData.targetDate) <= new Date()) {
      setError('Target date must be in the future');
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/eco', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: formData.title.trim(),
          description: formData.description.trim(),
          assigneeId: formData.assigneeId || null,
          priority: formData.priority,
          implementationPlan: formData.implementationPlan.trim() || null,
          testingPlan: formData.testingPlan.trim() || null,
          rollbackPlan: formData.rollbackPlan.trim() || null,
          resourcesRequired: formData.resourcesRequired.trim() || null,
          estimatedEffort: formData.estimatedEffort.trim() || null,
          targetDate: formData.targetDate || null,
          effectiveDate: formData.effectiveDate,
          effectivityType: formData.effectivityType,
          materialDisposition: formData.materialDisposition,
          documentUpdates: formData.documentUpdates.join(', '),
          implementationTeam: formData.implementationTeam.trim() || null,
          inventoryImpact: formData.inventoryImpact,
          estimatedTotalCost: formData.estimatedTotalCost ? parseFloat(formData.estimatedTotalCost) : null,
          sourceEcrIds: formData.sourceEcrIds
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create ECO');
      }

      const eco = await response.json();
      
      // Redirect to the ECO list page
      router.push('/dashboard/eco');
    } catch (error) {
      console.error('Error creating ECO:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while creating the ECO');
    } finally {
      setIsLoading(false);
    }
  };

  const Tooltip = ({ children, content }: { children: React.ReactNode; content: string }) => (
    <div className="relative group">
      {children}
      <div className="absolute z-50 invisible group-hover:visible bg-gray-900 text-white text-xs rounded py-2 px-3 bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64">
        {content}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Workflow Breadcrumbs */}
      {sourceEcrs.length > 0 && (
        <WorkflowBreadcrumbs
          currentStep="ECO"
          ecr={sourceEcrs.length === 1 ? {
            id: sourceEcrs[0].id,
            ecrNumber: sourceEcrs[0].ecrNumber,
            title: sourceEcrs[0].title
          } : undefined}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">New Engineering Change Order</h1>
          <p className="text-gray-600 mt-2">Create a plan for implementing engineering changes</p>
        </div>
        <Link
          href="/dashboard/eco"
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to ECOs
        </Link>
      </div>

      {/* Workflow Progress */}
      <WorkflowProgress
        currentStep={2}
        completedSteps={[1]}
        sourceInfo={{
          ecrNumbers: sourceEcrs.map(ecr => ecr.ecrNumber)
        }}
      />

      {/* Form */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Source ECRs */}
          {sourceEcrs.length > 0 && (
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Source ECRs</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-blue-400 mt-0.5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      This ECO implements {sourceEcrs.length} approved ECR{sourceEcrs.length > 1 ? 's' : ''}:
                    </h4>
                    <div className="space-y-2">
                      {sourceEcrs.map((ecr) => (
                        <div key={ecr.id} className="flex items-center justify-between bg-white rounded p-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600 font-medium">{ecr.ecrNumber}</span>
                            <span className="text-gray-600">-</span>
                            <span className="text-gray-900">{ecr.title}</span>
                          </div>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            ecr.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                            ecr.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                            ecr.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {ecr.priority}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

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
                  placeholder="Brief descriptive title for the change order"
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
                  placeholder="Detailed description of the change to be implemented"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    name="priority"
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
                  <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    id="targetDate"
                    name="targetDate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.targetDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Implementation Details */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Implementation Details</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Tooltip content="The date when this change becomes effective and must be implemented">
                    <label htmlFor="effectiveDate" className="block text-sm font-medium text-gray-700 mb-1 cursor-help">
                      Effective Date <span className="text-red-500">*</span>
                      <svg className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </label>
                  </Tooltip>
                  <input
                    type="date"
                    id="effectiveDate"
                    name="effectiveDate"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.effectiveDate}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <Tooltip content="How this change takes effect - either on a specific date or immediately upon approval">
                    <label htmlFor="effectivityType" className="block text-sm font-medium text-gray-700 mb-1 cursor-help">
                      Effectivity Type
                      <svg className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </label>
                  </Tooltip>
                  <select
                    id="effectivityType"
                    name="effectivityType"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    value={formData.effectivityType}
                    onChange={handleChange}
                  >
                    <option value="DATE_BASED">Date Based</option>
                    <option value="IMMEDIATE">Immediate</option>
                  </select>
                </div>
              </div>

              <div>
                <Tooltip content="What should be done with existing inventory or products that don't meet the new requirements">
                  <label htmlFor="materialDisposition" className="block text-sm font-medium text-gray-700 mb-1 cursor-help">
                    Material Disposition
                    <svg className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </label>
                </Tooltip>
                <select
                  id="materialDisposition"
                  name="materialDisposition"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  value={formData.materialDisposition}
                  onChange={handleChange}
                >
                  <option value="NO_IMPACT">No Impact</option>
                  <option value="USE_AS_IS">Use As Is</option>
                  <option value="REWORK">Rework</option>
                  <option value="SCRAP">Scrap</option>
                  <option value="RETURN_TO_VENDOR">Return to Vendor</option>
                  <option value="SORT_INSPECT">Sort & Inspect</option>
                </select>
              </div>
            </div>
          </div>

          {/* Documentation */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Documentation</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Tooltip content="Select which types of documents need to be updated as part of this change">
                  <label className="block text-sm font-medium text-gray-700 mb-3 cursor-help">
                    Document Updates
                    <svg className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </label>
                </Tooltip>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    'Drawing',
                    'Specification',
                    'Work Instruction',
                    'Test Procedure',
                    'Quality Plan',
                    'User Manual',
                    'Service Manual'
                  ].map((document) => (
                    <label key={document} className="inline-flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        checked={formData.documentUpdates.includes(document)}
                        onChange={() => handleDocumentUpdateToggle(document)}
                      />
                      <span className="ml-2 text-sm text-gray-900">{document}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Resources</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <Tooltip content="List the team members responsible for implementing this change (comma-separated names)">
                  <label htmlFor="implementationTeam" className="block text-sm font-medium text-gray-700 mb-1 cursor-help">
                    Implementation Team
                    <svg className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </label>
                </Tooltip>
                <input
                  type="text"
                  id="implementationTeam"
                  name="implementationTeam"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="John Doe, Jane Smith, Engineering Team"
                  value={formData.implementationTeam}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Tooltip content="Will this change affect existing inventory levels or require inventory adjustments?">
                    <label className="flex items-center cursor-help">
                      <input
                        type="checkbox"
                        name="inventoryImpact"
                        className="form-checkbox h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                        checked={formData.inventoryImpact}
                        onChange={handleChange}
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        Inventory Impact
                        <svg className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </span>
                    </label>
                  </Tooltip>
                </div>

                <div>
                  <Tooltip content="Total estimated cost for implementing this change including materials, labor, and other resources">
                    <label htmlFor="estimatedTotalCost" className="block text-sm font-medium text-gray-700 mb-1 cursor-help">
                      Estimated Total Cost (USD)
                      <svg className="w-4 h-4 inline-block ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </label>
                  </Tooltip>
                  <input
                    type="number"
                    id="estimatedTotalCost"
                    name="estimatedTotalCost"
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="0.00"
                    value={formData.estimatedTotalCost}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Planning */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Planning</h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label htmlFor="implementationPlan" className="block text-sm font-medium text-gray-700 mb-1">
                  Implementation Plan
                </label>
                <textarea
                  id="implementationPlan"
                  name="implementationPlan"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Detailed plan for implementing this change"
                  value={formData.implementationPlan}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="testingPlan" className="block text-sm font-medium text-gray-700 mb-1">
                  Testing Plan
                </label>
                <textarea
                  id="testingPlan"
                  name="testingPlan"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="How will the change be tested and validated"
                  value={formData.testingPlan}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="rollbackPlan" className="block text-sm font-medium text-gray-700 mb-1">
                  Rollback Plan
                </label>
                <textarea
                  id="rollbackPlan"
                  name="rollbackPlan"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                  placeholder="Plan to revert the change if issues occur"
                  value={formData.rollbackPlan}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="resourcesRequired" className="block text-sm font-medium text-gray-700 mb-1">
                    Resources Required
                  </label>
                  <textarea
                    id="resourcesRequired"
                    name="resourcesRequired"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="Materials, tools, and other resources needed"
                    value={formData.resourcesRequired}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label htmlFor="estimatedEffort" className="block text-sm font-medium text-gray-700 mb-1">
                    Estimated Effort
                  </label>
                  <input
                    type="text"
                    id="estimatedEffort"
                    name="estimatedEffort"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    placeholder="e.g., 40 hours, 2 weeks"
                    value={formData.estimatedEffort}
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

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-4 pt-6">
            <Link
              href="/dashboard/eco"
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
                  Creating ECO...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Submit ECO
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}