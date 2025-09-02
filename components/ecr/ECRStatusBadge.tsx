'use client';

import React from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { UserRole } from '@prisma/client';
import { getAllowedActions, type Action } from '../../lib/permissions';

interface ECRStatusBadgeProps {
  ecrId: string;
  status: string;
  submitterId: string;
  assigneeId?: string;
  createdAt: string;
  userRole?: UserRole;
  submitterDepartment?: string;
  userDepartment?: string;
}

const statusConfig = {
  'DRAFT': {
    label: 'Draft',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'Being prepared by requestor'
  },
  'SUBMITTED': {
    label: 'Submitted',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Awaiting initial review'
  },
  'UNDER_REVIEW': {
    label: 'Under Review',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'Being reviewed by engineering'
  },
  'ANALYSIS': {
    label: 'Analysis',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    description: 'Cross-functional analysis in progress'
  },
  'PENDING_APPROVAL': {
    label: 'Pending Approval',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Awaiting management approval'
  },
  'APPROVED': {
    label: 'Approved',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'Approved for implementation'
  },
  'REJECTED': {
    label: 'Rejected',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'Request rejected'
  },
  'ON_HOLD': {
    label: 'On Hold',
    color: 'bg-gray-100 text-gray-700 border-gray-400',
    description: 'Temporarily paused'
  },
  'MORE_INFO_REQUIRED': {
    label: 'More Info Required',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Additional information needed'
  },
  'CLOSED': {
    label: 'Closed',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    description: 'Request closed'
  }
};

const getNextStep = (status: string, userRole?: UserRole): string => {
  if (!userRole) return '';
  
  const nextSteps: Record<string, Record<UserRole, string>> = {
    'SUBMITTED': {
      'ENGINEER': 'Conduct engineering review',
      'MANAGER': 'Assign to engineer',
      'ADMIN': 'Assign or review',
      'QUALITY': '',
      'MANUFACTURING': '',
      'REQUESTOR': 'Await engineering review',
      'DOCUMENT_CONTROL': '',
      'VIEWER': ''
    },
    'UNDER_REVIEW': {
      'ENGINEER': 'Complete technical review',
      'MANAGER': 'Monitor review progress',
      'ADMIN': 'Monitor review progress',
      'QUALITY': 'Prepare for analysis phase',
      'MANUFACTURING': 'Prepare for analysis phase',
      'REQUESTOR': 'Await review completion',
      'DOCUMENT_CONTROL': '',
      'VIEWER': ''
    },
    'ANALYSIS': {
      'ENGINEER': 'Complete engineering analysis',
      'QUALITY': 'Complete quality analysis',
      'MANUFACTURING': 'Complete manufacturing analysis',
      'MANAGER': 'Complete financial analysis',
      'ADMIN': 'Monitor analysis progress',
      'REQUESTOR': 'Await analysis completion',
      'DOCUMENT_CONTROL': '',
      'VIEWER': ''
    },
    'PENDING_APPROVAL': {
      'MANAGER': 'Review and approve/reject',
      'ADMIN': 'Review and approve/reject',
      'ENGINEER': 'Await management decision',
      'QUALITY': 'Await management decision',
      'MANUFACTURING': 'Await management decision',
      'REQUESTOR': 'Await management decision',
      'DOCUMENT_CONTROL': '',
      'VIEWER': ''
    },
    'MORE_INFO_REQUIRED': {
      'REQUESTOR': 'Provide additional information',
      'ENGINEER': 'Assist with information',
      'MANAGER': 'Await information update',
      'ADMIN': 'Monitor information gathering',
      'QUALITY': '',
      'MANUFACTURING': '',
      'DOCUMENT_CONTROL': '',
      'VIEWER': ''
    }
  };

  return nextSteps[status]?.[userRole] || '';
};

const getActionButton = (
  status: string, 
  userRole?: UserRole, 
  ecrId?: string, 
  isOwner?: boolean
): { label: string; href: string; primary: boolean } | null => {
  if (!userRole || !ecrId) return null;

  switch (status) {
    case 'DRAFT':
      if (userRole === 'REQUESTOR' && isOwner) {
        return { label: 'Continue Editing', href: `/dashboard/ecr/new?id=${ecrId}`, primary: true };
      }
      break;
    case 'SUBMITTED':
      if (userRole === 'ENGINEER') {
        return { label: 'Start Review', href: `/dashboard/ecr/${ecrId}/review`, primary: true };
      }
      break;
    case 'UNDER_REVIEW':
      if (userRole === 'ENGINEER') {
        return { label: 'Continue Review', href: `/dashboard/ecr/${ecrId}/review`, primary: true };
      }
      break;
    case 'ANALYSIS':
      if (['ENGINEER', 'QUALITY', 'MANUFACTURING', 'MANAGER'].includes(userRole)) {
        return { label: 'Complete Analysis', href: `/dashboard/ecr/${ecrId}/analysis`, primary: true };
      }
      break;
    case 'PENDING_APPROVAL':
      if (['MANAGER', 'ADMIN'].includes(userRole)) {
        return { label: 'Review & Approve', href: `/dashboard/ecr/${ecrId}/approve`, primary: true };
      }
      break;
    case 'MORE_INFO_REQUIRED':
      if (userRole === 'REQUESTOR' && isOwner) {
        return { label: 'Update Request', href: `/dashboard/ecr/new?id=${ecrId}`, primary: true };
      }
      break;
  }

  return null;
};

const calculateTimeInStatus = (createdAt: string): string => {
  const created = new Date(createdAt);
  const now = new Date();
  const diffMs = now.getTime() - created.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays} day${diffDays === 1 ? '' : 's'}`;
  } else if (diffHours > 0) {
    return `${diffHours} hour${diffHours === 1 ? '' : 's'}`;
  } else {
    return 'Less than 1 hour';
  }
};

export default function ECRStatusBadge({
  ecrId,
  status,
  submitterId,
  assigneeId,
  createdAt,
  userRole,
  submitterDepartment,
  userDepartment
}: ECRStatusBadgeProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  
  const config = statusConfig[status as keyof typeof statusConfig] || {
    label: status,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'Unknown status'
  };

  const isOwner = userId === submitterId || userId === assigneeId;
  const timeInStatus = calculateTimeInStatus(createdAt);
  const nextStep = getNextStep(status, userRole);
  const actionButton = getActionButton(status, userRole, ecrId, isOwner);

  const context = {
    isOwner,
    entityStatus: status,
    userDepartment,
    entityDepartment: submitterDepartment
  };

  const allowedActions = userRole ? getAllowedActions(userRole, 'ECR', context) : [];
  const canAct = allowedActions.length > 0 && actionButton;

  return (
    <div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-sm">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.color}`}>
            {config.label}
          </span>
          {canAct && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
              Action Required
            </span>
          )}
        </div>
        
        <div className="text-sm text-gray-600">
          <p className="font-medium">{config.description}</p>
          <p className="text-xs text-gray-500">In status for {timeInStatus}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {nextStep && (
          <div className="text-right text-sm">
            <p className="text-gray-600">Next Step:</p>
            <p className="font-medium text-gray-900">{nextStep}</p>
          </div>
        )}
        
        {actionButton && (
          <Link
            href={actionButton.href}
            className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              actionButton.primary
                ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2'
            }`}
          >
            {actionButton.label}
          </Link>
        )}
      </div>
    </div>
  );
}