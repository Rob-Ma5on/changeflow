import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

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
    const { ecrIds, title, description, priority = 'MEDIUM' } = body;

    if (!ecrIds || !Array.isArray(ecrIds) || ecrIds.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 ECR IDs are required for bundling' },
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

    // Validate that all ECRs exist, are approved, and belong to the organization
    const ecrs = await prisma.eCR.findMany({
      where: {
        id: { in: ecrIds },
        organizationId,
        status: 'APPROVED',
      },
      include: {
        submitter: { select: { name: true } },
      },
    });

    if (ecrs.length !== ecrIds.length) {
      return NextResponse.json(
        { error: 'Some ECRs are not found, not approved, or already bundled' },
        { status: 400 }
      );
    }

    // Generate ECO number
    const currentYear = new Date().getFullYear();
    const latestEco = await prisma.eCO.findFirst({
      where: { 
        organizationId,
        ecoNumber: { startsWith: `ECO-${currentYear}-` }
      },
      orderBy: { ecoNumber: 'desc' },
      select: { ecoNumber: true },
    });

    const nextNumber = latestEco
      ? parseInt(latestEco.ecoNumber.split('-')[2]) + 1
      : 1;
    const ecoNumber = `ECO-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;

    // Create the ECO and link the ECRs in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the ECO
      const eco = await tx.eCO.create({
        data: {
          ecoNumber,
          title,
          description,
          organizationId,
          submitterId,
          priority,
          status: 'BACKLOG',
        },
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } },
        },
      });

      // Update all ECRs status to CONVERTED (temporarily can't link to ECO due to schema)
      await tx.eCR.updateMany({
        where: { 
          id: { in: ecrIds },
          organizationId,
        },
        data: { 
          status: 'CONVERTED',
        },
      });

      // Return the ECO (temporarily without linked ECRs due to schema)
      return eco;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error bundling ECRs into ECO:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}