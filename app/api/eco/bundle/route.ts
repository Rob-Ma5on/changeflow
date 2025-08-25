import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateNumber } from '@/lib/numbering';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { ecrIds, title, description } = await request.json();

    if (!ecrIds || !Array.isArray(ecrIds) || ecrIds.length === 0) {
      return NextResponse.json(
        { error: 'ECR IDs array is required' },
        { status: 400 }
      );
    }

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;
    const submitterId = session.user.id;

    // Validate all ECRs exist, are approved, and belong to the organization
    const ecrs = await prisma.eCR.findMany({
      where: {
        id: { in: ecrIds },
        organizationId,
        status: 'APPROVED'
      },
      include: {
        submitter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    if (ecrs.length !== ecrIds.length) {
      return NextResponse.json(
        { error: 'Some ECRs not found, not approved, or already linked to an ECO' },
        { status: 400 }
      );
    }

    // Check that none of the ECRs are already linked to an ECO
    const linkedEcrs = await prisma.eCR.findMany({
      where: {
        id: { in: ecrIds },
        ecoId: { not: null }
      }
    });

    if (linkedEcrs.length > 0) {
      return NextResponse.json(
        { error: `ECRs already linked to ECOs: ${linkedEcrs.map(e => e.ecrNumber).join(', ')}` },
        { status: 400 }
      );
    }

    // Generate ECO number
    const ecoNumber = await generateNumber('ECO', organizationId);

    // Determine priority based on highest ECR priority
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    const maxPriority = ecrs.reduce((max, ecr) => {
      const currentIndex = priorities.indexOf(ecr.urgency);
      const maxIndex = priorities.indexOf(max);
      return currentIndex > maxIndex ? ecr.urgency : max;
    }, 'LOW');

    // Calculate target date based on highest priority
    const now = new Date();
    const daysToAdd = maxPriority === 'CRITICAL' ? 14 : 
                     maxPriority === 'HIGH' ? 30 : 
                     maxPriority === 'MEDIUM' ? 60 : 90;
    const targetDate = new Date(now.setDate(now.getDate() + daysToAdd));

    // Use transaction to create ECO and update all ECRs atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create ECO
      const eco = await tx.eCO.create({
        data: {
          ecoNumber,
          title,
          description,
          organizationId,
          submitterId,
          assigneeId: ecrs[0].assigneeId || ecrs[0].submitterId, // Use first ECR's assignee
          status: 'DRAFT', // Start as draft
          priority: maxPriority as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
          targetDate,
          implementationPlan: `Bundle implementation for ECRs: ${ecrs.map(e => e.ecrNumber).join(', ')}`
        },
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } }
        }
      });

      // Update all ECRs to link to the new ECO and set status to CONVERTED
      await tx.eCR.updateMany({
        where: { id: { in: ecrIds } },
        data: { 
          ecoId: eco.id,
          status: 'CONVERTED'
        }
      });

      // Get updated ECRs for response
      const updatedEcrs = await tx.eCR.findMany({
        where: { id: { in: ecrIds } },
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } }
        }
      });

      return { eco, ecrs: updatedEcrs };
    });

    return NextResponse.json({
      message: `Successfully bundled ${ecrIds.length} ECRs into ECO ${ecoNumber}`,
      eco: result.eco,
      bundledEcrs: result.ecrs
    }, { status: 201 });

  } catch (error) {
    console.error('Error bundling ECRs into ECO:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}