'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { UserRole } from '@prisma/client';

interface Recipient {
  id: string;
  name: string;
  email: string;
  type: 'INTERNAL' | 'EXTERNAL';
  acknowledgeRequired: boolean;
  sentDate: string;
  openedDate?: string;
  acknowledgedDate?: string;
  status: 'SENT' | 'OPENED' | 'ACKNOWLEDGED' | 'OVERDUE';
  responseDeadline: string;
  remindersSent: number;
  escalated: boolean;
  escalationDate?: string;
  comments?: string;
}

interface ECN {
  id: string;
  ecnNumber: string;
  title: string;
  distributedDate: string;
  recipients: Recipient[];
  automaticEscalationEnabled: boolean;
  escalationRules: {
    reminderAfterHours: number;
    escalateAfterHours: number;
  };
}

interface EscalationHistory {
  id: string;
  recipientEmail: string;
  action: 'REMINDER' | 'ESCALATION';
  performedBy: string;
  performedDate: string;
  notes?: string;
}

export default function ECNTracking() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const ecnId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [ecn, setEcn] = useState<ECN | null>(null);
  const [escalationHistory, setEscalationHistory] = useState<EscalationHistory[]>([]);
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [sendingReminders, setSendingReminders] = useState(false);
  const [escalating, setEscalating] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchECNTracking();
    fetchEscalationHistory();
    
    // Set up automatic refresh every 30 seconds
    const interval = setInterval(fetchECNTracking, 30000);
    return () => clearInterval(interval);
  }, [ecnId]);

  const fetchECNTracking = async () => {
    try {
      const response = await fetch(`/api/ecn/${ecnId}/tracking`);
      if (response.ok) {
        const data = await response.json();
        setEcn(data);
      } else {
        router.push('/dashboard/ecn');
      }
    } catch (error) {
      console.error('Error fetching ECN tracking:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEscalationHistory = async () => {
    try {
      const response = await fetch(`/api/ecn/${ecnId}/escalation-history`);
      if (response.ok) {
        const data = await response.json();
        setEscalationHistory(data);
      }
    } catch (error) {
      console.error('Error fetching escalation history:', error);
    }
  };

  const calculateProgress = () => {
    if (!ecn?.recipients) return 0;
    const acknowledged = ecn.recipients.filter(r => r.status === 'ACKNOWLEDGED').length;
    const required = ecn.recipients.filter(r => r.acknowledgeRequired).length;
    return required === 0 ? 100 : Math.round((acknowledged / required) * 100);
  };

  const getStatusIcon = (status: string) => {
    const icons = {
      SENT: '📤',
      OPENED: '👁️',
      ACKNOWLEDGED: '✅',
      OVERDUE: '⚠️'
    };
    return icons[status as keyof typeof icons] || '📤';
  };

  const getStatusColor = (status: string) => {
    const colors = {
      SENT: 'bg-gray-100 text-gray-800',
      OPENED: 'bg-blue-100 text-blue-800',
      ACKNOWLEDGED: 'bg-green-100 text-green-800',
      OVERDUE: 'bg-red-100 text-red-800'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const isOverdue = (recipient: Recipient) => {
    if (!recipient.acknowledgeRequired || recipient.status === 'ACKNOWLEDGED') return false;
    return new Date() > new Date(recipient.responseDeadline);
  };

  const getTimeUntilDeadline = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffMs = deadlineDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 0) {
      return `${Math.abs(diffHours)} hours overdue`;
    } else if (diffHours < 24) {
      return `${diffHours} hours remaining`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} days remaining`;
    }
  };

  const handleRecipientSelect = (recipientId: string) => {
    setSelectedRecipients(prev =>
      prev.includes(recipientId)
        ? prev.filter(id => id !== recipientId)
        : [...prev, recipientId]
    );
  };

  const handleSelectAll = () => {
    if (selectedRecipients.length === ecn?.recipients.length) {
      setSelectedRecipients([]);
    } else {
      setSelectedRecipients(ecn?.recipients.map(r => r.id) || []);
    }
  };

  const sendReminder = async (recipientIds: string[]) => {
    setSendingReminders(true);
    try {
      const response = await fetch(`/api/ecn/${ecnId}/send-reminder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientIds })
      });

      if (response.ok) {
        alert(`Reminders sent to ${recipientIds.length} recipients`);
        fetchECNTracking();
        fetchEscalationHistory();
        setSelectedRecipients([]);
      } else {
        const error = await response.json();
        alert(`Error sending reminders: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending reminders:', error);
      alert('Error sending reminders');
    } finally {
      setSendingReminders(false);
    }
  };

  const escalateToManager = async (recipientIds: string[]) => {
    setEscalating(true);
    try {
      const response = await fetch(`/api/ecn/${ecnId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientIds })
      });

      if (response.ok) {
        alert(`Escalated to managers for ${recipientIds.length} recipients`);
        fetchECNTracking();
        fetchEscalationHistory();
        setSelectedRecipients([]);
      } else {
        const error = await response.json();
        alert(`Error escalating: ${error.error}`);
      }
    } catch (error) {
      console.error('Error escalating:', error);
      alert('Error escalating');
    } finally {
      setEscalating(false);
    }
  };

  const exportReport = async (format: 'excel' | 'pdf') => {
    setExporting(true);
    try {
      const response = await fetch(`/api/ecn/${ecnId}/export-report?format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ECN_${ecn?.ecnNumber}_tracking_report.${format === 'excel' ? 'xlsx' : 'pdf'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Error generating report');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Error exporting report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading ECN tracking...</div>;
  }

  if (!ecn) {
    return <div className="text-center py-8">ECN not found</div>;
  }

  // Check if user has DOCUMENT_CONTROL role
  if (session?.user?.role !== 'DOCUMENT_CONTROL' && session?.user?.role !== 'ADMIN') {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Only Document Control personnel can access ECN tracking</p>
      </div>
    );
  }

  const progress = calculateProgress();
  const overdueCount = ecn.recipients.filter(r => isOverdue(r)).length;
  const acknowledgedCount = ecn.recipients.filter(r => r.status === 'ACKNOWLEDGED').length;
  const requiredCount = ecn.recipients.filter(r => r.acknowledgeRequired).length;

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">ECN Distribution Tracking</h1>
        <p className="text-gray-600">ECN {ecn.ecnNumber}</p>
        <div className="mt-2 text-sm text-gray-500">
          Distributed: {new Date(ecn.distributedDate).toLocaleDateString()} at {new Date(ecn.distributedDate).toLocaleTimeString()}
        </div>
      </div>

      {/* Progress Overview */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Acknowledgment Status</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{progress}%</div>
            <div className="text-sm text-gray-600">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{acknowledgedCount}</div>
            <div className="text-sm text-gray-600">Acknowledged</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-600">{ecn.recipients.length}</div>
            <div className="text-sm text-gray-600">Total Recipients</div>
          </div>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-4">
          <div 
            className="bg-blue-600 h-4 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {acknowledgedCount} of {requiredCount} required acknowledgments received
        </p>
      </div>

      {/* Action Buttons */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">
              {selectedRecipients.length} selected
            </span>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {selectedRecipients.length === ecn.recipients.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => sendReminder(selectedRecipients)}
              disabled={selectedRecipients.length === 0 || sendingReminders}
              className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              {sendingReminders ? 'Sending...' : 'Send Reminder'}
            </button>
            
            <button
              onClick={() => escalateToManager(selectedRecipients)}
              disabled={selectedRecipients.length === 0 || escalating}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {escalating ? 'Escalating...' : 'Escalate'}
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => exportReport('excel')}
                disabled={exporting}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Excel Report
              </button>
              <button
                onClick={() => exportReport('pdf')}
                disabled={exporting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recipients Table */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Recipients</h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedRecipients.length === ecn.recipients.length}
                    onChange={handleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opened
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acknowledged
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deadline
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reminders
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ecn.recipients.map((recipient) => {
                const overdue = isOverdue(recipient);
                return (
                  <tr key={recipient.id} className={overdue ? 'bg-red-50' : ''}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRecipients.includes(recipient.id)}
                        onChange={() => handleRecipientSelect(recipient.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
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
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(recipient.sentDate).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-gray-500">
                        {new Date(recipient.sentDate).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {recipient.openedDate ? (
                        <>
                          {new Date(recipient.openedDate).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-gray-500">
                            {new Date(recipient.openedDate).toLocaleTimeString()}
                          </span>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {recipient.acknowledgedDate ? (
                        <>
                          {new Date(recipient.acknowledgedDate).toLocaleDateString()}
                          <br />
                          <span className="text-xs text-gray-500">
                            {new Date(recipient.acknowledgedDate).toLocaleTimeString()}
                          </span>
                        </>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="mr-2">{getStatusIcon(recipient.status)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(recipient.status)}`}>
                          {recipient.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {recipient.acknowledgeRequired ? (
                        <div className={overdue ? 'text-red-600 font-medium' : 'text-gray-600'}>
                          {new Date(recipient.responseDeadline).toLocaleDateString()}
                          <br />
                          <span className="text-xs">
                            {getTimeUntilDeadline(recipient.responseDeadline)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm text-gray-600">{recipient.remindersSent}</span>
                      {recipient.escalated && (
                        <div className="text-xs text-orange-600 mt-1">Escalated</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => sendReminder([recipient.id])}
                          disabled={recipient.status === 'ACKNOWLEDGED' || sendingReminders}
                          className="text-yellow-600 hover:text-yellow-800 text-sm disabled:opacity-50"
                        >
                          Remind
                        </button>
                        <button
                          onClick={() => escalateToManager([recipient.id])}
                          disabled={recipient.status === 'ACKNOWLEDGED' || escalating}
                          className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                        >
                          Escalate
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Escalation History */}
      {escalationHistory.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Escalation History</h2>
          
          <div className="space-y-3">
            {escalationHistory.map((entry) => (
              <div key={entry.id} className="flex items-start p-3 border border-gray-200 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 mr-3 ${
                  entry.action === 'REMINDER' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">
                      {entry.action === 'REMINDER' ? 'Reminder Sent' : 'Escalated to Manager'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(entry.performedDate).toLocaleDateString()} {new Date(entry.performedDate).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Recipient: {entry.recipientEmail} | Performed by: {entry.performedBy}
                  </p>
                  {entry.notes && (
                    <p className="text-sm text-gray-500 mt-1">{entry.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Automatic Escalation Rules */}
      {ecn.automaticEscalationEnabled && (
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-medium text-blue-900 mb-2">Automatic Escalation Rules</h3>
          <div className="text-sm text-blue-800">
            <p>• Automatic reminder sent after {ecn.escalationRules.reminderAfterHours} hours without response</p>
            <p>• Automatic escalation to manager after {ecn.escalationRules.escalateAfterHours} hours without response</p>
          </div>
        </div>
      )}
    </div>
  );
}