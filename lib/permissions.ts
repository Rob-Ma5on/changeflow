import { UserRole, ECRStatus, ECOStatus, ECNStatus } from '@prisma/client';

// Permission actions
export const ACTIONS = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  APPROVE: 'APPROVE',
  REJECT: 'REJECT',
  TRANSITION: 'TRANSITION',
  COMMENT: 'COMMENT',
  ASSIGN: 'ASSIGN',
  BULK_ACTION: 'BULK_ACTION',
} as const;

export type Action = typeof ACTIONS[keyof typeof ACTIONS];

// Entity types
export const ENTITIES = {
  ECR: 'ECR',
  ECO: 'ECO',
  ECN: 'ECN',
  USER: 'USER',
  ORGANIZATION: 'ORGANIZATION',
} as const;

export type Entity = typeof ENTITIES[keyof typeof ENTITIES];

// Permission matrix type
export interface Permission {
  entity: Entity;
  action: Action;
  conditions?: {
    ownedOnly?: boolean;
    statusRestrictions?: string[];
    fieldRestrictions?: string[];
    departmentOnly?: boolean;
  };
}

// Role-based permission matrix
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  REQUESTOR: [
    // ECR permissions
    { entity: 'ECR', action: 'CREATE' },
    { entity: 'ECR', action: 'READ', conditions: { ownedOnly: true } },
    { entity: 'ECR', action: 'UPDATE', conditions: { ownedOnly: true, statusRestrictions: ['DRAFT'] } },
    { entity: 'ECR', action: 'DELETE', conditions: { ownedOnly: true, statusRestrictions: ['DRAFT'] } },
    { entity: 'ECR', action: 'COMMENT', conditions: { ownedOnly: true } },
    { entity: 'ECR', action: 'TRANSITION', conditions: { ownedOnly: true } }, // DRAFT → SUBMITTED only
  ],

  ENGINEER: [
    // ECR permissions
    { entity: 'ECR', action: 'READ' },
    { entity: 'ECR', action: 'UPDATE', conditions: { fieldRestrictions: ['technicalAssessment', 'resourceRequirements', 'implementationComplexity', 'riskAssessment', 'timelineEstimate'] } },
    { entity: 'ECR', action: 'COMMENT' },
    { entity: 'ECR', action: 'TRANSITION' }, // SUBMITTED → UNDER_REVIEW, UNDER_REVIEW → IN_ANALYSIS
    { entity: 'ECR', action: 'ASSIGN' },
    
    // ECO permissions
    { entity: 'ECO', action: 'CREATE' },
    { entity: 'ECO', action: 'READ' },
    { entity: 'ECO', action: 'UPDATE', conditions: { fieldRestrictions: ['implementationPlan', 'testingPlan', 'rollbackPlan', 'resourcesRequired', 'estimatedEffort', 'detailedSchedule', 'resourceAllocation', 'procurementNeeds', 'toolingRequirements', 'testRequirements'] } },
    { entity: 'ECO', action: 'COMMENT' },
    { entity: 'ECO', action: 'TRANSITION' }, // DRAFT → PLANNING, IN_PROGRESS management
    { entity: 'ECO', action: 'ASSIGN' },
    
    // ECN permissions (read-only)
    { entity: 'ECN', action: 'READ' },
    { entity: 'ECN', action: 'COMMENT' },
  ],

  QUALITY: [
    // All entities - read access
    { entity: 'ECR', action: 'READ' },
    { entity: 'ECO', action: 'READ' },
    { entity: 'ECN', action: 'READ' },
    
    // ECR quality assessment
    { entity: 'ECR', action: 'UPDATE', conditions: { fieldRestrictions: ['qualityImpact'] } },
    { entity: 'ECR', action: 'COMMENT' },
    
    // ECO quality verification
    { entity: 'ECO', action: 'UPDATE', conditions: { fieldRestrictions: ['inspectionPoints', 'testRequirements', 'qualityApproval'] } },
    { entity: 'ECO', action: 'COMMENT' },
    { entity: 'ECO', action: 'TRANSITION' }, // Quality gates - IN_PROGRESS → COMPLETED verification
    
    // ECN quality review
    { entity: 'ECN', action: 'UPDATE', conditions: { fieldRestrictions: ['verificationMethod'] } },
    { entity: 'ECN', action: 'COMMENT' },
  ],

  MANUFACTURING: [
    // All entities - read access
    { entity: 'ECR', action: 'READ' },
    { entity: 'ECO', action: 'READ' },
    { entity: 'ECN', action: 'READ' },
    
    // ECR manufacturing impact
    { entity: 'ECR', action: 'UPDATE', conditions: { fieldRestrictions: ['manufacturingImpact'] } },
    { entity: 'ECR', action: 'COMMENT' },
    
    // ECO manufacturing execution
    { entity: 'ECO', action: 'UPDATE', conditions: { fieldRestrictions: ['manufacturingApproval', 'actualHours', 'issuesEncountered', 'deviations', 'firstArticleDate', 'pilotRunDate', 'fullImplementationDate'] } },
    { entity: 'ECO', action: 'COMMENT' },
    { entity: 'ECO', action: 'TRANSITION' }, // Manufacturing milestones
    
    // ECN manufacturing notification
    { entity: 'ECN', action: 'UPDATE', conditions: { fieldRestrictions: ['teamTrainingStatus'] } },
    { entity: 'ECN', action: 'COMMENT' },
  ],

  MANAGER: [
    // All entities - full access except creation
    { entity: 'ECR', action: 'READ' },
    { entity: 'ECR', action: 'UPDATE', conditions: { fieldRestrictions: ['approverId', 'priority', 'approvalComments', 'budgetAuthorization'] } },
    { entity: 'ECR', action: 'APPROVE' },
    { entity: 'ECR', action: 'REJECT' },
    { entity: 'ECR', action: 'COMMENT' },
    { entity: 'ECR', action: 'ASSIGN' },
    { entity: 'ECR', action: 'TRANSITION' }, // PENDING_APPROVAL → APPROVED/REJECTED
    { entity: 'ECR', action: 'BULK_ACTION' },
    
    { entity: 'ECO', action: 'READ' },
    { entity: 'ECO', action: 'UPDATE', conditions: { fieldRestrictions: ['approverId', 'priority', 'targetDate', 'effectiveDate', 'estimatedTotalCost'] } },
    { entity: 'ECO', action: 'APPROVE' },
    { entity: 'ECO', action: 'REJECT' },
    { entity: 'ECO', action: 'COMMENT' },
    { entity: 'ECO', action: 'ASSIGN' },
    { entity: 'ECO', action: 'TRANSITION' }, // PLANNING → APPROVED
    { entity: 'ECO', action: 'BULK_ACTION' },
    
    { entity: 'ECN', action: 'READ' },
    { entity: 'ECN', action: 'UPDATE', conditions: { fieldRestrictions: ['closureApprover', 'closureDate'] } },
    { entity: 'ECN', action: 'COMMENT' },
    { entity: 'ECN', action: 'TRANSITION' }, // FULLY_ACKNOWLEDGED → IMPLEMENTED → CLOSED
    { entity: 'ECN', action: 'BULK_ACTION' },
    
    // User management
    { entity: 'USER', action: 'READ', conditions: { departmentOnly: true } },
    { entity: 'USER', action: 'ASSIGN' },
  ],

  DOCUMENT_CONTROL: [
    // All entities - read access
    { entity: 'ECR', action: 'READ' },
    { entity: 'ECO', action: 'READ' },
    
    // ECN management - full control
    { entity: 'ECN', action: 'CREATE' },
    { entity: 'ECN', action: 'READ' },
    { entity: 'ECN', action: 'UPDATE' },
    { entity: 'ECN', action: 'DELETE', conditions: { statusRestrictions: ['DRAFT'] } },
    { entity: 'ECN', action: 'COMMENT' },
    { entity: 'ECN', action: 'ASSIGN' },
    { entity: 'ECN', action: 'TRANSITION' }, // All ECN transitions
    { entity: 'ECN', action: 'BULK_ACTION' },
    
    // Document updates
    { entity: 'ECO', action: 'UPDATE', conditions: { fieldRestrictions: ['documentUpdates'] } },
  ],

  ADMIN: [
    // Full system access - all actions on all entities
    { entity: 'ECR', action: 'CREATE' },
    { entity: 'ECR', action: 'READ' },
    { entity: 'ECR', action: 'UPDATE' },
    { entity: 'ECR', action: 'DELETE' },
    { entity: 'ECR', action: 'APPROVE' },
    { entity: 'ECR', action: 'REJECT' },
    { entity: 'ECR', action: 'COMMENT' },
    { entity: 'ECR', action: 'ASSIGN' },
    { entity: 'ECR', action: 'TRANSITION' },
    { entity: 'ECR', action: 'BULK_ACTION' },
    
    { entity: 'ECO', action: 'CREATE' },
    { entity: 'ECO', action: 'READ' },
    { entity: 'ECO', action: 'UPDATE' },
    { entity: 'ECO', action: 'DELETE' },
    { entity: 'ECO', action: 'APPROVE' },
    { entity: 'ECO', action: 'REJECT' },
    { entity: 'ECO', action: 'COMMENT' },
    { entity: 'ECO', action: 'ASSIGN' },
    { entity: 'ECO', action: 'TRANSITION' },
    { entity: 'ECO', action: 'BULK_ACTION' },
    
    { entity: 'ECN', action: 'CREATE' },
    { entity: 'ECN', action: 'READ' },
    { entity: 'ECN', action: 'UPDATE' },
    { entity: 'ECN', action: 'DELETE' },
    { entity: 'ECN', action: 'COMMENT' },
    { entity: 'ECN', action: 'ASSIGN' },
    { entity: 'ECN', action: 'TRANSITION' },
    { entity: 'ECN', action: 'BULK_ACTION' },
    
    { entity: 'USER', action: 'CREATE' },
    { entity: 'USER', action: 'READ' },
    { entity: 'USER', action: 'UPDATE' },
    { entity: 'USER', action: 'DELETE' },
    { entity: 'USER', action: 'ASSIGN' },
    
    { entity: 'ORGANIZATION', action: 'CREATE' },
    { entity: 'ORGANIZATION', action: 'READ' },
    { entity: 'ORGANIZATION', action: 'UPDATE' },
    { entity: 'ORGANIZATION', action: 'DELETE' },
  ],

  VIEWER: [
    // Read-only access to all entities
    { entity: 'ECR', action: 'READ' },
    { entity: 'ECO', action: 'READ' },
    { entity: 'ECN', action: 'READ' },
    { entity: 'USER', action: 'READ' },
    { entity: 'ORGANIZATION', action: 'READ' },
  ],
};

