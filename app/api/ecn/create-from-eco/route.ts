import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ecoId } = await request.json();

    if (!ecoId) {
      return NextResponse.json(
        { error: 'ECO ID is required' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;
    const submitterId = session.user.id;

    // First, verify the ECO exists and is completed
    const eco = await prisma.eCO.findFirst({
      where: {
        id: ecoId,
        organizationId,
        status: 'COMPLETED'
      },
      include: {
        submitter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        ecrs: {
          select: {
            id: true,
            ecrNumber: true,
            title: true,
            description: true,
            reason: true,
            urgency: true,
            affectedProducts: true,
            affectedDocuments: true
          }
        }
      }
    });

    if (!eco) {
      return NextResponse.json(
        { error: 'ECO not found or not completed' },
        { status: 404 }
      );
    }

    // Check if ECN already exists for this ECO
    const existingEcn = await prisma.eCN.findFirst({
      where: {
        ecoId,
        organizationId
      }
    });

    if (existingEcn) {
      return NextResponse.json(
        { error: 'ECN already exists for this ECO', ecnNumber: existingEcn.ecnNumber },
        { status: 409 }
      );
    }

    // Generate ECN number that MATCHES the ECO number
    // ECO-2025-001 → ECN-2025-001 (same final digits)
    const ecoNumberParts = eco.ecoNumber.split('-'); // ["ECO", "2025", "001"]
    if (ecoNumberParts.length !== 3) {
      return NextResponse.json(
        { error: 'Invalid ECO number format' },
        { status: 400 }
      );
    }
    
    const [, year, sequence] = ecoNumberParts;
    const ecnNumber = `ECN-${year}-${sequence}`;

    // Verify this ECN number doesn't already exist (shouldn't happen, but safety check)
    const duplicateEcn = await prisma.eCN.findFirst({
      where: {
        ecnNumber,
        organizationId
      }
    });

    if (duplicateEcn) {
      return NextResponse.json(
        { error: `ECN number ${ecnNumber} already exists` },
        { status: 409 }
      );
    }

    // Create ECN from completed ECO
    const ecn = await prisma.eCN.create({
      data: {
        ecnNumber,
        title: `Engineering Change Notice - ${eco.title}`,
        description: `Formal notice of implementation for ${eco.ecoNumber}: ${eco.description}`,
        ecoId: eco.id,
        organizationId,
        submitterId,
        assigneeId: eco.assigneeId || eco.submitterId, // Assign to ECO assignee or submitter
        status: 'PENDING_APPROVAL',
        changesImplemented: eco.implementationPlan || 'Implementation completed per ECO specifications',
        affectedItems: eco.ecr?.affectedProducts || 'See linked ECO and ECR for affected items',
        dispositionInstructions: 'All existing inventory and work-in-progress should be handled according to standard procedures',
        verificationMethod: 'Implementation verification completed through ECO tracking'
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
            description: true,
            status: true,
            completedAt: true,
            ecrs: {
              select: {
                id: true,
                ecrNumber: true,
                title: true,
                description: true,
                submitter: { select: { name: true } }
              }
            }
          } 
        },
      },
    });

    return NextResponse.json({
      message: 'ECN created successfully from completed ECO',
      ecn
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ECN from ECO:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}