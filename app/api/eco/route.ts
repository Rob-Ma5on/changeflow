import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const organizationId = session.user.organizationId;

    const ecos = await prisma.eCO.findMany({
      where: {
        organizationId,
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        approver: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        ecr: { select: { id: true, ecrNumber: true, title: true } },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(ecos);
  } catch (error) {
    console.error('Error fetching ECOs:', error);
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
      ecrId,
      assigneeId,
      priority,
      implementationPlan,
      testingPlan,
      rollbackPlan,
      resourcesRequired,
      estimatedEffort,
      targetDate,
    } = body;

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;
    const submitterId = session.user.id;

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

    const eco = await prisma.eCO.create({
      data: {
        ecoNumber,
        title,
        description,
        ecrId,
        organizationId,
        submitterId,
        assigneeId,
        priority: priority || 'MEDIUM',
        implementationPlan,
        testingPlan,
        rollbackPlan,
        resourcesRequired,
        estimatedEffort,
        targetDate: targetDate ? new Date(targetDate) : null,
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        ecr: { select: { id: true, ecrNumber: true, title: true } },
      },
    });

    return NextResponse.json(eco, { status: 201 });
  } catch (error) {
    console.error('Error creating ECO:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}