import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateNumber } from '@/lib/numbering';

export async function GET() {
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
        ecrs: { select: { id: true, ecrNumber: true, title: true } },
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

    // Generate ECO number using new year-based numbering system
    const ecoNumber = await generateNumber('ECO', organizationId);

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
        ecrs: { select: { id: true, ecrNumber: true, title: true } },
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