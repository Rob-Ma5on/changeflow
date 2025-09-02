import { UserRole } from '@prisma/client';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BusinessRuleContext {
  userRole: UserRole;
  organizationId: string;
  userId: string;
  department?: string;
}

// ECR Business Rules
export class ECRValidationRules {
  static validateCreation(data: any, context: BusinessRuleContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Role-based creation rules
    if (!['REQUESTOR', 'ENGINEER', 'MANAGER', 'ADMIN'].includes(context.userRole)) {
      errors.push('User role is not authorized to create ECRs');
    }

    // Required fields validation
    if (!data.title || data.title.trim().length < 5) {
      errors.push('Title must be at least 5 characters long');
    }

    if (!data.description || data.description.trim().length < 20) {
      errors.push('Description must be at least 20 characters long');
    }

    if (!data.reason || data.reason.trim().length < 10) {
      errors.push('Reason for change must be at least 10 characters long');
    }

    // Priority validation
    if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(data.priority)) {
      errors.push('Invalid priority level');
    }

    // Cost validation
    if (data.costImpact !== undefined) {
      if (typeof data.costImpact !== 'number' || data.costImpact < 0) {
        errors.push('Cost impact must be a positive number');
      }

      // High cost changes require additional justification
      if (data.costImpact > 50000 && (!data.implementationPlan || data.implementationPlan.length < 50)) {
        errors.push('High cost changes (>$50k) require detailed implementation plan');
      }
    }

    // Customer impact validation
    if (!['NO_IMPACT', 'INDIRECT_IMPACT', 'DIRECT_IMPACT', 'POSITIVE_IMPACT'].includes(data.customerImpact)) {
      errors.push('Invalid customer impact level');
    }

    // Date validation
    if (data.targetImplementationDate) {
      const targetDate = new Date(data.targetImplementationDate);
      const now = new Date();
      const minDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

      if (targetDate < minDate) {
        warnings.push('Target implementation date should be at least 7 days in the future');
      }
    }

