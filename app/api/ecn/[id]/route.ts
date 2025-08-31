import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const organizationId = session.user.organizationId;

    const ecn = await prisma.eCN.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        eco: {
          include: {
            submitter: { select: { name: true, email: true } },
            assignee: { select: { name: true, email: true } },
            ecrs: {
              include: {
                submitter: { select: { name: true, email: true } },
                assignee: { select: { name: true, email: true } },
                approver: { select: { name: true, email: true } },
                organization: { select: { id: true, name: true } }
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
                email: true
              }
            }
          },
          orderBy: {
            changedAt: 'desc'
          }
        }
      },
    });

    if (!ecn) {
      return NextResponse.json(
        { error: 'ECN not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ecn);
  } catch (error) {
    console.error('Error fetching ECN:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { status, effectiveDate, distributedAt } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const validECNStatuses = ['DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'DISTRIBUTED', 'EFFECTIVE', 'CANCELLED'];
    if (!validECNStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validECNStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Verify the ECN exists and belongs to the organization
    const existingEcn = await prisma.eCN.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingEcn) {
      return NextResponse.json(
        { error: 'ECN not found' },
        { status: 404 }
      );
    }

    // Update the ECN
    const updatedEcn = await prisma.eCN.update({
      where: { id },
      data: { 
        status,
        ...(effectiveDate && { effectiveDate: new Date(effectiveDate) }),
        ...(distributedAt && { distributedAt: new Date(distributedAt) }),
        ...(status === 'DISTRIBUTED' && !distributedAt && { distributedAt: new Date() }),
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        eco: {
          include: {
            submitter: { select: { name: true, email: true } },
            assignee: { select: { name: true, email: true } },
            ecrs: {
              include: {
                submitter: { select: { name: true, email: true } },
                assignee: { select: { name: true, email: true } },
                approver: { select: { name: true, email: true } },
                organization: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
    });

    return NextResponse.json(updatedEcn);
  } catch (error) {
    console.error('Error updating ECN:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const organizationId = session.user.organizationId;

    // Verify the ECN exists and belongs to the organization
    const existingEcn = await prisma.eCN.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingEcn) {
      return NextResponse.json(
        { error: 'ECN not found' },
        { status: 404 }
      );
    }

    // Check if ECN can be edited (not in final states)
    if (['EFFECTIVE', 'CANCELLED'].includes(existingEcn.status)) {
      return NextResponse.json(
        { error: 'Cannot edit ECN in current status' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!body.title?.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!body.description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Prepare update data - only allow editing of specific fields
    const updateData: any = {
      title: body.title.trim(),
      description: body.description.trim(),
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
      distributedAt: body.distributedAt ? new Date(body.distributedAt) : null,
      changesImplemented: body.changesImplemented?.trim() || null,
      affectedItems: body.affectedItems?.trim() || null,
      dispositionInstructions: body.dispositionInstructions?.trim() || null,
      verificationMethod: body.verificationMethod?.trim() || null,
      distributionList: body.distributionList?.trim() || null,
      internalStakeholders: body.internalStakeholders?.trim() || null,
      customerNotificationRequired: body.customerNotificationRequired || null,
      notificationMethod: body.notificationMethod?.trim() || null,
      responseDeadline: body.responseDeadline || null,
      implementationStatus: body.implementationStatus || null,
      actualImplementationDate: body.actualImplementationDate ? new Date(body.actualImplementationDate) : null,
      finalDocumentationSummary: body.finalDocumentationSummary?.trim() || null,
      closureApprover: body.closureApprover?.trim() || null,
      closureDate: body.closureDate ? new Date(body.closureDate) : null,
      acknowledgmentStatus: body.acknowledgmentStatus?.trim() || null,
      updatedAt: new Date()
    };

    // Handle assignee if provided
    if (body.assigneeId !== undefined) {
      // If assigneeId is an empty string, set to null, otherwise validate it exists
      if (body.assigneeId === '') {
        updateData.assigneeId = null;
      } else {
        const assignee = await prisma.user.findFirst({
          where: {
            id: body.assigneeId,
            organizationId,
          },
        });
        if (!assignee) {
          return NextResponse.json(
            { error: 'Invalid assignee selected' },
            { status: 400 }
          );
        }
        updateData.assigneeId = body.assigneeId;
      }
    }

    // Create revision record before update - only for actually changed fields
    const changedFields: string[] = [];
    const previousValues: any = {};
    const newValues: any = {};
    
    // Check each field to see if it actually changed
    Object.keys(updateData).forEach(field => {
      if (field === 'updatedAt') return; // Skip updatedAt field
      
      if (field in existingEcn) {
        const existingValue = existingEcn[field as keyof typeof existingEcn];
        const newValue = updateData[field];
        
        // Convert both values to strings for comparison to handle different types
        const existingStr = existingValue === null || existingValue === undefined ? '' : String(existingValue);
        const newStr = newValue === null || newValue === undefined ? '' : String(newValue);
        
        // Only add to changed fields if values are actually different
        if (existingStr !== newStr) {
          changedFields.push(field);
          previousValues[field] = existingValue;
          newValues[field] = newValue;
        }
      }
    });

    // Create revision record only if there are actual changes
    if (changedFields.length > 0) {
      await prisma.eCNRevision.create({
        data: {
          ecnId: id,
          userId: session.user.id,
          previousData: previousValues,
          newData: newValues,
          changedFields: changedFields,
          revisionNote: body.revisionNote || `Updated ${changedFields.length} field(s): ${changedFields.join(', ')}`,
        },
      });
    }

    const updatedEcn = await prisma.eCN.update({
      where: { id },
      data: updateData,
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        eco: {
          include: {
            submitter: { select: { name: true, email: true } },
            assignee: { select: { name: true, email: true } },
            ecrs: {
              include: {
                submitter: { select: { name: true, email: true } },
                assignee: { select: { name: true, email: true } },
                approver: { select: { name: true, email: true } },
                organization: { select: { id: true, name: true } }
              }
            }
          }
        }
      },
    });

    return NextResponse.json(updatedEcn);
  } catch (error) {
    console.error('Error updating ECN details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}