// Helper function to check if user has permission
export function hasPermission(
  userRole: UserRole,
  entity: Entity,
  action: Action,
  context?: {
    isOwner?: boolean;
    entityStatus?: string;
    userDepartment?: string;
    entityDepartment?: string;
    fieldName?: string;
  }
): boolean {
  // Validate inputs
  if (!userRole) {
    console.error('hasPermission: userRole is required');
    return false;
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  
  // Check if role permissions exist
  if (!rolePermissions) {
    console.error(`hasPermission: No permissions found for role: ${userRole}`);
    return false;
  }
  
  // Find matching permission
  const permission = rolePermissions.find(p => 
    p.entity === entity && p.action === action
  );
  
  if (!permission) return false;
  
  // Check conditions if they exist
  if (permission.conditions && context) {
    const { conditions } = permission;
    
    // Check ownership restriction
    if (conditions.ownedOnly && !context.isOwner) {
      return false;
    }
    
    // Check status restrictions
    if (conditions.statusRestrictions && context.entityStatus) {
      if (!conditions.statusRestrictions.includes(context.entityStatus)) {
        return false;
      }
    }
    
    // Check field restrictions
    if (conditions.fieldRestrictions && context.fieldName) {
      if (!conditions.fieldRestrictions.includes(context.fieldName)) {
        return false;
      }
    }
    
    // Check department restrictions
    if (conditions.departmentOnly && context.userDepartment && context.entityDepartment) {
      if (context.userDepartment !== context.entityDepartment) {
        return false;
      }
    }
  }
  
  return true;
}

// Helper function to get user's allowed actions for an entity
export function getAllowedActions(
  userRole: UserRole,
  entity: Entity,
  context?: {
    isOwner?: boolean;
    entityStatus?: string;
    userDepartment?: string;
    entityDepartment?: string;
  }
): Action[] {
  // Validate inputs
  if (!userRole) {
    console.error('getAllowedActions: userRole is required');
    return [];
  }
  
  const allowedActions: Action[] = [];
  
  for (const action of Object.values(ACTIONS)) {
    if (hasPermission(userRole, entity, action, context)) {
      allowedActions.push(action);
    }
  }
  
  return allowedActions;
}

// Helper function to filter entity fields based on role permissions
export function filterAllowedFields(
  userRole: UserRole,
  entity: Entity,
  fields: Record<string, any>,
  context?: {
    isOwner?: boolean;
    entityStatus?: string;
    userDepartment?: string;
    entityDepartment?: string;
  }
): Record<string, any> {
  // Validate inputs
  if (!userRole) {
    console.error('filterAllowedFields: userRole is required');
    return {};
  }
  
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  
  // Check if role permissions exist
  if (!rolePermissions) {
    console.error(`filterAllowedFields: No permissions found for role: ${userRole}`);
    return {};
  }
  
  // Get update permission for this entity
  const updatePermission = rolePermissions.find(p => 
    p.entity === entity && p.action === 'UPDATE'
  );
  
  if (!updatePermission) {
    return {}; // No update permission at all
  }
  
  // If no field restrictions, allow all fields (subject to other conditions)
  if (!updatePermission.conditions?.fieldRestrictions) {
    return fields;
  }
  
  // Filter fields based on restrictions
  const allowedFields: Record<string, any> = {};
  const allowedFieldNames = updatePermission.conditions.fieldRestrictions;
  
  for (const [fieldName, value] of Object.entries(fields)) {
    if (allowedFieldNames.includes(fieldName)) {
      allowedFields[fieldName] = value;
    }
  }
  
  return allowedFields;
}

// Role hierarchy for escalation and delegation
export const ROLE_HIERARCHY: Record<UserRole, number> = {
  VIEWER: 1,
  REQUESTOR: 2,
  ENGINEER: 3,
  QUALITY: 4,
  MANUFACTURING: 4,
  DOCUMENT_CONTROL: 5,
  MANAGER: 6,
  ADMIN: 7,
};

// Check if user can act on behalf of another role (hierarchy)
export function canActForRole(actingRole: UserRole, targetRole: UserRole): boolean {
  return ROLE_HIERARCHY[actingRole] >= ROLE_HIERARCHY[targetRole];
}

export default {
  ACTIONS,
  ENTITIES,
  ROLE_PERMISSIONS,
  hasPermission,
  getAllowedActions,
  filterAllowedFields,
  ROLE_HIERARCHY,
  canActForRole,
};