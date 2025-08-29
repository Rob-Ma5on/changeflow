import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

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
        { error: 'Database update failed', details: prismaError.message },
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