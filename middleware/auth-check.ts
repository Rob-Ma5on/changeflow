import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { UserRole } from '@prisma/client';
import { hasPermission, getAllowedActions, filterAllowedFields, Action, Entity } from '../lib/permissions';
import { prisma } from '../lib/prisma';

// Extended user session type
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  departmentRole?: string;
  organizationId: string;
}

// Auth check result
export interface AuthCheckResult {
  authorized: boolean;
  user?: AuthenticatedUser;
  error?: string;
  statusCode?: number;
}

// Permission context for advanced checks
export interface PermissionContext {
  isOwner?: boolean;
  entityStatus?: string;
  userDepartment?: string;
  entityDepartment?: string;
  fieldName?: string;
}

/**
 * Middleware function to check authentication and authorization
 */
export async function checkAuth(
  request: NextRequest,
  requiredRole?: UserRole | UserRole[],
  customAuthOptions?: any
): Promise<AuthCheckResult> {
  try {
    // Get session from next-auth
    const session = await getServerSession(customAuthOptions) as any;
    
    if (!session?.user?.email) {
      return {
        authorized: false,
        error: 'Authentication required',
        statusCode: 401
      };
    }

    // Get full user details from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
      }
    });

    if (!user) {
      return {
        authorized: false,
        error: 'User not found',
        statusCode: 404
      };
    }

    // Check role requirements
    if (requiredRole) {
      const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
      if (!requiredRoles.includes(user.role)) {
        return {
          authorized: false,
          error: 'Insufficient permissions',
          statusCode: 403
        };
      }
    }

    return {
      authorized: true,
      user: user as AuthenticatedUser
    };

  } catch (error) {
    console.error('Auth check error:', error);
    return {
      authorized: false,
      error: 'Authentication service error',
      statusCode: 500
    };
  }
}

/**
 * Check specific permission for entity and action
 */
export async function checkPermission(
  user: AuthenticatedUser,
  entity: Entity,
  action: Action,
  context?: PermissionContext,
  auditLog: boolean = true
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const allowed = hasPermission(user.role, entity, action, context);
    
    // Audit log all permission checks
    if (auditLog) {
      console.log(`Permission check: ${user.email} (${user.role}) -> ${action} on ${entity}: ${allowed ? 'ALLOWED' : 'DENIED'}`, {
        userId: user.id,
        role: user.role,
        entity,
        action,
        context,
        allowed,
        timestamp: new Date().toISOString()
      });
    }
    
    return {
      allowed,
      reason: allowed ? undefined : `Role ${user.role} does not have permission to ${action} ${entity}`
    };

  } catch (error) {
    console.error('Permission check error:', error);
    return {
      allowed: false,
      reason: 'Permission check failed'
    };
  }
}

/**
 * Middleware factory for API route protection
 */
export function withAuth(
  handler: (req: NextRequest, context: { user: AuthenticatedUser }) => Promise<NextResponse>,
  options?: {
    requiredRole?: UserRole | UserRole[];
    entity?: Entity;
    action?: Action;
    customAuthOptions?: any;
  }
) {
  return async (req: NextRequest, routeContext: any) => {
    try {
      // Check authentication
      const authResult = await checkAuth(req, options?.requiredRole, options?.customAuthOptions);
      
      if (!authResult.authorized || !authResult.user) {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.statusCode || 401 }
        );
      }

      // Check specific permission if required
      if (options?.entity && options?.action) {
        const permissionResult = await checkPermission(
          authResult.user,
          options.entity,
          options.action
        );
        
        if (!permissionResult.allowed) {
          return NextResponse.json(
            { error: permissionResult.reason },
            { status: 403 }
          );
        }
      }

      // Call the actual handler with user context
      return await handler(req, { user: authResult.user, ...routeContext });

    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
}

/**
 * Check if user owns the entity
 */
