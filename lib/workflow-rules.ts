import { UserRole, ECRStatus, ECOStatus, ECNStatus } from '@prisma/client';

// Status transition definitions
export interface StatusTransition {
  from: string;
  to: string;
  requiredRoles: UserRole[];
  conditions?: {
    requiresApproval?: boolean;
    requiresAssessment?: boolean;
    requiresAllApprovals?: boolean;
    fieldValidations?: string[];
    customValidation?: (entity: any, user: any) => boolean;
  };
  description: string;
}

// ECR Status Workflow Rules
export const ECR_WORKFLOW_RULES: StatusTransition[] = [
  {
    from: 'DRAFT',
    to: 'SUBMITTED',
    requiredRoles: ['REQUESTOR', 'ENGINEER', 'MANAGER', 'ADMIN'],
    conditions: {
      fieldValidations: ['title', 'description', 'reason', 'priority', 'customerImpact']
    },
    description: 'Submit ECR for review - requires basic information'
  },
  {
    from: 'SUBMITTED',
    to: 'UNDER_REVIEW',
    requiredRoles: ['ENGINEER', 'MANAGER', 'ADMIN'],
    description: 'Start technical review process'
  },
  {
    from: 'UNDER_REVIEW',
    to: 'IN_ANALYSIS',
    requiredRoles: ['ENGINEER', 'ADMIN'],
    conditions: {
      requiresAssessment: true,
      fieldValidations: ['technicalAssessment']
    },
    description: 'Move to detailed analysis phase - requires technical assessment'
  },
  {
    from: 'UNDER_REVIEW',
    to: 'APPROVED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Direct approval from review - simplified workflow'
  },
  {
    from: 'IN_ANALYSIS',
    to: 'PENDING_APPROVAL',
    requiredRoles: ['ENGINEER', 'ADMIN'],
    conditions: {
      fieldValidations: ['technicalAssessment', 'resourceRequirements', 'timelineEstimate', 'riskAssessment']
    },
    description: 'Ready for management approval - requires complete analysis'
  },
  {
    from: 'PENDING_APPROVAL',
    to: 'APPROVED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    conditions: {
      requiresApproval: true,
      fieldValidations: ['approvalComments']
    },
    description: 'Approve ECR for implementation'
  },
  {
    from: 'PENDING_APPROVAL',
    to: 'REJECTED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    conditions: {
      fieldValidations: ['approvalComments']
    },
    description: 'Reject ECR with comments'
  },
  {
    from: 'APPROVED',
    to: 'IMPLEMENTED',
    requiredRoles: ['ADMIN'], // System automatic transition
    conditions: {
      customValidation: (ecr: any) => !!ecr.ecoId
    },
    description: 'Automatically set when linked ECO is completed'
  },
  {
    from: 'DRAFT',
    to: 'CANCELLED',
    requiredRoles: ['REQUESTOR', 'MANAGER', 'ADMIN'],
    description: 'Cancel ECR before submission'
  },
  {
    from: 'SUBMITTED',
    to: 'CANCELLED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Cancel submitted ECR'
  },
  {
    from: 'UNDER_REVIEW',
    to: 'CANCELLED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Cancel ECR during review'
  },
  {
    from: 'APPROVED',
    to: 'CONVERTED',
    requiredRoles: ['ADMIN'], // System automatic transition
    description: 'Automatically set when ECO is created from this ECR'
  }
];

