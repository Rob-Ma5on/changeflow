import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const organizationId = searchParams.get('organizationId');

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      );
    }

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
    const body = await request.json();
    const {
      title,
      description,
      ecrId,
      organizationId,
      submitterId,
      assigneeId,
      priority,
      implementationPlan,
      testingPlan,
      rollbackPlan,
      resourcesRequired,
      estimatedEffort,
      targetDate,
    } = body;

    if (!title || !description || !organizationId || !submitterId) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const latestEco = await prisma.eCO.findFirst({
      where: { organizationId },
      orderBy: { ecoNumber: 'desc' },
      select: { ecoNumber: true },
    });

    const nextNumber = latestEco
      ? parseInt(latestEco.ecoNumber.split('-')[1]) + 1
      : 1;
    const ecoNumber = `ECO-${nextNumber.toString().padStart(4, '0')}`;

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