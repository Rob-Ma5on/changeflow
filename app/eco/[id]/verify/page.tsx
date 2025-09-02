'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface TestItem {
  id: string;
  description: string;
  requirement: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
  notes?: string;
  testedBy?: string;
  testedDate?: string;
  attachments?: string[];
}

interface DocumentItem {
  id: string;
  documentName: string;
  type: 'DRAWING' | 'PROCEDURE' | 'TRAINING' | 'SPECIFICATION';
  currentVersion: string;
  updatedVersion?: string;
  updated: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
  notes?: string;
}

interface TrainingRecord {
  id: string;
  employeeName: string;
  employeeId: string;
  department: string;
  trainingCompleted: boolean;
  trainingDate?: string;
  trainer?: string;
  recordFiled: boolean;
  notes?: string;
}

interface Approval {
  type: 'QUALITY' | 'ENGINEERING' | 'MANUFACTURING';
  approver?: string;
  approved: boolean;
  approvedDate?: string;
  signature?: string;
  comments?: string;
}

export default function ECOVerify() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const ecoId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [eco, setEco] = useState<any>(null);
  
  // Form state
  const [testItems, setTestItems] = useState<TestItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [trainingRecords, setTrainingRecords] = useState<TrainingRecord[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([
    { type: 'QUALITY', approved: false },
    { type: 'ENGINEERING', approved: false },
    { type: 'MANUFACTURING', approved: false }
  ]);
  const [nonConformanceNotes, setNonConformanceNotes] = useState('');
  const [canGenerateECN, setCanGenerateECN] = useState(false);
  const [generatingECN, setGeneratingECN] = useState(false);

  useEffect(() => {
    fetchECO();
  }, [ecoId]);

  useEffect(() => {
    // Check if all approvals are complete and no failures
    const allApproved = approvals.every(a => a.approved);
    const allTestsPassed = testItems.length > 0 && testItems.every(t => t.result === 'PASS');
    const allDocsUpdated = documents.length > 0 && documents.every(d => d.updated);
    const allTrainingComplete = trainingRecords.length > 0 && trainingRecords.every(t => t.trainingCompleted && t.recordFiled);
    
    setCanGenerateECN(allApproved && allTestsPassed && allDocsUpdated && allTrainingComplete);
  }, [approvals, testItems, documents, trainingRecords]);

  const fetchECO = async () => {
    try {
      const response = await fetch(`/api/eco/${ecoId}/verify`);
      if (response.ok) {
        const data = await response.json();
        setEco(data.eco);
        
        // Load existing verification data or initialize
        if (data.testItems) setTestItems(data.testItems);
        if (data.documents) setDocuments(data.documents);
        if (data.trainingRecords) setTrainingRecords(data.trainingRecords);
        if (data.approvals) setApprovals(data.approvals);
        if (data.nonConformanceNotes) setNonConformanceNotes(data.nonConformanceNotes);
      } else {
        router.push('/dashboard/eco');
      }
    } catch (error) {
      console.error('Error fetching ECO verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTestItem = () => {
    const newItem: TestItem = {
      id: `test-${Date.now()}`,
      description: '',
      requirement: '',
      result: 'PENDING',
      notes: ''
    };
    setTestItems([...testItems, newItem]);
  };

  const updateTestItem = (index: number, field: keyof TestItem, value: any) => {
    const updated = [...testItems];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'result' && value !== 'PENDING') {
      updated[index].testedBy = session?.user?.id;
      updated[index].testedDate = new Date().toISOString();
    }
    setTestItems(updated);
  };

  const addDocument = () => {
    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      documentName: '',
      type: 'DRAWING',
      currentVersion: '',
      updated: false
    };
    setDocuments([...documents, newDoc]);
  };

  const updateDocument = (index: number, field: keyof DocumentItem, value: any) => {
    const updated = [...documents];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'updated' && value === true) {
      updated[index].verifiedBy = session?.user?.id;
      updated[index].verifiedDate = new Date().toISOString();
    }
    setDocuments(updated);
  };

  const addTrainingRecord = () => {
    const newRecord: TrainingRecord = {
      id: `training-${Date.now()}`,
      employeeName: '',
      employeeId: '',
      department: '',
      trainingCompleted: false,
      recordFiled: false
    };
    setTrainingRecords([...trainingRecords, newRecord]);
  };

  const updateTrainingRecord = (index: number, field: keyof TrainingRecord, value: any) => {
    const updated = [...trainingRecords];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'trainingCompleted' && value === true && !updated[index].trainingDate) {
      updated[index].trainingDate = new Date().toISOString().split('T')[0];
      updated[index].trainer = session?.user?.name;
    }
    setTrainingRecords(updated);
  };

  const updateApproval = (type: Approval['type'], field: keyof Approval, value: any) => {
    const updated = approvals.map(approval =>
      approval.type === type
        ? {
            ...approval,
            [field]: value,
            ...(field === 'approved' && value === true ? {
              approver: session?.user?.id,
              approvedDate: new Date().toISOString(),
              signature: `${session?.user?.name} - ${new Date().toISOString()}`
            } : {})
          }
        : approval
    );
    setApprovals(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const verificationData = {
        testItems: testItems.filter(t => t.description.trim()),
        documents: documents.filter(d => d.documentName.trim()),
        trainingRecords: trainingRecords.filter(t => t.employeeName.trim()),
        approvals,
        nonConformanceNotes,
        status: 'VERIFIED'
      };

      const response = await fetch(`/api/eco/${ecoId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(verificationData)
      });

      if (response.ok) {
        alert('Verification data saved successfully');
      } else {
        const error = await response.json();
        alert(`Error saving verification data: ${error.error}`);
      }
    } catch (error) {
      console.error('Error saving verification data:', error);
      alert('Error saving verification data');
    } finally {
      setSaving(false);
    }
  };

  const generateECN = async () => {
    if (!canGenerateECN) {
      alert('All verifications must be complete before generating ECN');
      return;
    }

    setGeneratingECN(true);
    try {
      const response = await fetch(`/api/eco/${ecoId}/generate-ecn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        const ecn = await response.json();
        alert(`ECN ${ecn.ecnNumber} generated successfully`);
        router.push(`/dashboard/ecn/${ecn.id}`);
      } else {
        const error = await response.json();
        alert(`Error generating ECN: ${error.error}`);
      }
    } catch (error) {
      console.error('Error generating ECN:', error);
      alert('Error generating ECN');
    } finally {
      setGeneratingECN(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading ECO verification...</div>;
  }

  if (!eco) {
    return <div className="text-center py-8">ECO not found</div>;
  }

  // Check if user has permission (QUALITY role primarily)
  const canVerify = session?.user?.role === 'QUALITY' ||
                    session?.user?.role === 'ENGINEER' ||
                    session?.user?.role === 'MANAGER' ||
                    session?.user?.role === 'ADMIN';

  if (!canVerify) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">You don't have permission to access ECO verification</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ECO Verification</h1>
        <p className="text-gray-600">{eco.title}</p>
        <div className="mt-2 text-sm text-gray-500">
          ECO ID: {eco.ecoNumber} | Status: {eco.status}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Test Results */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Test Results</h2>
            <button
              type="button"
              onClick={addTestItem}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Test Item
            </button>
          </div>

          <div className="space-y-4">
            {testItems.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Test Description
                    </label>
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateTestItem(index, 'description', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="What is being tested"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Requirement
                    </label>
                    <input
                      type="text"
                      value={item.requirement}
                      onChange={(e) => updateTestItem(index, 'requirement', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Expected result or specification"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Result
                    </label>
                    <select
                      value={item.result}
                      onChange={(e) => updateTestItem(index, 'result', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="PENDING">Pending</option>
                      <option value="PASS">Pass</option>
                      <option value="FAIL">Fail</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes
                    </label>
                    <textarea
                      value={item.notes}
                      onChange={(e) => updateTestItem(index, 'notes', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      rows={2}
                      placeholder="Additional notes or observations"
                    />
                  </div>
                </div>
                
                <div className="mt-3 flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    {item.testedBy && (
                      <span>Tested by: {item.testedBy} on {new Date(item.testedDate!).toLocaleDateString()}</span>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.result === 'PASS' ? 'bg-green-100 text-green-800' :
                    item.result === 'FAIL' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {item.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Documentation Review */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Documentation Review</h2>
            <button
              type="button"
              onClick={addDocument}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Add Document
            </button>
          </div>

          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div key={doc.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document Name
                    </label>
                    <input
                      type="text"
                      value={doc.documentName}
                      onChange={(e) => updateDocument(index, 'documentName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Document identifier"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type
                    </label>
                    <select
                      value={doc.type}
                      onChange={(e) => updateDocument(index, 'type', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    >
                      <option value="DRAWING">Drawing</option>
                      <option value="PROCEDURE">Procedure</option>
                      <option value="TRAINING">Training</option>
                      <option value="SPECIFICATION">Specification</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Version
                    </label>
                    <input
                      type="text"
                      value={doc.currentVersion}
                      onChange={(e) => updateDocument(index, 'currentVersion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Rev A"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Updated Version
                    </label>
                    <input
                      type="text"
                      value={doc.updatedVersion || ''}
                      onChange={(e) => updateDocument(index, 'updatedVersion', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="e.g., Rev B"
                    />
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={doc.updated}
                        onChange={(e) => updateDocument(index, 'updated', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Document Updated & Verified</span>
                    </label>
                  </div>
                  
                  <div className="text-sm text-gray-600">
                    {doc.verifiedBy && (
                      <span>Verified by: {doc.verifiedBy} on {new Date(doc.verifiedDate!).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                
                <div className="mt-2">
                  <input
                    type="text"
                    value={doc.notes || ''}
                    onChange={(e) => updateDocument(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Notes about version changes or updates"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Training Verification */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Training Verification</h2>
            <button
              type="button"
              onClick={addTrainingRecord}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
            >
              Add Training Record
            </button>
          </div>

          <div className="space-y-4">
            {trainingRecords.map((record, index) => (
              <div key={record.id} className="border border-gray-200 rounded-lg p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee Name
                    </label>
                    <input
                      type="text"
                      value={record.employeeName}
                      onChange={(e) => updateTrainingRecord(index, 'employeeName', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      value={record.employeeId}
                      onChange={(e) => updateTrainingRecord(index, 'employeeId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Employee ID number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department
                    </label>
                    <input
                      type="text"
                      value={record.department}
                      onChange={(e) => updateTrainingRecord(index, 'department', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Department"
                    />
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.trainingCompleted}
                        onChange={(e) => updateTrainingRecord(index, 'trainingCompleted', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Training Completed</span>
                    </label>
                    
                    {record.trainingCompleted && (
                      <input
                        type="date"
                        value={record.trainingDate}
                        onChange={(e) => updateTrainingRecord(index, 'trainingDate', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    )}
                  </div>
                  
                  <div className="flex items-center">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={record.recordFiled}
                        onChange={(e) => updateTrainingRecord(index, 'recordFiled', e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">Training Record Filed</span>
                    </label>
                  </div>
                </div>
                
                <div className="mt-2">
                  <input
                    type="text"
                    value={record.notes || ''}
                    onChange={(e) => updateTrainingRecord(index, 'notes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Training notes or special requirements"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Non-Conformance Notes */}
        {testItems.some(t => t.result === 'FAIL') && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-600">Non-Conformance Notes</h2>
            <textarea
              value={nonConformanceNotes}
              onChange={(e) => setNonConformanceNotes(e.target.value)}
              className="w-full px-3 py-2 border border-red-300 rounded-md"
              rows={4}
              placeholder="Document any test failures and corrective actions taken..."
            />
          </div>
        )}

        {/* Final Approvals */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-6">Final Approvals</h2>
          
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div key={approval.type} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{approval.type} Approval</h3>
                    {approval.approved && approval.signature && (
                      <p className="text-sm text-green-600 mt-1">
                        Approved by: {approval.signature}
                      </p>
                    )}
                  </div>
                  
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={approval.approved}
                      onChange={(e) => updateApproval(approval.type, 'approved', e.target.checked)}
                      disabled={session?.user?.role !== approval.type && session?.user?.role !== 'ADMIN'}
                      className="mr-3 h-5 w-5"
                    />
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      approval.approved 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {approval.approved ? 'Approved' : 'Pending'}
                    </span>
                  </label>
                </div>
                
                <div className="mt-3">
                  <input
                    type="text"
                    value={approval.comments || ''}
                    onChange={(e) => updateApproval(approval.type, 'comments', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="Approval comments (optional)"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <div>
            {canGenerateECN && (
              <button
                type="button"
                onClick={generateECN}
                disabled={generatingECN}
                className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 font-medium"
              >
                {generatingECN ? 'Generating ECN...' : 'Generate ECN'}
              </button>
            )}
          </div>
          
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Verification Data'}
            </button>
          </div>
        </div>
      </form>

      {/* Status Summary */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-2">Verification Status</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="flex justify-between">
            <span>Tests Passed:</span>
            <span className={testItems.every(t => t.result === 'PASS') ? 'text-green-600 font-medium' : 'text-red-600'}>
              {testItems.filter(t => t.result === 'PASS').length}/{testItems.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Docs Updated:</span>
            <span className={documents.every(d => d.updated) ? 'text-green-600 font-medium' : 'text-red-600'}>
              {documents.filter(d => d.updated).length}/{documents.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Training Complete:</span>
            <span className={trainingRecords.every(t => t.trainingCompleted && t.recordFiled) ? 'text-green-600 font-medium' : 'text-red-600'}>
              {trainingRecords.filter(t => t.trainingCompleted && t.recordFiled).length}/{trainingRecords.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Approvals:</span>
            <span className={approvals.every(a => a.approved) ? 'text-green-600 font-medium' : 'text-red-600'}>
              {approvals.filter(a => a.approved).length}/{approvals.length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}