// ECO Status Workflow Rules
export const ECO_WORKFLOW_RULES: StatusTransition[] = [
  {
    from: 'DRAFT',
    to: 'PLANNING',
    requiredRoles: ['ENGINEER', 'ADMIN'],
    conditions: {
      fieldValidations: ['title', 'description', 'implementationPlan']
    },
    description: 'Move to planning phase - requires basic implementation plan'
  },
  {
    from: 'PLANNING',
    to: 'APPROVED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    conditions: {
      requiresApproval: true,
      fieldValidations: ['implementationPlan', 'testingPlan', 'resourcesRequired', 'estimatedEffort', 'targetDate']
    },
    description: 'Approve ECO for execution - requires complete planning'
  },
  {
    from: 'APPROVED',
    to: 'IN_PROGRESS',
    requiredRoles: ['ENGINEER', 'MANUFACTURING', 'ADMIN'],
    conditions: {
      fieldValidations: ['detailedSchedule', 'resourceAllocation']
    },
    description: 'Start ECO implementation - requires detailed execution plan'
  },
  {
    from: 'IN_PROGRESS',
    to: 'REVIEW',
    requiredRoles: ['ENGINEER', 'MANUFACTURING', 'ADMIN'],
    conditions: {
      fieldValidations: ['actualHours']
    },
    description: 'Submit for quality review'
  },
  {
    from: 'REVIEW',
    to: 'COMPLETED',
    requiredRoles: ['QUALITY', 'MANAGER', 'ADMIN'],
    conditions: {
      requiresAllApprovals: true,
      customValidation: (eco: any) => eco.qualityApproval && eco.engineeringApproval && eco.manufacturingApproval
    },
    description: 'Complete ECO - requires all department approvals'
  },
  {
    from: 'BACKLOG',
    to: 'PLANNING',
    requiredRoles: ['ENGINEER', 'MANAGER', 'ADMIN'],
    description: 'Move from backlog to active planning'
  },
  {
    from: 'PLANNING',
    to: 'BACKLOG',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Move back to backlog'
  },
  {
    from: 'DRAFT',
    to: 'CANCELLED',
    requiredRoles: ['ENGINEER', 'MANAGER', 'ADMIN'],
    description: 'Cancel ECO before approval'
  },
  {
    from: 'PLANNING',
    to: 'CANCELLED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Cancel ECO during planning'
  },
  {
    from: 'APPROVED',
    to: 'CANCELLED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Cancel approved ECO'
  },
  {
    from: 'IN_PROGRESS',
    to: 'CANCELLED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Cancel ECO during implementation'
  }
];

// ECN Status Workflow Rules
export const ECN_WORKFLOW_RULES: StatusTransition[] = [
  {
    from: 'DRAFT',
    to: 'PENDING_APPROVAL',
    requiredRoles: ['DOCUMENT_CONTROL', 'ADMIN'],
    conditions: {
      fieldValidations: ['title', 'description', 'distributionList', 'internalStakeholders']
    },
    description: 'Submit ECN for approval'
  },
  {
    from: 'PENDING_APPROVAL',
    to: 'APPROVED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Approve ECN for distribution'
  },
  {
    from: 'APPROVED',
    to: 'DISTRIBUTED',
    requiredRoles: ['DOCUMENT_CONTROL', 'ADMIN'],
    conditions: {
      fieldValidations: ['distributionList']
    },
    description: 'Distribute ECN to stakeholders'
  },
  {
    from: 'DISTRIBUTED',
    to: 'EFFECTIVE',
    requiredRoles: ['DOCUMENT_CONTROL', 'MANAGER', 'ADMIN'],
    conditions: {
      fieldValidations: ['effectiveDate'],
      customValidation: (ecn: any) => new Date(ecn.effectiveDate) <= new Date()
    },
    description: 'ECN becomes effective - must reach effective date'
  },
  {
    from: 'DRAFT',
    to: 'CANCELLED',
    requiredRoles: ['DOCUMENT_CONTROL', 'MANAGER', 'ADMIN'],
    description: 'Cancel ECN before approval'
  },
  {
    from: 'PENDING_APPROVAL',
    to: 'CANCELLED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Cancel ECN during approval'
  },
  {
    from: 'APPROVED',
    to: 'CANCELLED',
    requiredRoles: ['MANAGER', 'ADMIN'],
    description: 'Cancel approved ECN'
  }
];

// Combined workflow rules
export const WORKFLOW_RULES = {
  ECR: ECR_WORKFLOW_RULES,
  ECO: ECO_WORKFLOW_RULES,
  ECN: ECN_WORKFLOW_RULES,
} as const;

export type EntityType = keyof typeof WORKFLOW_RULES;

// Helper function to get valid transitions for current status
export function getValidTransitions(
  entityType: EntityType,
  currentStatus: string,
  userRole: UserRole
): StatusTransition[] {
  const rules = WORKFLOW_RULES[entityType];
  
  return rules.filter(rule => 
    rule.from === currentStatus && 
    rule.requiredRoles.includes(userRole)
  );
}

