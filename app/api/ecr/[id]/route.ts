import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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