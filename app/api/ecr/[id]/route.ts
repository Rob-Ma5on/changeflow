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

    const ecr = await prisma.eCR.findFirst({
      where: {
        id,
        organizationId,
      },
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

    if (!ecr) {
      return NextResponse.json(
        { error: 'ECR not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ecr);
  } catch (error) {
    console.error('Error fetching ECR:', error);
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
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { error: 'Status is required' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;
    const userId = session.user.id;

    // Verify the ECR exists and belongs to the organization
    const existingEcr = await prisma.eCR.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingEcr) {
      return NextResponse.json(
        { error: 'ECR not found' },
        { status: 404 }
      );
    }

    // Update the ECR status
    const updateData: any = { 
      status,
      updatedAt: new Date()
    };

    // Set approver and approval date when approving
    if (status === 'APPROVED') {
      updateData.approverId = userId;
      updateData.approvedAt = new Date();
    }

    const updatedEcr = await prisma.eCR.update({
      where: { id },
      data: updateData,
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
    console.error('Error updating ECR:', error);
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
    const userId = session.user.id;

    // Verify the ECR exists and belongs to the organization
    const existingEcr = await prisma.eCR.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingEcr) {
      return NextResponse.json(
        { error: 'ECR not found' },
        { status: 404 }
      );
    }

    // Check if ECR can be edited (not in final states)
    if (['APPROVED', 'REJECTED', 'IMPLEMENTED', 'CANCELLED'].includes(existingEcr.status)) {
      return NextResponse.json(
        { error: 'Cannot edit ECR in current status' },
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

    if (!body.reason?.trim()) {
      return NextResponse.json(
        { error: 'Business justification is required' },
        { status: 400 }
      );
    }

    if (!body.priority) {
      return NextResponse.json(
        { error: 'Priority is required' },
        { status: 400 }
      );
    }

    if (!body.customerImpact) {
      return NextResponse.json(
        { error: 'Customer impact is required' },
        { status: 400 }
      );
    }

    // Prepare update data - only allow editing of specific fields
    const updateData: any = {
      title: body.title.trim(),
      description: body.description.trim(),
      reason: body.reason.trim(),
      priority: body.priority,
      customerImpact: body.customerImpact,
      estimatedCostRange: body.estimatedCostRange || null,
      targetImplementationDate: body.targetImplementationDate ? new Date(body.targetImplementationDate) : null,
      stakeholders: body.stakeholders?.trim() || null,
      affectedProducts: body.affectedProducts?.trim() || null,
      affectedDocuments: body.affectedDocuments?.trim() || null,
      implementationPlan: body.implementationPlan?.trim() || null,
      updatedAt: new Date()
    };

    // Handle cost impact if provided
    if (body.costImpact !== undefined) {
      updateData.costImpact = body.costImpact ? parseFloat(body.costImpact) : null;
    }

    // Handle schedule impact if provided
    if (body.scheduleImpact !== undefined) {
      updateData.scheduleImpact = body.scheduleImpact?.trim() || null;
    }

    // Create revision record before update - only for actually changed fields
    const changedFields: string[] = [];
    const previousValues: any = {};
    const newValues: any = {};
    
    // Check each field to see if it actually changed
    Object.keys(updateData).forEach(field => {
      if (field === 'updatedAt') return; // Skip updatedAt field
      
      if (field in existingEcr) {
        const existingValue = existingEcr[field as keyof typeof existingEcr];
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
      await prisma.eCRRevision.create({
        data: {
          ecrId: id,
          userId: userId,
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
}