import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateNumber } from '@/lib/numbering';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const organizationId = session.user.organizationId;

    const whereClause: { organizationId: string; status?: string } = {
      organizationId,
    };

    // Add status filter if provided
    if (status) {
      whereClause.status = status;
    }

    const ecrs = await prisma.eCR.findMany({
      where: whereClause,
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
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
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized - Please log in first' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      reason,
      urgency,
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
    } = body;

    // Validate required fields
    if (!title || !description || !reason) {
      return NextResponse.json(
        { error: 'Required fields are missing: title, description, and business justification are required' },
        { status: 400 }
      );
    }

    // Validate priority is required for Phase 1
    if (!priority) {
      return NextResponse.json(
        { error: 'Priority is required' },
        { status: 400 }
      );
    }

    // Validate priority enum
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate customer impact enum
    if (customerImpact) {
      const validImpacts = ['DIRECT_IMPACT', 'INDIRECT_IMPACT', 'NO_IMPACT'];
      if (!validImpacts.includes(customerImpact)) {
        return NextResponse.json(
          { error: `Invalid customer impact. Must be one of: ${validImpacts.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate estimated cost range enum
    if (estimatedCostRange) {
      const validRanges = ['UNDER_1K', 'FROM_1K_TO_10K', 'FROM_10K_TO_50K', 'FROM_50K_TO_100K', 'OVER_100K'];
      if (!validRanges.includes(estimatedCostRange)) {
        return NextResponse.json(
          { error: `Invalid cost range. Must be one of: ${validRanges.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate target date is in the future
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

    const organizationId = session.user.organizationId;
    const submitterId = session.user.id;

    // Debug logging for troubleshooting
    console.log('Session user data:', {
      id: session.user.id,
      email: session.user.email,
      organizationId: session.user.organizationId,
      organization: session.user.organization
    });

    if (!organizationId) {
      return NextResponse.json(
        { error: 'User is not associated with any organization' },
        { status: 400 }
      );
    }

    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      console.error('Organization not found:', organizationId);
      console.error('Available organizations:');
      const allOrgs = await prisma.organization.findMany({
        select: { id: true, name: true }
      });
      console.error(allOrgs);
      
      return NextResponse.json(
        { 
          error: 'Organization not found. Please log out and log back in.',
          details: `Organization ID ${organizationId} does not exist. Available organizations: ${allOrgs.map(o => `${o.name} (${o.id})`).join(', ')}`
        },
        { status: 400 }
      );
    }

    // Generate ECR number using new year-based numbering system
    const ecrNumber = await generateNumber('ECR', organizationId);
    console.log('Creating ECR with number:', ecrNumber, 'for organization:', organizationId);

    const ecr = await prisma.eCR.create({
      data: {
        ecrNumber,
        title,
        description,
        reason,
        urgency: urgency || priority || 'MEDIUM',
        priority,
        reasonForChange,
        customerImpact: customerImpact || 'NO_IMPACT',
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
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(ecr, { status: 201 });
  } catch (error: unknown) {
    console.error('Error creating ECR:', error);
    const err = error as { message?: string; code?: string };
    console.error('Error details:', err.message);
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
}