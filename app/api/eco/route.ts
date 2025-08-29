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
        ecrs: { 
          select: { 
            id: true, 
            ecrNumber: true, 
            title: true,
            submitter: { select: { name: true } }
          } 
        },
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
      sourceEcrIds,
      assigneeId,
      priority,
      implementationPlan,
      testingPlan,
      rollbackPlan,
      resourcesRequired,
      estimatedEffort,
      targetDate,
      effectiveDate,
      effectivityType,
      materialDisposition,
      documentUpdates,
      implementationTeam,
      inventoryImpact,
      estimatedTotalCost,
    } = body;

    // Validate ALL required fields for clean slate approach
    if (!title || !description || !effectiveDate || !effectivityType || !materialDisposition) {
      return NextResponse.json(
        { error: 'All required fields must be provided: title, description, effectiveDate, effectivityType, and materialDisposition are required' },
        { status: 400 }
      );
    }

    // Validate effective date format and future date requirement
    const effective = new Date(effectiveDate);
    if (isNaN(effective.getTime())) {
      return NextResponse.json(
        { error: 'Invalid effective date format' },
        { status: 400 }
      );
    }

    // Validate priority enum (required)
    if (!priority) {
      return NextResponse.json(
        { error: 'Priority is required' },
        { status: 400 }
      );
    }
    const validPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    if (!validPriorities.includes(priority)) {
      return NextResponse.json(
        { error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate effectivity type enum (required)
    const validTypes = ['DATE_BASED', 'IMMEDIATE'];
    if (!validTypes.includes(effectivityType)) {
      return NextResponse.json(
        { error: `Invalid effectivity type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate material disposition enum (required)
    const validDispositions = ['USE_AS_IS', 'REWORK', 'SCRAP', 'RETURN_TO_VENDOR', 'SORT_INSPECT', 'NO_IMPACT'];
    if (!validDispositions.includes(materialDisposition)) {
      return NextResponse.json(
        { error: `Invalid material disposition. Must be one of: ${validDispositions.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate estimated cost is positive if provided
    if (estimatedTotalCost !== undefined && estimatedTotalCost !== null) {
      const cost = parseFloat(estimatedTotalCost.toString());
      if (isNaN(cost)) {
        return NextResponse.json(
          { error: 'Estimated total cost must be a valid number' },
          { status: 400 }
        );
      }
      if (cost < 0) {
        return NextResponse.json(
          { error: 'Estimated total cost must be positive' },
          { status: 400 }
        );
      }
    }

    // Validate target date is in the future if provided
    if (targetDate) {
      const target = new Date(targetDate);
      if (isNaN(target.getTime())) {
        return NextResponse.json(
          { error: 'Invalid target date format' },
          { status: 400 }
        );
      }
      if (target <= new Date()) {
        return NextResponse.json(
          { error: 'Target date must be in the future' },
          { status: 400 }
        );
      }
    }

    const organizationId = session.user.organizationId;
    const submitterId = session.user.id;

    // Generate ECO number using new year-based numbering system
    const ecoNumber = await generateNumber('ECO', organizationId);

    // Use transaction to create ECO and link/update ECRs
    const eco = await prisma.$transaction(async (tx) => {
      // Create the ECO
      const newEco = await tx.eCO.create({
        data: {
          ecoNumber,
          title,
          description,
          organizationId,
          submitterId,
          assigneeId,
          priority,
          implementationPlan,
          testingPlan,
          rollbackPlan,
          resourcesRequired,
          estimatedEffort,
          targetDate: targetDate ? new Date(targetDate) : null,
          effectiveDate: new Date(effectiveDate),
          effectivityType,
          materialDisposition,
          documentUpdates,
          implementationTeam,
          inventoryImpact: inventoryImpact || false,
          estimatedTotalCost: estimatedTotalCost ? parseFloat(estimatedTotalCost.toString()) : null,
        },
      });

      // Link source ECRs if provided
      if (sourceEcrIds && sourceEcrIds.length > 0) {
        // Verify all ECRs are approved and belong to the organization
        const ecrs = await tx.eCR.findMany({
          where: {
            id: { in: sourceEcrIds },
            organizationId,
            status: 'APPROVED'
          }
        });

        if (ecrs.length !== sourceEcrIds.length) {
          throw new Error('One or more ECRs are not approved or do not exist');
        }

        // Update ECRs to link to the ECO and mark as IMPLEMENTED
        await tx.eCR.updateMany({
          where: {
            id: { in: sourceEcrIds }
          },
          data: {
            ecoId: newEco.id,
            status: 'IMPLEMENTED'
          }
        });
      } else if (ecrId) {
        // Legacy single ECR support
        const ecr = await tx.eCR.findFirst({
          where: {
            id: ecrId,
            organizationId,
            status: 'APPROVED'
          }
        });

        if (!ecr) {
          throw new Error('ECR not found or not approved');
        }

        await tx.eCR.update({
          where: { id: ecrId },
          data: {
            ecoId: newEco.id,
            status: 'IMPLEMENTED'
          }
        });
      }

      // Return ECO with includes
      return await tx.eCO.findUnique({
        where: { id: newEco.id },
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          organization: { select: { id: true, name: true } },
          ecrs: { select: { id: true, ecrNumber: true, title: true } },
        }
      });
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