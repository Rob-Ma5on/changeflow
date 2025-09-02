import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { generateNumber } from '@/lib/numbering';
import { withAuth, checkPermission, getEntityWithContext, filterRequestBody } from '@/middleware/auth-check';
import { validateTransition } from '@/lib/workflow-rules';

export const GET = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      // Check read permission
      const permissionResult = await checkPermission(user, 'ECR', 'READ');
      if (!permissionResult.allowed) {
        return NextResponse.json(
          { error: permissionResult.reason },
          { status: 403 }
        );
      }

      const { searchParams } = new URL(request.url);
      const status = searchParams.get('status');
      const organizationId = user.organizationId;

      const whereClause: any = {
        organizationId,
      };

      // Role-based filtering
      if (user.role === 'REQUESTOR') {
        // REQUESTOR can only see their own ECRs
        whereClause.OR = [
          { submitterId: user.id },
          { assigneeId: user.id }
        ];
      } else if (user.role === 'MANAGER') {
        // MANAGER can see all ECRs in organization
        // No additional filtering needed
      }
      // ENGINEER, QUALITY, MANUFACTURING, DOCUMENT_CONTROL, ADMIN, VIEWER can see all

      // Add status filter if provided
      if (status) {
        whereClause.status = status;
      }

      const ecrs = await prisma.eCR.findMany({
        where: whereClause,
        include: {
          submitter: { select: { id: true, name: true, email: true, role: true } },
          assignee: { select: { id: true, name: true, email: true, role: true } },
          approver: { select: { id: true, name: true, email: true, role: true } },
          organization: { select: { id: true, name: true } },
          eco: {
            select: {
              id: true,
              ecoNumber: true,
              title: true,
              status: true,
            }
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return NextResponse.json(ecrs);
    } catch (error) {
      console.error('Error fetching ECRs:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    entity: 'ECR',
    action: 'READ',
    customAuthOptions: authOptions
  }
);

export const POST = withAuth(
  async (request: NextRequest, { user }) => {
    try {
      // Check create permission
      const permissionResult = await checkPermission(user, 'ECR', 'CREATE');
      if (!permissionResult.allowed) {
        return NextResponse.json(
          { error: permissionResult.reason },
          { status: 403 }
        );
      }

      const body = await request.json();
      
      // Filter allowed fields based on user role
      const filteredBody = filterRequestBody(user, 'ECR', body);
      
      const {
        title,
        description,
        reason,
        priority,
        reasonForChange,
        customerImpact,
        estimatedCostRange,
        targetImplementationDate,
        stakeholders,
        assigneeId,
        affectedProducts,
        affectedDocuments,
        costImpact,
        scheduleImpact,
        implementationPlan,
      } = filteredBody;

      // Validate ALL required fields
      if (!title || !description || !reason || !priority || !reasonForChange || !customerImpact) {
        return NextResponse.json(
          { error: 'All required fields must be provided: title, description, reason, priority, reasonForChange, and customerImpact are required' },
          { status: 400 }
        );
      }

      // Validate reasonForChange is not empty
      if (!reasonForChange.trim()) {
        return NextResponse.json(
          { error: 'Reason for change cannot be empty' },
          { status: 400 }
        );
      }

      // Validate enums
      const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
      if (!validPriorities.includes(priority)) {
        return NextResponse.json(
          { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
          { status: 400 }
        );
      }

      const validImpacts = ['DIRECT_IMPACT', 'INDIRECT_IMPACT', 'NO_IMPACT'];
      if (!validImpacts.includes(customerImpact)) {
        return NextResponse.json(
          { error: `Invalid customer impact. Must be one of: ${validImpacts.join(', ')}` },
          { status: 400 }
        );
      }

      if (estimatedCostRange) {
        const validRanges = ['UNDER_1K', 'FROM_1K_TO_10K', 'FROM_10K_TO_50K', 'FROM_50K_TO_100K', 'OVER_100K'];
        if (!validRanges.includes(estimatedCostRange)) {
          return NextResponse.json(
            { error: `Invalid cost range. Must be one of: ${validRanges.join(', ')}` },
            { status: 400 }
          );
        }
      }

      // Validate target date
      if (targetImplementationDate) {
        const targetDate = new Date(targetImplementationDate);
        if (isNaN(targetDate.getTime())) {
          return NextResponse.json(
            { error: 'Invalid target implementation date format' },
            { status: 400 }
          );
        }
        if (targetDate <= new Date()) {
          return NextResponse.json(
            { error: 'Target implementation date must be in the future' },
            { status: 400 }
          );
        }
      }

      const organizationId = user.organizationId;
      const submitterId = user.id;

      // Generate ECR number
      const ecrNumber = await generateNumber('ECR', organizationId);

      const ecr = await prisma.eCR.create({
        data: {
          ecrNumber,
          title,
          description,
          reason,
          priority,
          reasonForChange,
          customerImpact,
          estimatedCostRange,
          targetImplementationDate: targetImplementationDate ? new Date(targetImplementationDate) : null,
          stakeholders,
          organizationId,
          submitterId,
          assigneeId,
          affectedProducts,
          affectedDocuments,
          costImpact,
          scheduleImpact,
          implementationPlan,
          status: 'DRAFT', // Always start as draft
        },
        include: {
          submitter: { select: { id: true, name: true, email: true, role: true } },
          assignee: { select: { id: true, name: true, email: true, role: true } },
          organization: { select: { id: true, name: true } },
        },
      });

      // ECR created successfully

      return NextResponse.json(ecr, { status: 201 });
    } catch (error: unknown) {
      console.error('Error creating ECR:', error);
      const err = error as { message?: string; code?: string };
      if (err.code === 'P2002') {
        return NextResponse.json(
          { error: 'ECR number already exists' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: err.message || 'Internal server error' },
        { status: 500 }
      );
    }
  },
  {
    entity: 'ECR',
    action: 'CREATE',
    customAuthOptions: authOptions
  }
);