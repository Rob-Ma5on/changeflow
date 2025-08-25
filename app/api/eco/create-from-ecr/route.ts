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

    const { ecrId } = await request.json();

    if (!ecrId) {
      return NextResponse.json(
        { error: 'ECR ID is required' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;
    const submitterId = session.user.id;

    // First, verify the ECR exists and is approved
    const ecr = await prisma.eCR.findFirst({
      where: {
        id: ecrId,
        organizationId,
        status: 'APPROVED'
      },
      include: {
        submitter: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } }
      }
    });

    if (!ecr) {
      return NextResponse.json(
        { error: 'ECR not found or not approved' },
        { status: 404 }
      );
    }

    // Check if ECR is already linked to an ECO
    const ecrWithEco = await prisma.eCR.findFirst({
      where: {
        id: ecrId,
        organizationId,
        ecoId: { not: null }
      },
      include: {
        eco: { select: { id: true, ecoNumber: true } }
      }
    });

    if (ecrWithEco && ecrWithEco.eco) {
      return NextResponse.json(
        { error: 'ECO already exists for this ECR', ecoNumber: ecrWithEco.eco.ecoNumber },
        { status: 409 }
      );
    }

    // Generate ECO number
    const currentYear = new Date().getFullYear();
    const latestEco = await prisma.eCO.findFirst({
      where: { 
        organizationId,
        ecoNumber: {
          startsWith: `ECO-${currentYear}-`
        }
      },
      orderBy: { ecoNumber: 'desc' },
      select: { ecoNumber: true },
    });

    const nextNumber = latestEco
      ? parseInt(latestEco.ecoNumber.split('-')[2]) + 1
      : 1;
    const ecoNumber = `ECO-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;

    // Use a transaction to create ECO and update ECR status atomically
    const result = await prisma.$transaction(async (tx) => {
      // Create ECO from ECR
      const eco = await tx.eCO.create({
        data: {
          ecoNumber,
          title: `Implement: ${ecr.title}`,
          description: `Implementation of approved ECR: ${ecr.description}`,
          organizationId,
          submitterId,
          assigneeId: ecr.assigneeId || ecr.submitterId, // Assign to ECR assignee or submitter
          status: 'DRAFT', // Start as draft (will map to BACKLOG in Kanban)
          priority: ecr.urgency as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL', // Map urgency to priority
          implementationPlan: ecr.implementationPlan,
          // Set target date based on urgency
          targetDate: (() => {
            const now = new Date();
            const daysToAdd = ecr.urgency === 'CRITICAL' ? 14 : 
                             ecr.urgency === 'HIGH' ? 30 : 
                             ecr.urgency === 'MEDIUM' ? 60 : 90;
            return new Date(now.setDate(now.getDate() + daysToAdd));
          })()
        },
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } },
          ecrs: { 
            select: { 
              id: true, 
              ecrNumber: true, 
              title: true,
              description: true,
              reason: true,
              urgency: true,
              submitter: { select: { name: true } }
            } 
          },
        },
      });

      // Update ECR status to CONVERTED and link to ECO
      await tx.eCR.update({
        where: { id: ecrId },
        data: { 
          status: 'CONVERTED',
          ecoId: eco.id
        }
      });

      return eco;
    });

    const eco = result;

    return NextResponse.json({
      message: 'ECO created successfully from ECR',
      eco
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ECO from ECR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}