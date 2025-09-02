'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';

interface ECN {
  id: string;
  ecnNumber: string;
  changeSummary: string;
  implementationDate: string;
  specialInstructions?: string;
  sourceECO: {
    title: string;
    workInstructions: string;
    partsToAdd: any[];
    partsToRemove: any[];
    partsToModify: any[];
    drawingsToRevise: string[];
    proceduresToUpdate: string[];
    trainingMaterials: string[];
    sourceECRs: Array<{
      title: string;
      justification: string;
    }>;
  };
  attachments: string[];
  distributedDate: string;
  responseDeadline: string;
}

interface AcknowledgmentData {
  received: boolean;
  reviewed: boolean;
  documentsUpdated: boolean;
  teamInformed: boolean;
  comments: string;
}

export default function ECNAcknowledge() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const ecnId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [ecn, setEcn] = useState<ECN | null>(null);
  const [alreadyAcknowledged, setAlreadyAcknowledged] = useState(false);
  const [acknowledgmentDate, setAcknowledgmentDate] = useState<string | null>(null);
  
  // Form state
  const [acknowledgment, setAcknowledgment] = useState<AcknowledgmentData>({
    received: false,
    reviewed: false,
    documentsUpdated: false,
    teamInformed: false,
    comments: ''
  });

  useEffect(() => {
    fetchECN();
  }, [ecnId]);

  const fetchECN = async () => {
    try {
      // Get token from URL for external recipients or use session for internal
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const url = token 
        ? `/api/ecn/${ecnId}/acknowledge?token=${token}`
        : `/api/ecn/${ecnId}/acknowledge`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        setEcn(data.ecn);
        setAlreadyAcknowledged(data.alreadyAcknowledged);
        setAcknowledgmentDate(data.acknowledgmentDate);
        
        // Mark as opened/viewed
        if (!data.alreadyAcknowledged) {
          await fetch(`/api/ecn/${ecnId}/mark-opened`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token })
          });
        }
      } else if (response.status === 404) {
        alert('ECN not found or you do not have permission to view it');
        router.push('/');
      } else if (response.status === 410) {
        alert('This ECN acknowledgment link has expired');
        router.push('/');
      }
    } catch (error) {
      console.error('Error fetching ECN:', error);
      alert('Error loading ECN');
    } finally {
      setLoading(false);
    }
  };

  const generateRequiredActions = () => {
    const actions = [];
    
    if (ecn?.sourceECO.partsToAdd?.length || ecn?.sourceECO.partsToRemove?.length || ecn?.sourceECO.partsToModify?.length) {
      actions.push('Update Bill of Materials (BOM) records');
    }
    
    if (ecn?.sourceECO.drawingsToRevise?.filter(Boolean).length) {
      actions.push('Replace obsolete drawings with updated versions');
      actions.push('Destroy or mark obsolete drawings as superseded');
    }
    
    if (ecn?.sourceECO.proceduresToUpdate?.filter(Boolean).length) {
      actions.push('Update work instructions and procedures');
      actions.push('Train operators on new procedures');
    }
    
    if (ecn?.sourceECO.trainingMaterials?.filter(Boolean).length) {
      actions.push('Update training materials and documentation');
    }
    
    actions.push('Inform your team members of the changes');
    actions.push('Ensure compliance with the new requirements');
    
    return actions;
  };

  const isDeadlinePassed = () => {
    if (!ecn?.responseDeadline) return false;
    return new Date() > new Date(ecn.responseDeadline);
  };

  const getDeadlineWarning = () => {
    if (!ecn?.responseDeadline) return null;
    
    const deadline = new Date(ecn.responseDeadline);
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const hoursDiff = Math.ceil(timeDiff / (1000 * 60 * 60));
    
    if (hoursDiff < 0) {
      return { type: 'error', message: `Deadline passed ${Math.abs(hoursDiff)} hours ago` };
    } else if (hoursDiff <= 24) {
      return { type: 'warning', message: `Deadline in ${hoursDiff} hours` };
    }
    
    return null;
  };

  const handleAcknowledgmentChange = (field: keyof AcknowledgmentData, value: boolean | string) => {
    setAcknowledgment(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const requiredFields = ['received', 'reviewed'];
    const missingFields = requiredFields.filter(field => !acknowledgment[field as keyof AcknowledgmentData]);
    
    if (missingFields.length > 0) {
      alert('Please check "I have received this notice" and "I have reviewed the changes" before submitting');
      return;
    }

    setSubmitting(true);

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token');
      
      const response = await fetch(`/api/ecn/${ecnId}/acknowledge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...acknowledgment,
          token
        })
      });

      if (response.ok) {
        setAlreadyAcknowledged(true);
        setAcknowledgmentDate(new Date().toISOString());
        alert('Thank you! Your acknowledgment has been recorded.');
      } else {
        const error = await response.json();
        alert(`Error submitting acknowledgment: ${error.error}`);
      }
    } catch (error) {
      console.error('Error submitting acknowledgment:', error);
      alert('Error submitting acknowledgment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading ECN...</div>;
  }

  if (!ecn) {
    return <div className="text-center py-8">ECN not found</div>;
  }

  const deadlineWarning = getDeadlineWarning();
  const requiredActions = generateRequiredActions();

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Engineering Change Notice
        </h1>
        <div className="text-xl font-semibold text-blue-600 mb-2">
          ECN {ecn.ecnNumber}
        </div>
        <p className="text-gray-600">
          Distributed: {new Date(ecn.distributedDate).toLocaleDateString()}
        </p>
        
        {/* Deadline Warning */}
        {deadlineWarning && (
          <div className={`mt-4 p-3 rounded-lg ${
            deadlineWarning.type === 'error' 
              ? 'bg-red-100 border border-red-300 text-red-700' 
              : 'bg-yellow-100 border border-yellow-300 text-yellow-700'
          }`}>
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {deadlineWarning.message}
            </div>
          </div>
        )}
      </div>

      {/* Already Acknowledged Message */}
      {alreadyAcknowledged && (
        <div className="mb-8 p-4 bg-green-100 border border-green-300 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="text-green-800 font-medium">
              Already Acknowledged
            </span>
          </div>
          <p className="text-green-700 mt-1">
            You acknowledged this ECN on {new Date(acknowledgmentDate!).toLocaleDateString()} at {new Date(acknowledgmentDate!).toLocaleTimeString()}
          </p>
        </div>
      )}

      {/* ECN Information */}
      <div className="space-y-8">
        {/* What Changed */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What Changed</h2>
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-4">{ecn.changeSummary}</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {(ecn.sourceECO.partsToAdd?.length || ecn.sourceECO.partsToRemove?.length || ecn.sourceECO.partsToModify?.length) && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Parts Changes</h3>
                  <div className="space-y-2 text-sm">
                    {ecn.sourceECO.partsToAdd?.length > 0 && (
                      <div>
                        <span className="font-medium text-green-600">Added:</span>
                        <ul className="ml-4 list-disc">
                          {ecn.sourceECO.partsToAdd.map((part, idx) => (
                            <li key={idx}>{part.partNumber} - {part.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ecn.sourceECO.partsToRemove?.length > 0 && (
                      <div>
                        <span className="font-medium text-red-600">Removed:</span>
                        <ul className="ml-4 list-disc">
                          {ecn.sourceECO.partsToRemove.map((part, idx) => (
                            <li key={idx}>{part.partNumber} - {part.description}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {ecn.sourceECO.partsToModify?.length > 0 && (
                      <div>
                        <span className="font-medium text-blue-600">Modified:</span>
                        <ul className="ml-4 list-disc">
                          {ecn.sourceECO.partsToModify.map((part, idx) => (
                            <li key={idx}>{part.old.partNumber} → {part.new.partNumber}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Document Updates</h3>
                <div className="space-y-2 text-sm">
                  {ecn.sourceECO.drawingsToRevise?.filter(Boolean).length > 0 && (
                    <div>
                      <span className="font-medium">Drawings:</span>
                      <ul className="ml-4 list-disc">
                        {ecn.sourceECO.drawingsToRevise.filter(Boolean).map((drawing, idx) => (
                          <li key={idx}>{drawing}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ecn.sourceECO.proceduresToUpdate?.filter(Boolean).length > 0 && (
                    <div>
                      <span className="font-medium">Procedures:</span>
                      <ul className="ml-4 list-disc">
                        {ecn.sourceECO.proceduresToUpdate.filter(Boolean).map((procedure, idx) => (
                          <li key={idx}>{procedure}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {ecn.sourceECO.trainingMaterials?.filter(Boolean).length > 0 && (
                    <div>
                      <span className="font-medium">Training:</span>
                      <ul className="ml-4 list-disc">
                        {ecn.sourceECO.trainingMaterials.filter(Boolean).map((material, idx) => (
                          <li key={idx}>{material}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Why It Changed */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Why It Changed</h2>
          <div className="space-y-3">
            {ecn.sourceECO.sourceECRs.map((ecr, idx) => (
              <div key={idx} className="border-l-4 border-blue-500 pl-4">
                <h3 className="font-medium text-gray-900">{ecr.title}</h3>
                <p className="text-gray-700 text-sm">{ecr.justification}</p>
              </div>
            ))}
          </div>
        </div>

        {/* When Effective */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">When Effective</h2>
          <div className="flex items-center p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
            <svg className="w-6 h-6 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="font-medium text-yellow-800">
                Effective Date: {new Date(ecn.implementationDate).toLocaleDateString()}
              </p>
              <p className="text-yellow-700 text-sm">
                All changes must be implemented by this date
              </p>
            </div>
          </div>
        </div>

        {/* Required Actions */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Required Actions</h2>
          <ul className="space-y-2">
            {requiredActions.map((action, idx) => (
              <li key={idx} className="flex items-start">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">{action}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Work Instructions */}
        {ecn.sourceECO.workInstructions && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Implementation Instructions</h2>
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded">
                {ecn.sourceECO.workInstructions}
              </pre>
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {ecn.specialInstructions && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Special Instructions</h2>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded">
              <p className="text-blue-800">{ecn.specialInstructions}</p>
            </div>
          </div>
        )}

        {/* Attachments */}
        {ecn.attachments?.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Referenced Documents</h2>
            <ul className="space-y-2">
              {ecn.attachments.map((attachment, idx) => (
                <li key={idx} className="flex items-center text-gray-700">
                  <svg className="w-4 h-4 mr-2 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                  </svg>
                  {attachment}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Acknowledgment Form */}
        {!alreadyAcknowledged && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Acknowledgment</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={acknowledgment.received}
                    onChange={(e) => handleAcknowledgmentChange('received', e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <span className="text-gray-700">I have received this notice</span>
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={acknowledgment.reviewed}
                    onChange={(e) => handleAcknowledgmentChange('reviewed', e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required
                  />
                  <span className="text-gray-700">I have reviewed the changes</span>
                  <span className="text-red-500 ml-1">*</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={acknowledgment.documentsUpdated}
                    onChange={(e) => handleAcknowledgmentChange('documentsUpdated', e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">I have updated local documents</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={acknowledgment.teamInformed}
                    onChange={(e) => handleAcknowledgmentChange('teamInformed', e.target.checked)}
                    className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-gray-700">My team has been informed</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments (optional)
                </label>
                <textarea
                  value={acknowledgment.comments}
                  onChange={(e) => handleAcknowledgmentChange('comments', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Any questions, concerns, or additional information..."
                />
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || !acknowledgment.received || !acknowledgment.reviewed}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting Acknowledgment...' : 'Submit Acknowledgment'}
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  * Required fields must be checked before submitting
                </p>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}