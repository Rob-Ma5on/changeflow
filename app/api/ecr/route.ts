import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;

    const ecrs = await prisma.eCR.findMany({
      where: {
        organizationId,
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(ecrs);
  } catch (error) {
    console.error('Error fetching ECRs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
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
      reason,
      urgency,
      assigneeId,
      affectedProducts,
      affectedDocuments,
      costImpact,
      scheduleImpact,
      implementationPlan,
    } = body;

    if (!title || !description || !reason) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;
    const submitterId = session.user.id;

    const currentYear = new Date().getFullYear();
    const latestEcr = await prisma.eCR.findFirst({
      where: { 
        organizationId,
        ecrNumber: {
          startsWith: `ECR-${currentYear}-`
        }
      },
      orderBy: { ecrNumber: 'desc' },
      select: { ecrNumber: true },
    });

    const nextNumber = latestEcr
      ? parseInt(latestEcr.ecrNumber.split('-')[2]) + 1
      : 1;
    const ecrNumber = `ECR-${currentYear}-${nextNumber.toString().padStart(3, '0')}`;

    const ecr = await prisma.eCR.create({
      data: {
        ecrNumber,
        title,
        description,
        reason,
        urgency: urgency || 'MEDIUM',
        organizationId,
        submitterId,
        assigneeId,
        affectedProducts,
        affectedDocuments,
        costImpact,
        scheduleImpact,
        implementationPlan,
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(ecr, { status: 201 });
  } catch (error) {
    console.error('Error creating ECR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}