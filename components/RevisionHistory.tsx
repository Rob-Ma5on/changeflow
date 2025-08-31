'use client';

import { useState } from 'react';

interface Revision {
  id: string;
  changedAt: string;
  revisionNote?: string;
  previousData: any;
  newData: any;
  changedFields: string[];
  user: {
    id: string;
    name: string;
    email: string;
  };
}

interface RevisionHistoryProps {
  revisions: Revision[];
  entityType: 'ECR' | 'ECO' | 'ECN';
}

const fieldDisplayNames: Record<string, string> = {
  title: 'Title',
  description: 'Description',
  status: 'Status',
  priority: 'Priority',
  assigneeId: 'Assignee',
  reason: 'Business Justification',
  customerImpact: 'Customer Impact',
  costImpact: 'Cost Impact',
  scheduleImpact: 'Schedule Impact',
  implementationPlan: 'Implementation Plan',
  testingPlan: 'Testing Plan',
  rollbackPlan: 'Rollback Plan',
  resourcesRequired: 'Resources Required',
  estimatedEffort: 'Estimated Effort',
  targetDate: 'Target Date',
  effectiveDate: 'Effective Date',
  distributedAt: 'Distributed At',
  changesImplemented: 'Changes Implemented',
  affectedItems: 'Affected Items',
  dispositionInstructions: 'Disposition Instructions',
  verificationMethod: 'Verification Method',
  distributionList: 'Distribution List',
  internalStakeholders: 'Internal Stakeholders',
  customerNotificationRequired: 'Customer Notification Required',
  notificationMethod: 'Notification Method',
  responseDeadline: 'Response Deadline',
  implementationStatus: 'Implementation Status',
  actualImplementationDate: 'Actual Implementation Date',
  finalDocumentationSummary: 'Final Documentation Summary',
  closureApprover: 'Closure Approver',
  closureDate: 'Closure Date',
  acknowledgmentStatus: 'Acknowledgment Status',
  affectedProducts: 'Affected Products',
  affectedDocuments: 'Affected Documents',
  estimatedCostRange: 'Estimated Cost Range',
  targetImplementationDate: 'Target Implementation Date',
  stakeholders: 'Stakeholders',
  effectivityType: 'Effectivity Type',
  materialDisposition: 'Material Disposition',
  documentUpdates: 'Document Updates',
  implementationTeam: 'Implementation Team',
  inventoryImpact: 'Inventory Impact',
  estimatedTotalCost: 'Estimated Total Cost'
};

function formatFieldValue(value: any, fieldName: string): string {
  if (value === null || value === undefined) return 'Not set';
  
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  
  if (fieldName.toLowerCase().includes('date') || fieldName.toLowerCase().includes('at')) {
    if (typeof value === 'string' && value.includes('T')) {
      return new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  }
  
  if (typeof value === 'number') {
    if (fieldName.toLowerCase().includes('cost')) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    }
  }
  
  return String(value);
}

function RevisionItem({ revision }: { revision: Revision }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-lg mb-4">
      <div 
        className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 dark:bg-gray-800 flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3">
          {isExpanded ? (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          )}
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900 dark:text-gray-100">{revision.user.name}</span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                modified {revision.changedFields.length} field{revision.changedFields.length > 1 ? 's' : ''}
              </span>
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {new Date(revision.changedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {revision.changedFields.join(', ')}
          </span>
        </div>
      </div>
      
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-600 p-4 bg-gray-50 dark:bg-gray-700">
          {revision.revisionNote && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">Revision Note</h4>
              <p className="text-sm text-gray-600 dark:text-gray-300">{revision.revisionNote}</p>
            </div>
          )}
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">Changed Fields</h4>
            {revision.changedFields.map((field) => (
              <div key={field} className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-600">
                <h5 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                  {fieldDisplayNames[field] || field}
                </h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">From:</span>
                    <div className="mt-1 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-800 dark:text-red-300">
                      {formatFieldValue(revision.previousData[field], field)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">To:</span>
                    <div className="mt-1 p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-green-800 dark:text-green-300">
                      {formatFieldValue(revision.newData[field], field)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function RevisionHistory({ revisions, entityType }: RevisionHistoryProps) {
  if (!revisions || revisions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">Revision History</h3>
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400">No revisions found for this {entityType}.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
        Revision History ({revisions.length} {revisions.length === 1 ? 'revision' : 'revisions'})
      </h3>
      <div className="space-y-0">
        {revisions.map((revision) => (
          <RevisionItem key={revision.id} revision={revision} />
        ))}
      </div>
    </div>
  );
}