export async function checkOwnership(
  user: AuthenticatedUser,
  entityType: Entity,
  entityId: string
): Promise<boolean> {
  try {
    let entity;
    
    switch (entityType) {
      case 'ECR':
        entity = await prisma.eCR.findUnique({
          where: { id: entityId },
          select: { submitterId: true, assigneeId: true }
        });
        return entity?.submitterId === user.id || entity?.assigneeId === user.id;
        
      case 'ECO':
        entity = await prisma.eCO.findUnique({
          where: { id: entityId },
          select: { submitterId: true, assigneeId: true }
        });
        return entity?.submitterId === user.id || entity?.assigneeId === user.id;
        
      case 'ECN':
        entity = await prisma.eCN.findUnique({
          where: { id: entityId },
          select: { submitterId: true, assigneeId: true }
        });
        return entity?.submitterId === user.id || entity?.assigneeId === user.id;
        
      default:
        return false;
    }
  } catch (error) {
    console.error('Ownership check error:', error);
    return false;
  }
}

/**
 * Get entity with permission context
 */
export async function getEntityWithContext(
  user: AuthenticatedUser,
  entityType: Entity,
  entityId: string
): Promise<{
  entity: any;
  context: PermissionContext;
  allowedActions: Action[];
} | null> {
  try {
    let entity;
    
    switch (entityType) {
      case 'ECR':
        entity = await prisma.eCR.findUnique({
          where: { id: entityId },
          include: {
            submitter: { select: { department: true } },
            assignee: { select: { department: true } }
          }
        });
        break;
        
      case 'ECO':
        entity = await prisma.eCO.findUnique({
          where: { id: entityId },
          include: {
            submitter: { select: { department: true } },
            assignee: { select: { department: true } }
          }
        });
        break;
        
      case 'ECN':
        entity = await prisma.eCN.findUnique({
          where: { id: entityId },
          include: {
            submitter: { select: { department: true } },
            assignee: { select: { department: true } }
          }
        });
        break;
        
      default:
        return null;
    }

    if (!entity) return null;

    // Build permission context
    const isOwner = entity.submitterId === user.id || entity.assigneeId === user.id;
    const context: PermissionContext = {
      isOwner,
      entityStatus: entity.status,
      userDepartment: user.department || undefined,
      entityDepartment: entity.submitter?.department || entity.assignee?.department || undefined
    };

    // Get allowed actions for this user and entity
    const allowedActions = getAllowedActions(user.role, entityType, context);

    return {
      entity,
      context,
      allowedActions
    };

  } catch (error) {
    console.error('Get entity with context error:', error);
    return null;
  }
}

/**
 * Filter request body based on user permissions
 */
export function filterRequestBody(
  user: AuthenticatedUser,
  entity: Entity,
  requestBody: Record<string, any>,
  context?: PermissionContext
): Record<string, any> {
  return filterAllowedFields(user.role, entity, requestBody, context);
}

/**
 * Log security events for audit trail
 */
export async function logSecurityEvent(
  user: AuthenticatedUser,
  event: string,
  entity?: {
    type: Entity;
    id: string;
  },
  details?: Record<string, any>
): Promise<void> {
  try {
    console.log('Security Event:', {
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      event,
      entity,
      details
    });
    
    // Could also write to database audit table or external logging service
    // await prisma.auditLog.create({...})
    
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

/**
 * Response helper for permission denied
 */
export function permissionDenied(reason?: string): NextResponse {
  return NextResponse.json(
    { error: reason || 'Permission denied' },
    { status: 403 }
  );
}

/**
 * Response helper for authentication required
 */
export function authRequired(): NextResponse {
  return NextResponse.json(
    { error: 'Authentication required' },
    { status: 401 }
  );
}

/**
 * Response helper for not found
 */
export function notFound(entity?: string): NextResponse {
  return NextResponse.json(
    { error: entity ? `${entity} not found` : 'Not found' },
    { status: 404 }
  );
}

// Export types and utilities
export {
  hasPermission,
  getAllowedActions,
  filterAllowedFields,
  type Action,
  type Entity
};

export default {
  checkAuth,
  checkPermission,
  withAuth,
  checkOwnership,
  getEntityWithContext,
  filterRequestBody,
  logSecurityEvent,
  permissionDenied,
  authRequired,
  notFound,
};