import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { withAuth, checkPermission, getEntityWithContext, filterRequestBody } from '@/middleware/auth-check';
import { validateTransition } from '@/lib/workflow-rules';

export const GET = withAuth(
  async (request: NextRequest, { user, params }: any) => {
    try {
      const { id } = await params;
      
      // Get entity with permission context
      const entityResult = await getEntityWithContext(user, 'ECR', id);
      
      if (!entityResult) {
        return NextResponse.json(
          { error: 'ECR not found' },
          { status: 404 }
        );
      }
      
      // Check read permission with context
      const permissionResult = await checkPermission(user, 'ECR', 'READ', entityResult.context);
      if (!permissionResult.allowed) {
        return NextResponse.json(
          { error: permissionResult.reason },
          { status: 403 }
        );
      }

      const ecr = await prisma.eCR.findFirst({
        where: {
          id,
          organizationId: user.organizationId,
        },
        include: {
          submitter: { select: { id: true, name: true, email: true, role: true, department: true } },
          assignee: { select: { id: true, name: true, email: true, role: true, department: true } },
          approver: { select: { id: true, name: true, email: true, role: true, department: true } },
          organization: { select: { id: true, name: true } },
          eco: {
            select: {
              id: true,
              ecoNumber: true,
              title: true,
              status: true,
              createdAt: true,
              completedAt: true,
              ecns: {
                select: {
                  id: true,
                  ecnNumber: true,
                  title: true,
                  status: true
                }
              }
            }
          },
          revisions: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            },
            orderBy: {
              changedAt: 'desc'
            }
          }
        },
      });

      if (!ecr) {
        return NextResponse.json(
          { error: 'ECR not found' },
          { status: 404 }
        );
      }

      // Include allowed actions for the current user
      const response = {
        ...ecr,
        _permissions: {
          allowedActions: entityResult.allowedActions,
          canEdit: entityResult.allowedActions.includes('UPDATE'),
          canApprove: entityResult.allowedActions.includes('APPROVE'),
          canTransition: entityResult.allowedActions.includes('TRANSITION')
        }
      };

      return NextResponse.json(response);
    } catch (error) {
      console.error('Error fetching ECR:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    customAuthOptions: authOptions
  }
);

