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

    const ecns = await prisma.eCN.findMany({
      where: whereClause,
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        eco: {
          select: {
            id: true,
            ecoNumber: true,
            title: true,
            status: true,
            completedAt: true,
            ecrs: {
              select: {
                id: true,
                ecrNumber: true,
                title: true,
                submitter: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(ecns);
  } catch (error) {
    console.error('Error fetching ECNs:', error);
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
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      description,
      ecoId,
      assigneeId,
      effectiveDate,
      changesImplemented,
      affectedItems,
      dispositionInstructions,
      verificationMethod,
      distributionList,
      internalStakeholders,
      customerNotificationRequired,
      responseDeadline,
      implementationStatus,
      actualImplementationDate,
      acknowledgmentStatus,
      finalDocumentationSummary,
      closureApprover,
    } = body;

    const organizationId = session.user.organizationId;
    const submitterId = session.user.id;

    // Validate ALL required fields for clean slate approach
    if (!title || !description || !distributionList || !distributionList.trim() || !customerNotificationRequired || !implementationStatus) {
      return NextResponse.json(
        { error: 'All required fields must be provided: title, description, distributionList, customerNotificationRequired, and implementationStatus are required' },
        { status: 400 }
      );
    }

    // Validate distribution list has at least one valid email (required)
    const emails = distributionList.split(',').map((email: string) => email.trim()).filter((email: string) => email.length > 0);
    if (emails.length === 0) {
      return NextResponse.json(
        { error: 'Distribution list must have at least one email address' },
        { status: 400 }
      );
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses in distribution list: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate customer notification required enum (required)
    if (!customerNotificationRequired) {
      return NextResponse.json(
        { error: 'Customer notification type is required' },
        { status: 400 }
      );
    }
    const validNotifications = ['FORMAL', 'INFORMATIONAL', 'NOT_REQUIRED'];
    if (!validNotifications.includes(customerNotificationRequired)) {
      return NextResponse.json(
        { error: `Invalid customer notification type. Must be one of: ${validNotifications.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate response deadline enum
    if (responseDeadline) {
      const validDeadlines = ['HOURS_24', 'HOURS_48', 'DAYS_5', 'DAYS_10', 'DAYS_30'];
      if (!validDeadlines.includes(responseDeadline)) {
        return NextResponse.json(
          { error: `Invalid response deadline. Must be one of: ${validDeadlines.join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Validate implementation status enum (required)
    const validStatuses = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETE', 'VERIFIED'];
    if (!validStatuses.includes(implementationStatus)) {
      return NextResponse.json(
        { error: `Invalid implementation status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate dates
    if (effectiveDate) {
      const effective = new Date(effectiveDate);
      if (isNaN(effective.getTime())) {
        return NextResponse.json(
          { error: 'Invalid effective date format' },
          { status: 400 }
        );
      }
    }

    if (actualImplementationDate) {
      const actual = new Date(actualImplementationDate);
      if (isNaN(actual.getTime())) {
        return NextResponse.json(
          { error: 'Invalid actual implementation date format' },
          { status: 400 }
        );
      }
    }

    let ecnNumber: string;
    
    // If creating ECN from an ECO, validate and use matching number format
    if (ecoId) {
      const eco = await prisma.eCO.findFirst({
        where: { id: ecoId, organizationId },
        select: { ecoNumber: true, status: true }
      });
      
      if (!eco) {
        return NextResponse.json(
          { error: 'ECO not found' },
          { status: 404 }
        );
      }

      // Validate ECO is completed
      if (eco.status !== 'COMPLETED') {
        return NextResponse.json(
          { error: 'ECNs can only be created from completed ECOs' },
          { status: 400 }
        );
      }

      // Check if ECN already exists for this ECO
      const existingEcn = await prisma.eCN.findFirst({
        where: { ecoId, organizationId }
      });

      if (existingEcn) {
        return NextResponse.json(
          { error: 'An ECN already exists for this ECO', ecnNumber: existingEcn.ecnNumber },
          { status: 409 }
        );
      }
      
      // Convert ECO-25-001 to ECN-25-001
      ecnNumber = eco.ecoNumber.replace('ECO-', 'ECN-');
    } else {
      // Generate new ECN number using year-based numbering system
      ecnNumber = await generateNumber('ECN', organizationId);
    }

    const ecn = await prisma.eCN.create({
      data: {
        ecnNumber,
        title,
        description,
        ecoId,
        organizationId,
        submitterId,
        assigneeId,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        changesImplemented,
        affectedItems,
        dispositionInstructions,
        verificationMethod,
        distributionList,
        internalStakeholders,
        customerNotificationRequired,
        responseDeadline: responseDeadline || null,
        implementationStatus,
        actualImplementationDate: actualImplementationDate ? new Date(actualImplementationDate) : null,
        acknowledgmentStatus,
        finalDocumentationSummary,
        closureApprover,
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        eco: { 
          select: { 
            id: true, 
            ecoNumber: true, 
            title: true,
            ecrs: { select: { id: true, ecrNumber: true, title: true } }
          } 
        },
      },
    });

    return NextResponse.json(ecn, { status: 201 });
  } catch (error) {
    console.error('Error creating ECN:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}