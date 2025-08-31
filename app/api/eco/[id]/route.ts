import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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

    const validECOStatuses = ['DRAFT', 'SUBMITTED', 'APPROVED', 'BACKLOG', 'IN_PROGRESS', 'REVIEW', 'COMPLETED', 'CANCELLED'];
    if (!validECOStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validECOStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;

    // Verify the ECO exists and belongs to the organization
    const existingEco = await prisma.eCO.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingEco) {
      return NextResponse.json(
        { error: 'ECO not found' },
        { status: 404 }
      );
    }

    // Update the ECO status
    try {
      const updatedEco = await prisma.eCO.update({
        where: { id },
        data: { 
          status,
          // Update completed date if moving to COMPLETED
          ...(status === 'COMPLETED' && { completedAt: new Date() })
        },
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } },
          ecrs: { select: { id: true, ecrNumber: true, title: true } },
          ecns: { select: { id: true, ecnNumber: true, title: true, status: true } },
        },
      });

      return NextResponse.json(updatedEco);
    } catch (prismaError) {
      console.error('Prisma update error:', prismaError);
      return NextResponse.json(
        { error: 'Database update failed', details: (prismaError as any)?.message || 'Unknown error' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating ECO:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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

    const eco = await prisma.eCO.findFirst({
      where: {
        id,
        organizationId,
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        ecrs: { 
          select: { 
            id: true, 
            ecrNumber: true, 
            title: true,
            description: true,
            reason: true,
            priority: true,
            submitter: { select: { name: true } }
          } 
        },
        ecns: {
          select: {
            id: true,
            ecnNumber: true,
            title: true,
            status: true
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

    if (!eco) {
      return NextResponse.json(
        { error: 'ECO not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(eco);
  } catch (error) {
    console.error('Error fetching ECO:', error);
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

    // Verify the ECO exists and belongs to the organization
    const existingEco = await prisma.eCO.findFirst({
      where: {
        id,
        organizationId,
      },
    });

    if (!existingEco) {
      return NextResponse.json(
        { error: 'ECO not found' },
        { status: 404 }
      );
    }

    // Check if ECO can be edited (not in final states)
    if (['COMPLETED', 'CANCELLED'].includes(existingEco.status)) {
      return NextResponse.json(
        { error: 'Cannot edit ECO in current status' },
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

    if (!body.priority) {
      return NextResponse.json(
        { error: 'Priority is required' },
        { status: 400 }
      );
    }

    // Prepare update data - only allow editing of specific fields
    const updateData: any = {
      title: body.title.trim(),
      description: body.description.trim(),
      priority: body.priority,
      implementationPlan: body.implementationPlan?.trim() || null,
      testingPlan: body.testingPlan?.trim() || null,
      rollbackPlan: body.rollbackPlan?.trim() || null,
      resourcesRequired: body.resourcesRequired?.trim() || null,
      estimatedEffort: body.estimatedEffort?.trim() || null,
      targetDate: body.targetDate ? new Date(body.targetDate) : null,
      effectiveDate: body.effectiveDate ? new Date(body.effectiveDate) : null,
      effectivityType: body.effectivityType || null,
      materialDisposition: body.materialDisposition || null,
      documentUpdates: body.documentUpdates?.trim() || null,
      implementationTeam: body.implementationTeam?.trim() || null,
      inventoryImpact: body.inventoryImpact === true || body.inventoryImpact === 'true',
      updatedAt: new Date()
    };

    // Handle estimated total cost
    if (body.estimatedTotalCost !== undefined) {
      updateData.estimatedTotalCost = body.estimatedTotalCost ? parseFloat(body.estimatedTotalCost) : null;
    }

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
      
      if (field in existingEco) {
        const existingValue = existingEco[field as keyof typeof existingEco];
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
      await prisma.eCORevision.create({
        data: {
          ecoId: id,
          userId: session.user.id,
          previousData: previousValues,
          newData: newValues,
          changedFields: changedFields,
          revisionNote: body.revisionNote || `Updated ${changedFields.length} field(s): ${changedFields.join(', ')}`,
        },
      });
    }

    const updatedEco = await prisma.eCO.update({
      where: { id },
      data: updateData,
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        ecrs: { 
          select: { 
            id: true, 
            ecrNumber: true, 
            title: true,
            description: true,
            reason: true,
            priority: true,
            submitter: { select: { name: true } }
          } 
        },
        ecns: {
          select: {
            id: true,
            ecnNumber: true,
            title: true,
            status: true
          }
        }
      },
    });

    return NextResponse.json(updatedEco);
  } catch (error) {
    console.error('Error updating ECO details:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}