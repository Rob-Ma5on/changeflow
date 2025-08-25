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
    } = body;

    const organizationId = session.user.organizationId;
    const submitterId = session.user.id;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    let ecnNumber: string;
    
    // If creating ECN from an ECO, use matching number format
    if (ecoId) {
      const eco = await prisma.eCO.findFirst({
        where: { id: ecoId, organizationId },
        select: { ecoNumber: true }
      });
      
      if (!eco) {
        return NextResponse.json(
          { error: 'ECO not found' },
          { status: 404 }
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