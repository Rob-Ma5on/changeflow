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
  technicalAssessment?: string;
  resourceRequirements?: string;
  implementationComplexity?: string;
  submitter: {
    name: string;
    email: string;
    role: string;
    department?: string;
  };
  createdAt: string;
}

interface AnalysisFormData {
  // Engineering
  rootCauseAnalysis: string;
  riskAssessment: 1 | 2 | 3 | 4 | 5;
  timelineEstimate: string;
  
  // Quality
  qualityImpact: string;
  testingRequirements: string;
  complianceConsiderations: string;
  
  // Manufacturing
  manufacturingImpact: string;
  productionDisruption: string;
  inventoryImpact: string;
  
  // Financial
  detailedCostAnalysis: string;
  roiCalculation: string;
  budgetImpact: string;
}

type ActiveTab = 'engineering' | 'quality' | 'manufacturing' | 'financial';

export default function ECRAnalysisPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [ecr, setEcr] = useState<ECR | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>('engineering');
  const [formData, setFormData] = useState<AnalysisFormData>({
    rootCauseAnalysis: '',
    riskAssessment: 3,
    timelineEstimate: '',
    qualityImpact: '',
    testingRequirements: '',
    complianceConsiderations: '',
    manufacturingImpact: '',
    productionDisruption: '',
    inventoryImpact: '',
    detailedCostAnalysis: '',
    roiCalculation: '',
    budgetImpact: ''
  });

  useEffect(() => {
    const fetchECR = async () => {
      try {
        const response = await fetch(`/api/ecr/${params.id}`);
        if (response.ok) {
          const ecrData = await response.json();
          setEcr(ecrData);
          
          // Pre-populate existing data if available
          setFormData(prev => ({
            ...prev,
            rootCauseAnalysis: ecrData.rootCauseAnalysis || '',
            riskAssessment: ecrData.riskAssessment || 3,
            timelineEstimate: ecrData.timelineEstimate || '',
            qualityImpact: ecrData.qualityImpact || '',
            manufacturingImpact: ecrData.manufacturingImpact || ''
          }));
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
            
            // Set default tab based on role
            if (currentUser.role === 'QUALITY') {
              setActiveTab('quality');
            } else if (currentUser.role === 'MANUFACTURING') {
              setActiveTab('manufacturing');
            } else if (currentUser.role === 'MANAGER') {
              setActiveTab('financial');
            }
            
            // Check if user has permission to view/edit analysis
            const allowedRoles = ['ENGINEER', 'QUALITY', 'MANUFACTURING', 'MANAGER', 'ADMIN'];
            if (!allowedRoles.includes(currentUser.role)) {
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
      [name]: name === 'riskAssessment' ? parseInt(value) as 1 | 2 | 3 | 4 | 5 : value
    }));
  };

  const handleSubmitForApproval = async () => {
    if (!ecr) return;
    
    setIsSubmitting(true);
    setError('');

    // Validation - require at least root cause analysis for engineering
    if (!formData.rootCauseAnalysis.trim()) {
      setError('Root cause analysis is required before submitting for approval');
      setIsSubmitting(false);
      return;
    }

    try {
      // Update ECR with analysis data
      const updateResponse = await fetch(`/api/ecr/${ecr.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rootCauseAnalysis: formData.rootCauseAnalysis,
          riskAssessment: formData.riskAssessment.toString(),
          timelineEstimate: formData.timelineEstimate,
          qualityImpact: formData.qualityImpact,
          manufacturingImpact: formData.manufacturingImpact,
          revisionNote: 'Cross-functional analysis completed'
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update ECR analysis');
      }

      // Update status to PENDING_APPROVAL
      const statusResponse = await fetch(`/api/ecr/${ecr.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PENDING_APPROVAL',
          comments: 'Cross-functional analysis completed, ready for management approval'
        })
      });

      if (!statusResponse.ok) {
        throw new Error('Failed to update ECR status');
      }

      // Redirect back to ECR detail
      router.push(`/dashboard/ecr/${ecr.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit for approval');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canEditTab = (tab: ActiveTab): boolean => {
    if (!userRole) return false;
    
    switch (tab) {
      case 'engineering':
        return ['ENGINEER', 'ADMIN'].includes(userRole);
      case 'quality':
        return ['QUALITY', 'ADMIN'].includes(userRole);
      case 'manufacturing':
        return ['MANUFACTURING', 'ADMIN'].includes(userRole);
      case 'financial':
        return ['MANAGER', 'ADMIN'].includes(userRole);
      default:
        return false;
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

  // Check if ECR is in analyzable state
  if (ecr.status !== 'IN_ANALYSIS') {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-600 px-4 py-3 rounded-md">
          This ECR is not available for analysis. Current status: {ecr.status}
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

  const riskLabels = {
    1: 'Very Low - Minimal risk',
    2: 'Low - Some minor risks',
    3: 'Medium - Moderate risk level',
    4: 'High - Significant risks',
    5: 'Very High - Major risks'
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Cross-Functional Analysis</h1>
          <p className="text-gray-600 mt-2">ECR {ecr.ecrNumber} - Detailed Assessment</p>
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

      {/* ECR Summary */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">ECR Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Title:</span> {ecr.title}
          </div>
          <div>
            <span className="font-medium text-gray-700">Priority:</span> 
            <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
              ecr.priority === 'CRITICAL' ? 'bg-red-100 text-red-800' :
              ecr.priority === 'HIGH' ? 'bg-orange-100 text-orange-800' :
              ecr.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {ecr.priority}
            </span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Engineering Assessment:</span> 
            <span className="ml-2 text-green-600">Approved for Analysis</span>
          </div>
        </div>
        {ecr.technicalAssessment && (
          <div className="mt-4 p-3 bg-blue-50 rounded border">
            <p className="text-sm text-gray-700"><strong>Engineering Notes:</strong> {ecr.technicalAssessment}</p>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {[
              { id: 'engineering', name: 'Engineering', icon: '⚙️' },
              { id: 'quality', name: 'Quality', icon: '✅' },
              { id: 'manufacturing', name: 'Manufacturing', icon: '🏭' },
              { id: 'financial', name: 'Financial', icon: '💰' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  !canEditTab(tab.id as ActiveTab) && userRole !== 'ADMIN' ? 'opacity-60' : ''
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
                {!canEditTab(tab.id as ActiveTab) && userRole !== 'ADMIN' && (
                  <svg className="w-4 h-4 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Engineering Tab */}
          {activeTab === 'engineering' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Engineering Analysis</h3>
                {!canEditTab('engineering') && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Read Only</span>
                )}
              </div>

              <div>
                <label htmlFor="rootCauseAnalysis" className="block text-sm font-medium text-gray-700 mb-1">
                  Root Cause Analysis <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="rootCauseAnalysis"
                  name="rootCauseAnalysis"
                  required
                  rows={4}
                  disabled={!canEditTab('engineering')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="What caused this problem? Include investigation findings, failure analysis, etc."
                  value={formData.rootCauseAnalysis}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Risk Assessment <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="radio"
                        name="riskAssessment"
                        value={level}
                        disabled={!canEditTab('engineering')}
                        checked={formData.riskAssessment === level}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 disabled:opacity-50"
                      />
                      <span className="ml-3 text-sm">
                        <span className="font-medium">Risk Level {level}:</span>{' '}
                        <span className="text-gray-600">{riskLabels[level as keyof typeof riskLabels]}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="timelineEstimate" className="block text-sm font-medium text-gray-700 mb-1">
                  Timeline Estimate
                </label>
                <input
                  type="text"
                  id="timelineEstimate"
                  name="timelineEstimate"
                  disabled={!canEditTab('engineering')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g., 30 days, 6 weeks, 3 months"
                  value={formData.timelineEstimate}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Quality Tab */}
          {activeTab === 'quality' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Quality Assessment</h3>
                {!canEditTab('quality') && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Read Only</span>
                )}
              </div>

              <div>
                <label htmlFor="qualityImpact" className="block text-sm font-medium text-gray-700 mb-1">
                  Quality Impact Assessment
                </label>
                <textarea
                  id="qualityImpact"
                  name="qualityImpact"
                  rows={4}
                  disabled={!canEditTab('quality')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="How will this change affect product quality, reliability, performance?"
                  value={formData.qualityImpact}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="testingRequirements" className="block text-sm font-medium text-gray-700 mb-1">
                  Testing Requirements
                </label>
                <textarea
                  id="testingRequirements"
                  name="testingRequirements"
                  rows={4}
                  disabled={!canEditTab('quality')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="What testing is required? Qualification tests, validation studies, etc."
                  value={formData.testingRequirements}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="complianceConsiderations" className="block text-sm font-medium text-gray-700 mb-1">
                  Compliance Considerations
                </label>
                <textarea
                  id="complianceConsiderations"
                  name="complianceConsiderations"
                  rows={3}
                  disabled={!canEditTab('quality')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Regulatory requirements, certifications, standards compliance..."
                  value={formData.complianceConsiderations}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Manufacturing Tab */}
          {activeTab === 'manufacturing' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Manufacturing Assessment</h3>
                {!canEditTab('manufacturing') && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Read Only</span>
                )}
              </div>

              <div>
                <label htmlFor="manufacturingImpact" className="block text-sm font-medium text-gray-700 mb-1">
                  Manufacturing Impact
                </label>
                <textarea
                  id="manufacturingImpact"
                  name="manufacturingImpact"
                  rows={4}
                  disabled={!canEditTab('manufacturing')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="How will this change affect manufacturing processes, equipment, tooling?"
                  value={formData.manufacturingImpact}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="productionDisruption" className="block text-sm font-medium text-gray-700 mb-1">
                  Production Disruption Estimate
                </label>
                <textarea
                  id="productionDisruption"
                  name="productionDisruption"
                  rows={3}
                  disabled={!canEditTab('manufacturing')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Expected downtime, line changeovers, training requirements..."
                  value={formData.productionDisruption}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="inventoryImpact" className="block text-sm font-medium text-gray-700 mb-1">
                  Inventory Impact
                </label>
                <textarea
                  id="inventoryImpact"
                  name="inventoryImpact"
                  rows={3}
                  disabled={!canEditTab('manufacturing')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Impact on raw materials, WIP, finished goods inventory..."
                  value={formData.inventoryImpact}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Financial Analysis</h3>
                {!canEditTab('financial') && (
                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">Read Only</span>
                )}
              </div>

              <div>
                <label htmlFor="detailedCostAnalysis" className="block text-sm font-medium text-gray-700 mb-1">
                  Detailed Cost Analysis
                </label>
                <textarea
                  id="detailedCostAnalysis"
                  name="detailedCostAnalysis"
                  rows={4}
                  disabled={!canEditTab('financial')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Detailed breakdown of implementation costs, labor, materials, equipment..."
                  value={formData.detailedCostAnalysis}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="roiCalculation" className="block text-sm font-medium text-gray-700 mb-1">
                  ROI Calculation
                </label>
                <textarea
                  id="roiCalculation"
                  name="roiCalculation"
                  rows={3}
                  disabled={!canEditTab('financial')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Expected savings, revenue impact, payback period..."
                  value={formData.roiCalculation}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="budgetImpact" className="block text-sm font-medium text-gray-700 mb-1">
                  Budget Impact
                </label>
                <textarea
                  id="budgetImpact"
                  name="budgetImpact"
                  rows={3}
                  disabled={!canEditTab('financial')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Impact on department budgets, capital requirements, operational costs..."
                  value={formData.budgetImpact}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Submit Button */}
      {(userRole === 'ADMIN' || ['ENGINEER', 'QUALITY', 'MANUFACTURING', 'MANAGER'].includes(userRole)) && (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-lg font-medium text-gray-900">Submit for Approval</h4>
              <p className="text-sm text-gray-500">Ready to submit this analysis to management for approval?</p>
            </div>
            
            <button
              onClick={handleSubmitForApproval}
              disabled={isSubmitting || !formData.rootCauseAnalysis.trim()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Submit for Approval
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}