// Helper function to validate status transition
export function validateTransition(
  entityType: EntityType,
  fromStatus: string,
  toStatus: string,
  userRole: UserRole,
  entity?: any,
  user?: any
): { valid: boolean; rule?: StatusTransition; errors: string[] } {
  const rules = WORKFLOW_RULES[entityType];
  const errors: string[] = [];
  
  // Find the transition rule
  const rule = rules.find(r => r.from === fromStatus && r.to === toStatus);
  
  if (!rule) {
    errors.push(`Invalid transition from ${fromStatus} to ${toStatus}`);
    return { valid: false, errors };
  }
  
  // Check role permission
  if (!rule.requiredRoles.includes(userRole)) {
    errors.push(`Role ${userRole} is not authorized for this transition`);
    return { valid: false, rule, errors };
  }
  
  // Check conditions if entity is provided
  if (rule.conditions && entity) {
    const { conditions } = rule;
    
    // Check required fields
    if (conditions.fieldValidations) {
      for (const field of conditions.fieldValidations) {
        if (!entity[field] || (typeof entity[field] === 'string' && entity[field].trim() === '')) {
          errors.push(`Field '${field}' is required for this transition`);
        }
      }
    }
    
    // Check custom validation
    if (conditions.customValidation && !conditions.customValidation(entity, user)) {
      errors.push('Custom validation failed for this transition');
    }
    
    // Check approval requirements
    if (conditions.requiresApproval && !entity.approverId) {
      errors.push('Approval is required for this transition');
    }
    
    // Check all approvals for ECO completion
    if (conditions.requiresAllApprovals) {
      if (!entity.qualityApproval) errors.push('Quality approval is required');
      if (!entity.engineeringApproval) errors.push('Engineering approval is required');  
      if (!entity.manufacturingApproval) errors.push('Manufacturing approval is required');
    }
  }
  
  return {
    valid: errors.length === 0,
    rule,
    errors
  };
}

// Helper function to get next possible statuses
export function getNextStatuses(
  entityType: EntityType,
  currentStatus: string,
  userRole: UserRole
): { status: string; description: string; requiresValidation: boolean }[] {
  const transitions = getValidTransitions(entityType, currentStatus, userRole);
  
  return transitions.map(rule => ({
    status: rule.to,
    description: rule.description,
    requiresValidation: !!rule.conditions
  }));
}

// Helper function to check if status transition requires specific fields
export function getRequiredFields(
  entityType: EntityType,
  fromStatus: string,
  toStatus: string
): string[] {
  const rules = WORKFLOW_RULES[entityType];
  const rule = rules.find(r => r.from === fromStatus && r.to === toStatus);
  
  return rule?.conditions?.fieldValidations || [];
}

// Business logic for automatic status transitions
export const AUTO_TRANSITIONS = {
  // ECR becomes CONVERTED when ECO is created
  ECR_TO_CONVERTED: (ecrId: string, ecoId: string) => ({
    entityType: 'ECR' as EntityType,
    entityId: ecrId,
    fromStatus: 'APPROVED',
    toStatus: 'CONVERTED',
    trigger: 'ECO_CREATED',
    relatedEntityId: ecoId
  }),
  
  // ECR becomes IMPLEMENTED when linked ECO is completed
  ECR_TO_IMPLEMENTED: (ecrId: string, ecoId: string) => ({
    entityType: 'ECR' as EntityType,
    entityId: ecrId,
    fromStatus: 'CONVERTED',
    toStatus: 'IMPLEMENTED',
    trigger: 'ECO_COMPLETED',
    relatedEntityId: ecoId
  }),
  
  // ECN acknowledgment tracking
  ECN_ACKNOWLEDGMENT_UPDATE: (ecnId: string, acknowledgmentPercentage: number) => ({
    entityType: 'ECN' as EntityType,
    entityId: ecnId,
    trigger: 'ACKNOWLEDGMENT_RECEIVED',
    autoStatus: acknowledgmentPercentage >= 100 ? 'FULLY_ACKNOWLEDGED' : 'PARTIALLY_ACKNOWLEDGED'
  })
};

// Status priority for sorting and display
export const STATUS_PRIORITY = {
  ECR: {
    'DRAFT': 1,
    'SUBMITTED': 2,
    'UNDER_REVIEW': 3,
    'IN_ANALYSIS': 4,
    'PENDING_APPROVAL': 5,
    'APPROVED': 6,
    'CONVERTED': 7,
    'IMPLEMENTED': 8,
    'REJECTED': 9,
    'CANCELLED': 10
  },
  ECO: {
    'DRAFT': 1,
    'BACKLOG': 2,
    'PLANNING': 3,
    'APPROVED': 4,
    'IN_PROGRESS': 5,
    'REVIEW': 6,
    'COMPLETED': 7,
    'CANCELLED': 8
  },
  ECN: {
    'DRAFT': 1,
    'PENDING_APPROVAL': 2,
    'APPROVED': 3,
    'DISTRIBUTED': 4,
    'EFFECTIVE': 5,
    'CANCELLED': 6
  }
};

export default {
  WORKFLOW_RULES,
  getValidTransitions,
  validateTransition,
  getNextStatuses,
  getRequiredFields,
  AUTO_TRANSITIONS,
  STATUS_PRIORITY,
};