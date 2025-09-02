'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface ECO {
  id: string;
  ecoNumber: string;
  title: string;
  workInstructions: string;
  effectiveDate?: string;
  implementationDate: string;
  partsToAdd: any[];
  partsToRemove: any[];
  partsToModify: any[];
  drawingsToRevise: string[];
  proceduresToUpdate: string[];
  trainingMaterials: string[];
  sourceECRs: Array<{
    id: string;
    title: string;
    justification: string;
  }>;
}

interface Recipient {
  id: string;
  type: 'INTERNAL' | 'EXTERNAL';
  name: string;
  email: string;
  acknowledgeRequired: boolean;
  responseDeadline: string;
}

const responseDeadlineOptions = [
  { value: '24h', label: '24 Hours', hours: 24 },
  { value: '48h', label: '48 Hours', hours: 48 },
  { value: '72h', label: '72 Hours', hours: 72 },
  { value: '5d', label: '5 Business Days', hours: 120 },
  { value: '10d', label: '10 Business Days', hours: 240 },
  { value: '30d', label: '30 Days', hours: 720 }
];

export default function CreateECNFromECO() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [eco, setEco] = useState<ECO | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  
  // Form state
  const [ecnNumber, setEcnNumber] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [implementationDate, setImplementationDate] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [defaultDeadline, setDefaultDeadline] = useState('48h');

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const ecoId = urlParams.get('ecoId');
    
    if (ecoId) {
      fetchECO(ecoId);
    } else {
      router.push('/dashboard/eco');
    }
    
    fetchUsers();
  }, []);

  useEffect(() => {
    if (eco) {
      autoPopulateFromECO();
    }
  }, [eco]);

  const fetchECO = async (ecoId: string) => {
    try {
      const response = await fetch(`/api/eco/${ecoId}`);
      if (response.ok) {
        const data = await response.json();
        setEco(data);
      } else {
        alert('ECO not found or not ready for ECN generation');
        router.push('/dashboard/eco');
      }
    } catch (error) {
      console.error('Error fetching ECO:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const autoPopulateFromECO = () => {
    if (!eco) return;

    // Generate ECN number (same as ECO)
    setEcnNumber(eco.ecoNumber);
    
    // Create change summary
    const summary = `Implementation of ${eco.title}. ${eco.sourceECRs.map(ecr => ecr.justification).join(' ')}`;
    setChangeSummary(summary);
    
    // Set implementation date
    setImplementationDate(eco.effectiveDate || eco.implementationDate || new Date().toISOString().split('T')[0]);
    
    // Generate email subject
    setEmailSubject(`ECN ${eco.ecoNumber}: ${eco.title}`);
    
    // Generate email body template
    const bodyTemplate = `Dear Recipient,

This Engineering Change Notice (ECN ${eco.ecoNumber}) notifies you of the following change:

**Change Summary:**
${summary}

**What Changed:**
${generateWhatChanged()}

**When Effective:**
${eco.effectiveDate ? new Date(eco.effectiveDate).toLocaleDateString() : 'Immediately upon receipt'}

**Required Actions:**
- Review this change notice
- Update your local documentation
- Inform your team of the changes
- Acknowledge receipt by clicking the link below

Please acknowledge receipt of this ECN by the specified deadline.

Best regards,
Document Control Team`;
    
    setEmailBody(bodyTemplate);
    
    // Auto-populate attachments list
    const attachmentList = [
      ...eco.drawingsToRevise.filter(Boolean),
      ...eco.proceduresToUpdate.filter(Boolean),
      ...eco.trainingMaterials.filter(Boolean)
    ];
    setAttachments(attachmentList);
  };

  const generateWhatChanged = () => {
    const changes = [];
    
    if (eco?.partsToAdd?.length) {
      changes.push(`Added Parts: ${eco.partsToAdd.map(p => p.partNumber).join(', ')}`);
    }
    if (eco?.partsToRemove?.length) {
      changes.push(`Removed Parts: ${eco.partsToRemove.map(p => p.partNumber).join(', ')}`);
    }
    if (eco?.partsToModify?.length) {
      changes.push(`Modified Parts: ${eco.partsToModify.map(p => p.old.partNumber).join(', ')}`);
    }
    if (eco?.drawingsToRevise?.length) {
      changes.push(`Updated Drawings: ${eco.drawingsToRevise.filter(Boolean).join(', ')}`);
    }
    if (eco?.proceduresToUpdate?.length) {
      changes.push(`Updated Procedures: ${eco.proceduresToUpdate.filter(Boolean).join(', ')}`);
    }
    
    return changes.join('\n');
  };

  const addInternalRecipient = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (!user || recipients.find(r => r.id === userId)) return;
    
    const newRecipient: Recipient = {
      id: user.id,
      type: 'INTERNAL',
      name: user.name,
      email: user.email,
      acknowledgeRequired: true,
      responseDeadline: defaultDeadline
    };
    
    setRecipients([...recipients, newRecipient]);
  };

  const addExternalRecipient = (email: string, name: string) => {
    if (!email.trim() || recipients.find(r => r.email === email)) return;
    
    const newRecipient: Recipient = {
      id: `ext-${Date.now()}`,
      type: 'EXTERNAL',
      name: name.trim() || email.split('@')[0],
      email: email.trim(),
      acknowledgeRequired: true,
      responseDeadline: defaultDeadline
    };
    
    setRecipients([...recipients, newRecipient]);
  };

  const updateRecipient = (id: string, field: keyof Recipient, value: any) => {
    setRecipients(recipients.map(r =>
      r.id === id ? { ...r, [field]: value } : r
    ));
  };

  const removeRecipient = (id: string) => {
    setRecipients(recipients.filter(r => r.id !== id));
  };

  const addAttachment = () => {
    setAttachments([...attachments, '']);
  };

  const updateAttachment = (index: number, value: string) => {
    const updated = [...attachments];
    updated[index] = value;
    setAttachments(updated);
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (recipients.length === 0) {
      alert('Please add at least one recipient');
      return;
    }

    setSubmitting(true);

    try {
      const ecnData = {
        ecoId: eco?.id,
        ecnNumber,
        changeSummary,
        implementationDate,
        recipients: recipients.map(r => ({
          ...r,
          responseDeadlineHours: responseDeadlineOptions.find(opt => opt.value === r.responseDeadline)?.hours || 48
        })),
        emailSubject,
        emailBody,
        attachments: attachments.filter(Boolean),
        specialInstructions
      };

      const response = await fetch('/api/ecn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ecnData)
      });

      if (response.ok) {
        const ecn = await response.json();
        alert('ECN created and distributed successfully');
        router.push(`/dashboard/ecn/${ecn.id}/tracking`);
      } else {
        const error = await response.json();
        alert(`Error creating ECN: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating ECN:', error);
      alert('Error creating ECN');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading ECO data...</div>;
  }

  if (!eco) {
    return <div className="text-center py-8">ECO not found</div>;
  }

  // Check if user has DOCUMENT_CONTROL role
  if (session?.user?.role !== 'DOCUMENT_CONTROL' && session?.user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Only Document Control personnel can create ECNs</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Engineering Change Notice</h1>
        <p className="text-gray-600">Generate ECN from completed ECO: {eco.ecoNumber}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Auto-populated ECN Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">ECN Information</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ECN Number
              </label>
              <input
                type="text"
                value={ecnNumber}
                onChange={(e) => setEcnNumber(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                readOnly
              />
              <p className="text-xs text-gray-500 mt-1">Auto-generated from ECO number</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Implementation Date
              </label>
              <input
                type="date"
                value={implementationDate}
                onChange={(e) => setImplementationDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Change Summary
              </label>
              <textarea
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                required
              />
            </div>
          </div>
        </div>

        {/* Affected Parts/Documents */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Affected Parts & Documents</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Parts Changes</h3>
              <div className="space-y-2 text-sm">
                {eco.partsToAdd?.length > 0 && (
                  <div>
                    <span className="font-medium text-green-600">Added:</span>
                    <ul className="ml-4 list-disc">
                      {eco.partsToAdd.map((part, idx) => (
                        <li key={idx}>{part.partNumber} - {part.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {eco.partsToRemove?.length > 0 && (
                  <div>
                    <span className="font-medium text-red-600">Removed:</span>
                    <ul className="ml-4 list-disc">
                      {eco.partsToRemove.map((part, idx) => (
                        <li key={idx}>{part.partNumber} - {part.description}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {eco.partsToModify?.length > 0 && (
                  <div>
                    <span className="font-medium text-blue-600">Modified:</span>
                    <ul className="ml-4 list-disc">
                      {eco.partsToModify.map((part, idx) => (
                        <li key={idx}>{part.old.partNumber} → {part.new.partNumber}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Document Updates</h3>
              <div className="space-y-2 text-sm">
                {eco.drawingsToRevise?.filter(Boolean).length > 0 && (
                  <div>
                    <span className="font-medium">Drawings:</span>
                    <ul className="ml-4 list-disc">
                      {eco.drawingsToRevise.filter(Boolean).map((drawing, idx) => (
                        <li key={idx}>{drawing}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {eco.proceduresToUpdate?.filter(Boolean).length > 0 && (
                  <div>
                    <span className="font-medium">Procedures:</span>
                    <ul className="ml-4 list-disc">
                      {eco.proceduresToUpdate.filter(Boolean).map((procedure, idx) => (
                        <li key={idx}>{procedure}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {eco.trainingMaterials?.filter(Boolean).length > 0 && (
                  <div>
                    <span className="font-medium">Training:</span>
                    <ul className="ml-4 list-disc">
                      {eco.trainingMaterials.filter(Boolean).map((material, idx) => (
                        <li key={idx}>{material}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Distribution Planning */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Distribution Planning</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Internal Recipients
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addInternalRecipient(e.target.value);
                    e.target.value = '';
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a user...</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email}) - {user.department}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add External Recipients
              </label>
              <div className="flex space-x-2">
                <input
                  type="email"
                  placeholder="email@company.com"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const target = e.target as HTMLInputElement;
                      const nameInput = target.parentElement?.nextElementSibling?.querySelector('input') as HTMLInputElement;
                      addExternalRecipient(target.value, nameInput?.value || '');
                      target.value = '';
                      if (nameInput) nameInput.value = '';
                    }
                  }}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
                <input
                  type="text"
                  placeholder="Name (optional)"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Press Enter to add</p>
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Recipients ({recipients.length})</h3>
              <div className="flex items-center space-x-2">
                <label className="text-sm text-gray-600">Default Deadline:</label>
                <select
                  value={defaultDeadline}
                  onChange={(e) => setDefaultDeadline(e.target.value)}
                  className="px-2 py-1 border border-gray-300 rounded text-sm"
                >
                  {responseDeadlineOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Ack Required
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deadline
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recipients.map((recipient) => (
                    <tr key={recipient.id}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {recipient.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {recipient.email}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          recipient.type === 'INTERNAL' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {recipient.type}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={recipient.acknowledgeRequired}
                          onChange={(e) => updateRecipient(recipient.id, 'acknowledgeRequired', e.target.checked)}
                          className="rounded"
                        />
                      </td>
                      <td className="px-4 py-3">
                        {recipient.acknowledgeRequired && (
                          <select
                            value={recipient.responseDeadline}
                            onChange={(e) => updateRecipient(recipient.id, 'responseDeadline', e.target.value)}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          >
                            {responseDeadlineOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeRecipient(recipient.id)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Notification Content */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Notification Content</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Subject
              </label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Body
              </label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm"
                rows={12}
                required
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Attachments (Document References)
                </label>
                <button
                  type="button"
                  onClick={addAttachment}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                >
                  Add Attachment
                </button>
              </div>
              
              <div className="space-y-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={attachment}
                      onChange={(e) => updateAttachment(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Document name or reference"
                    />
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="px-3 py-2 text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                placeholder="Any special instructions for recipients..."
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || recipients.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? 'Creating & Sending ECN...' : 'Create & Send ECN'}
          </button>
        </div>
      </form>
    </div>
  );
}