    // Affected products validation
    if (data.customerImpact !== 'NO_IMPACT' && !data.affectedProducts) {
      errors.push('Affected products must be specified when customer impact is present');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    context: BusinessRuleContext
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validTransitions: Record<string, string[]> = {
      'DRAFT': ['SUBMITTED', 'CANCELLED'],
      'SUBMITTED': ['UNDER_REVIEW', 'CANCELLED'],
      'UNDER_REVIEW': ['APPROVED', 'REJECTED', 'RETURNED_TO_SUBMITTER'],
      'RETURNED_TO_SUBMITTER': ['SUBMITTED', 'CANCELLED'],
      'APPROVED': ['CANCELLED'], // Only if no ECO exists
      'REJECTED': [], // Terminal state
      'CANCELLED': [] // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Role-based transition permissions
    const roleTransitionPermissions: Record<string, string[]> = {
      'REQUESTOR': ['SUBMITTED', 'CANCELLED'],
      'ENGINEER': ['UNDER_REVIEW', 'RETURNED_TO_SUBMITTER'],
      'MANAGER': ['APPROVED', 'REJECTED'],
      'ADMIN': ['APPROVED', 'REJECTED', 'CANCELLED']
    };

    if (!roleTransitionPermissions[context.userRole]?.includes(newStatus)) {
      errors.push(`User role ${context.userRole} is not authorized to transition to ${newStatus}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateApproval(data: any, context: BusinessRuleContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!['MANAGER', 'ADMIN'].includes(context.userRole)) {
      errors.push('Only managers and admins can approve ECRs');
    }

    if (data.status === 'APPROVED') {
      if (!data.approvalComments || data.approvalComments.trim().length < 10) {
        errors.push('Approval comments are required and must be at least 10 characters');
      }

      if (data.costImpact > 100000 && context.userRole !== 'ADMIN') {
        errors.push('ECRs with cost impact >$100k require admin approval');
      }
    }

    if (data.status === 'REJECTED') {
      if (!data.rejectionReason || data.rejectionReason.trim().length < 20) {
        errors.push('Rejection reason is required and must be at least 20 characters');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ECO Business Rules
export class ECOValidationRules {
  static validateCreation(data: any, context: BusinessRuleContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Only managers and admins can create ECOs
    if (!['MANAGER', 'ADMIN'].includes(context.userRole)) {
      errors.push('Only managers and admins can create ECOs');
    }

    // Required fields
    if (!data.title || data.title.trim().length < 10) {
      errors.push('Title must be at least 10 characters long');
    }

    if (!data.implementationPlan || data.implementationPlan.trim().length < 50) {
      errors.push('Implementation plan must be at least 50 characters long');
    }

    if (!data.testingPlan || data.testingPlan.trim().length < 30) {
      errors.push('Testing plan must be at least 30 characters long');
    }

    if (!data.rollbackPlan || data.rollbackPlan.trim().length < 30) {
      errors.push('Rollback plan must be at least 30 characters long');
    }

    // Resource validation
    if (!data.resourcesRequired || data.resourcesRequired.trim().length < 20) {
      errors.push('Resources required must be specified in detail');
    }

    // Date validation
    if (data.targetDate) {
      const targetDate = new Date(data.targetDate);
      const now = new Date();
      
      if (targetDate <= now) {
        errors.push('Target date must be in the future');
      }

      // Effective date should be after target date
      if (data.effectiveDate) {
        const effectiveDate = new Date(data.effectiveDate);
        if (effectiveDate < targetDate) {
          warnings.push('Effective date should typically be after or equal to target date');
        }
      }
    }

    // Cost validation
    if (data.estimatedTotalCost !== undefined) {
      if (typeof data.estimatedTotalCost !== 'number' || data.estimatedTotalCost < 0) {
        errors.push('Estimated total cost must be a positive number');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateStatusTransition(
    currentStatus: string,
    newStatus: string,
    context: BusinessRuleContext
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const validTransitions: Record<string, string[]> = {
      'PLANNING': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['VERIFICATION', 'ON_HOLD', 'CANCELLED'],
      'ON_HOLD': ['IN_PROGRESS', 'CANCELLED'],
      'VERIFICATION': ['COMPLETED', 'RETURNED_TO_IMPLEMENTATION'],
      'RETURNED_TO_IMPLEMENTATION': ['IN_PROGRESS'],
      'COMPLETED': [], // Terminal state
      'CANCELLED': [] // Terminal state
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      errors.push(`Invalid status transition from ${currentStatus} to ${newStatus}`);
    }

    // Role-based permissions
    const rolePermissions: Record<string, string[]> = {
      'ENGINEER': ['IN_PROGRESS', 'VERIFICATION'],
      'QUALITY': ['VERIFICATION', 'COMPLETED', 'RETURNED_TO_IMPLEMENTATION'],
      'MANUFACTURING': ['IN_PROGRESS', 'ON_HOLD'],
      'MANAGER': ['IN_PROGRESS', 'ON_HOLD', 'CANCELLED'],
      'ADMIN': ['IN_PROGRESS', 'ON_HOLD', 'VERIFICATION', 'COMPLETED', 'CANCELLED']
    };

    if (!rolePermissions[context.userRole]?.includes(newStatus)) {
      errors.push(`User role ${context.userRole} is not authorized to transition to ${newStatus}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateCompletion(data: any, context: BusinessRuleContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!['QUALITY', 'ADMIN'].includes(context.userRole)) {
      errors.push('Only quality personnel and admins can complete ECOs');
    }

    // Completion requirements
    if (data.actualProgress !== 100) {
      errors.push('ECO must be 100% complete before marking as completed');
    }

    if (!data.actualImplementationDate) {
      errors.push('Actual implementation date is required for completion');
    }

    if (!data.verificationResults || data.verificationResults.trim().length < 50) {
      errors.push('Verification results must be documented in detail');
    }

    // Quality gates check
    if (data.qualityGatesPassed !== true) {
      errors.push('All quality gates must be passed before completion');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// ECN Business Rules
export class ECNValidationRules {
  static validateCreation(data: any, context: BusinessRuleContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Only specific roles can create ECNs
    if (!['DOCUMENT_CONTROL', 'ENGINEER', 'QUALITY', 'ADMIN'].includes(context.userRole)) {
      errors.push('User role is not authorized to create ECNs');
    }

    // Required fields
    if (!data.title || data.title.trim().length < 10) {
      errors.push('Title must be at least 10 characters long');
    }

    if (!data.changesImplemented || data.changesImplemented.trim().length < 30) {
      errors.push('Changes implemented must be documented in detail');
    }

    if (!data.affectedItems || data.affectedItems.trim().length < 20) {
      errors.push('Affected items must be clearly specified');
    }

    if (!data.dispositionInstructions || data.dispositionInstructions.trim().length < 30) {
      errors.push('Disposition instructions must be detailed');
    }

    // Distribution validation
    if (!data.distributionList || data.distributionList.trim().length < 10) {
      errors.push('Distribution list is required');
    }

    // Email format validation for distribution list
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emails = data.distributionList?.split(',').map((email: string) => email.trim());
    
    if (emails) {
      const invalidEmails = emails.filter((email: string) => !emailRegex.test(email));
      if (invalidEmails.length > 0) {
        errors.push(`Invalid email addresses in distribution list: ${invalidEmails.join(', ')}`);
      }
    }

    // Effective date validation
    if (data.effectiveDate) {
      const effectiveDate = new Date(data.effectiveDate);
      const now = new Date();
      
      if (effectiveDate < now && data.implementationStatus !== 'COMPLETE') {
        warnings.push('Effective date is in the past but implementation is not complete');
      }
    }

    // Response deadline validation
    if (!['DAYS_1', 'DAYS_3', 'DAYS_5', 'DAYS_7', 'DAYS_14'].includes(data.responseDeadline)) {
      errors.push('Invalid response deadline');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateDistribution(data: any, context: BusinessRuleContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!['DOCUMENT_CONTROL', 'ADMIN'].includes(context.userRole)) {
      errors.push('Only document control personnel and admins can distribute ECNs');
    }

    if (data.status !== 'PENDING_DISTRIBUTION') {
      errors.push('ECN must be in PENDING_DISTRIBUTION status to be distributed');
    }

    if (!data.distributionList) {
      errors.push('Distribution list is required before distribution');
    }

    if (data.customerNotificationRequired === 'REQUIRED' && !data.customerNotificationMethod) {
      errors.push('Customer notification method is required when customer notification is needed');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateAcknowledgment(data: any, context: BusinessRuleContext): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (data.status !== 'DISTRIBUTED') {
      errors.push('ECN must be distributed before acknowledgments can be recorded');
    }

    if (!data.acknowledgmentComments || data.acknowledgmentComments.trim().length < 10) {
      warnings.push('Acknowledgment comments provide valuable feedback');
    }

    // Check if response is within deadline
    if (data.responseDeadline && data.distributedAt) {
      const distributedDate = new Date(data.distributedAt);
      const deadlineDays = parseInt(data.responseDeadline.replace('DAYS_', ''));
      const deadlineDate = new Date(distributedDate.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (now > deadlineDate) {
        warnings.push('Response is past the deadline');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// General Business Rules
export class GeneralBusinessRules {
  static validateBudgetImpact(
    costImpact: number,
    organizationBudget: number,
    currentMonthSpend: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const remainingBudget = organizationBudget - currentMonthSpend;

    if (costImpact > remainingBudget) {
      errors.push('Cost impact exceeds remaining monthly budget');
    }

    if (costImpact > remainingBudget * 0.8) {
      warnings.push('Cost impact will consume most of remaining monthly budget');
    }

    if (costImpact > organizationBudget * 0.1) {
      warnings.push('Cost impact is significant (>10% of monthly budget)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateWorkloadCapacity(
    assigneeId: string,
    currentWorkload: number,
    estimatedEffort: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const maxCapacity = 100; // 100% capacity
    const totalWorkload = currentWorkload + estimatedEffort;

    if (totalWorkload > maxCapacity) {
      warnings.push('Assignee capacity will be exceeded with this assignment');
    }

    if (totalWorkload > maxCapacity * 1.2) {
      errors.push('Assignee is significantly over capacity');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  static validateDepartmentAlignment(
    submitterDepartment: string,
    assigneeDepartment: string,
    changeType: string
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Cross-department change rules
    const crossDepartmentRequirements: Record<string, string[]> = {
      'ENGINEERING': ['Quality', 'Manufacturing'],
      'QUALITY': ['Engineering', 'Manufacturing'],
      'MANUFACTURING': ['Engineering', 'Quality'],
      'PROCUREMENT': ['Engineering', 'Quality', 'Manufacturing']
    };

    if (submitterDepartment !== assigneeDepartment) {
      const requiredDepts = crossDepartmentRequirements[submitterDepartment.toUpperCase()];
      if (requiredDepts && !requiredDepts.includes(assigneeDepartment)) {
        warnings.push(`Cross-department changes from ${submitterDepartment} typically require involvement from ${requiredDepts.join(', ')}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

// Main validation orchestrator
export class BusinessRuleValidator {
  static validateECRWorkflow(
    action: 'create' | 'update' | 'approve' | 'transition',
    data: any,
    context: BusinessRuleContext
  ): ValidationResult {
    let result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    switch (action) {
      case 'create':
        result = ECRValidationRules.validateCreation(data, context);
        break;
      case 'approve':
        result = ECRValidationRules.validateApproval(data, context);
        break;
      case 'transition':
        result = ECRValidationRules.validateStatusTransition(data.currentStatus, data.newStatus, context);
        break;
    }

    return result;
  }

  static validateECOWorkflow(
    action: 'create' | 'update' | 'complete' | 'transition',
    data: any,
    context: BusinessRuleContext
  ): ValidationResult {
    let result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    switch (action) {
      case 'create':
        result = ECOValidationRules.validateCreation(data, context);
        break;
      case 'complete':
        result = ECOValidationRules.validateCompletion(data, context);
        break;
      case 'transition':
        result = ECOValidationRules.validateStatusTransition(data.currentStatus, data.newStatus, context);
        break;
    }

    return result;
  }

  static validateECNWorkflow(
    action: 'create' | 'distribute' | 'acknowledge',
    data: any,
    context: BusinessRuleContext
  ): ValidationResult {
    let result: ValidationResult = { isValid: true, errors: [], warnings: [] };

    switch (action) {
      case 'create':
        result = ECNValidationRules.validateCreation(data, context);
        break;
      case 'distribute':
        result = ECNValidationRules.validateDistribution(data, context);
        break;
      case 'acknowledge':
        result = ECNValidationRules.validateAcknowledgment(data, context);
        break;
    }

    return result;
  }

  static combineValidationResults(results: ValidationResult[]): ValidationResult {
    const allErrors = results.flatMap(r => r.errors);
    const allWarnings = results.flatMap(r => r.warnings);

    return {
      isValid: allErrors.length === 0,
      errors: [...new Set(allErrors)], // Remove duplicates
      warnings: [...new Set(allWarnings)] // Remove duplicates
    };
  }
}