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

    const ecns = await prisma.eCN.findMany({
      where: {
        organizationId,
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
            ecr: { select: { id: true, ecrNumber: true, title: true } }
          } 
        },
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
    const body = await request.json();
    const {
      title,
      description,
      ecoId,
      organizationId,
      submitterId,
      assigneeId,
      effectiveDate,
      changesImplemented,
      affectedItems,
      dispositionInstructions,
      verificationMethod,
    } = body;

    if (!title || !description || !organizationId || !submitterId) {
      return NextResponse.json(
        { error: 'Required fields are missing' },
        { status: 400 }
      );
    }

    const latestEcn = await prisma.eCN.findFirst({
      where: { organizationId },
      orderBy: { ecnNumber: 'desc' },
      select: { ecnNumber: true },
    });

    const nextNumber = latestEcn
      ? parseInt(latestEcn.ecnNumber.split('-')[1]) + 1
      : 1;
    const ecnNumber = `ECN-${nextNumber.toString().padStart(4, '0')}`;

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
            ecr: { select: { id: true, ecrNumber: true, title: true } }
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