export const PATCH = withAuth(
  async (request: NextRequest, { user, params }: any) => {
    try {
      const { id } = await params;
      const body = await request.json();
      const { status } = body;

      if (!status) {
        return NextResponse.json(
          { error: 'Status is required' },
          { status: 400 }
        );
      }

      // Get existing ECR with context
      const entityResult = await getEntityWithContext(user, 'ECR', id);
      
      if (!entityResult) {
        return NextResponse.json(
          { error: 'ECR not found' },
          { status: 404 }
        );
      }

      const existingEcr = entityResult.entity;
      
      // Check transition permission
      const permissionResult = await checkPermission(user, 'ECR', 'TRANSITION', entityResult.context);
      if (!permissionResult.allowed) {
        return NextResponse.json(
          { error: permissionResult.reason },
          { status: 403 }
        );
      }

      // Validate workflow transition
      const transitionResult = validateTransition(
        'ECR',
        existingEcr.status,
        status,
        user.role,
        existingEcr,
        user
      );

      if (!transitionResult.valid) {
        return NextResponse.json(
          { error: `Invalid transition: ${transitionResult.errors.join(', ')}` },
          { status: 400 }
        );
      }

      // Prepare update data
      const updateData: any = { 
        status,
        updatedAt: new Date()
      };

      // Handle status-specific updates
      if (status === 'APPROVED') {
        // Check if user can approve
        const approvePermission = await checkPermission(user, 'ECR', 'APPROVE', entityResult.context);
        if (!approvePermission.allowed) {
          return NextResponse.json(
            { error: 'Not authorized to approve ECRs' },
            { status: 403 }
          );
        }
        updateData.approverId = user.id;
        updateData.approvedAt = new Date();
      } else if (status === 'REJECTED') {
        // Check if user can reject
        const rejectPermission = await checkPermission(user, 'ECR', 'REJECT', entityResult.context);
        if (!rejectPermission.allowed) {
          return NextResponse.json(
            { error: 'Not authorized to reject ECRs' },
            { status: 403 }
          );
        }
        updateData.approverId = user.id;
        updateData.rejectedAt = new Date();
      } else if (status === 'SUBMITTED') {
        updateData.submittedAt = new Date();
      }

      // Update ECR
      const updatedEcr = await prisma.eCR.update({
        where: { id },
        data: updateData,
        include: {
          submitter: { select: { id: true, name: true, email: true, role: true, department: true } },
          assignee: { select: { id: true, name: true, email: true, role: true, department: true } },
          approver: { select: { id: true, name: true, email: true, role: true, department: true } },
          organization: { select: { id: true, name: true } },
          eco: {
            select: {
              id: true,
              ecoNumber: true,
              title: true,
              status: true,
              createdAt: true,
              completedAt: true,
              ecns: {
                select: {
                  id: true,
                  ecnNumber: true,
                  title: true,
                  status: true
                }
              }
            }
          }
        },
      });

      // Log workflow transition
      await prisma.workflowTransition.create({
        data: {
          entityType: 'ECR',
          entityId: id,
          fromStatus: existingEcr.status,
          toStatus: status,
          transitionedBy: user.id,
          comments: body.comments || `Status changed from ${existingEcr.status} to ${status}`
        }
      });

      return NextResponse.json(updatedEcr);
    } catch (error) {
      console.error('Error updating ECR status:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    customAuthOptions: authOptions
  }
);

export const PUT = withAuth(
  async (request: NextRequest, { user, params }: any) => {
    try {
      const { id } = await params;
      const body = await request.json();

      // Get existing ECR with context
      const entityResult = await getEntityWithContext(user, 'ECR', id);
      
      if (!entityResult) {
        return NextResponse.json(
          { error: 'ECR not found' },
          { status: 404 }
        );
      }

      const existingEcr = entityResult.entity;
      
      // Check update permission
      const permissionResult = await checkPermission(user, 'ECR', 'UPDATE', entityResult.context);
      if (!permissionResult.allowed) {
        return NextResponse.json(
          { error: permissionResult.reason },
          { status: 403 }
        );
      }

      // Filter request body based on user permissions
      const filteredBody = filterRequestBody(user, 'ECR', body, entityResult.context);

      // Validate required fields (only if they're being updated)
      if (filteredBody.title !== undefined && !filteredBody.title?.trim()) {
        return NextResponse.json(
          { error: 'Title is required' },
          { status: 400 }
        );
      }

      if (filteredBody.description !== undefined && !filteredBody.description?.trim()) {
        return NextResponse.json(
          { error: 'Description is required' },
          { status: 400 }
        );
      }

      if (filteredBody.reason !== undefined && !filteredBody.reason?.trim()) {
        return NextResponse.json(
          { error: 'Business justification is required' },
          { status: 400 }
        );
      }

      // Prepare update data from filtered body
      const updateData: any = {
        updatedAt: new Date()
      };

      // Map allowed fields
      const allowedFieldMappings = {
        title: (val: string) => val?.trim(),
        description: (val: string) => val?.trim(),
        reason: (val: string) => val?.trim(),
        priority: (val: string) => val,
        customerImpact: (val: string) => val,
        estimatedCostRange: (val: string) => val || null,
        targetImplementationDate: (val: string) => val ? new Date(val) : null,
        stakeholders: (val: string) => val?.trim() || null,
        affectedProducts: (val: string) => val?.trim() || null,
        affectedDocuments: (val: string) => val?.trim() || null,
        implementationPlan: (val: string) => val?.trim() || null,
        costImpact: (val: any) => val ? parseFloat(val) : null,
        scheduleImpact: (val: string) => val?.trim() || null,
        // Workflow fields
        technicalAssessment: (val: string) => val?.trim() || null,
        resourceRequirements: (val: string) => val?.trim() || null,
        implementationComplexity: (val: string) => val?.trim() || null,
        rootCauseAnalysis: (val: string) => val?.trim() || null,
        riskAssessment: (val: string) => val?.trim() || null,
        manufacturingImpact: (val: string) => val?.trim() || null,
        qualityImpact: (val: string) => val?.trim() || null,
        timelineEstimate: (val: string) => val?.trim() || null,
        approvalComments: (val: string) => val?.trim() || null,
        budgetAuthorization: (val: any) => val ? parseFloat(val) : null,
      };

      // Apply field mappings for filtered fields
      Object.keys(filteredBody).forEach(field => {
        if (field in allowedFieldMappings) {
          const mapper = allowedFieldMappings[field as keyof typeof allowedFieldMappings];
          updateData[field] = mapper(filteredBody[field]);
        }
      });

      // Track changes for revision history
      const changedFields: string[] = [];
      const previousValues: any = {};
      const newValues: any = {};
      
      Object.keys(updateData).forEach(field => {
        if (field === 'updatedAt') return;
        
        if (field in existingEcr) {
          const existingValue = existingEcr[field as keyof typeof existingEcr];
          const newValue = updateData[field];
          
          const existingStr = existingValue === null || existingValue === undefined ? '' : String(existingValue);
          const newStr = newValue === null || newValue === undefined ? '' : String(newValue);
          
          if (existingStr !== newStr) {
            changedFields.push(field);
            previousValues[field] = existingValue;
            newValues[field] = newValue;
          }
        }
      });

      // Create revision record if there are changes
      if (changedFields.length > 0) {
        await prisma.eCRRevision.create({
          data: {
            ecrId: id,
            userId: user.id,
            previousData: previousValues,
            newData: newValues,
            changedFields: changedFields,
            revisionNote: body.revisionNote || `Updated ${changedFields.length} field(s): ${changedFields.join(', ')}`,
          },
        });
      }

      const updatedEcr = await prisma.eCR.update({
        where: { id },
        data: updateData,
        include: {
          submitter: { select: { id: true, name: true, email: true, role: true, department: true } },
          assignee: { select: { id: true, name: true, email: true, role: true, department: true } },
          approver: { select: { id: true, name: true, email: true, role: true, department: true } },
          organization: { select: { id: true, name: true } },
          eco: {
            select: {
              id: true,
              ecoNumber: true,
              title: true,
              status: true,
              createdAt: true,
              completedAt: true,
              ecns: {
                select: {
                  id: true,
                  ecnNumber: true,
                  title: true,
                  status: true
                }
              }
            }
          }
        },
      });

      return NextResponse.json(updatedEcr);
    } catch (error) {
      console.error('Error updating ECR details:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    customAuthOptions: authOptions
  }
);