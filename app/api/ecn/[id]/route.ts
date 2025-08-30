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