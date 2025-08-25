import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ number: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { number } = await params;
    const organizationId = session.user.organizationId;

    // Determine what type of number was provided and find the complete chain
    let traceabilityData = null;

    // Try to find by ECN number first
    const ecn = await prisma.eCN.findFirst({
      where: {
        ecnNumber: number,
        organizationId,
      },
      include: {
        submitter: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
        organization: { select: { id: true, name: true } },
        eco: {
          include: {
            submitter: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
            approver: { select: { id: true, name: true, email: true } },
            ecrs: {
              include: {
                submitter: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
                approver: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
    });

    if (ecn) {
      traceabilityData = {
        type: 'ECN',
        ecn,
        eco: ecn.eco,
        ecrs: ecn.eco?.ecrs || [],
      };
    } else {
      // Try to find by ECO number
      const eco = await prisma.eCO.findFirst({
        where: {
          ecoNumber: number,
          organizationId,
        },
        include: {
          submitter: { select: { id: true, name: true, email: true } },
          assignee: { select: { id: true, name: true, email: true } },
          approver: { select: { id: true, name: true, email: true } },
          ecrs: {
            include: {
              submitter: { select: { id: true, name: true, email: true } },
              assignee: { select: { id: true, name: true, email: true } },
              approver: { select: { id: true, name: true, email: true } },
            },
          },
          ecns: {
            include: {
              submitter: { select: { id: true, name: true, email: true } },
              assignee: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });

      if (eco) {
        traceabilityData = {
          type: 'ECO',
          ecn: eco.ecns[0] || null,
          eco,
          ecrs: eco.ecrs || [],
        };
      } else {
        // Try to find by ECR number
        const ecr = await prisma.eCR.findFirst({
          where: {
            ecrNumber: number,
            organizationId,
          },
          include: {
            submitter: { select: { id: true, name: true, email: true } },
            assignee: { select: { id: true, name: true, email: true } },
            approver: { select: { id: true, name: true, email: true } },
            eco: {
              include: {
                submitter: { select: { id: true, name: true, email: true } },
                assignee: { select: { id: true, name: true, email: true } },
                approver: { select: { id: true, name: true, email: true } },
                ecrs: {
                  include: {
                    submitter: { select: { id: true, name: true, email: true } },
                    assignee: { select: { id: true, name: true, email: true } },
                    approver: { select: { id: true, name: true, email: true } },
                  },
                },
                ecns: {
                  include: {
                    submitter: { select: { id: true, name: true, email: true } },
                    assignee: { select: { id: true, name: true, email: true } },
                  },
                },
              },
            },
          },
        });

        if (ecr) {
          traceabilityData = {
            type: 'ECR',
            ecn: ecr.eco?.ecns[0] || null,
            eco: ecr.eco || null,
            ecrs: ecr.eco?.ecrs || [ecr],
          };
        }
      }
    }

    if (!traceabilityData) {
      return NextResponse.json(
        { error: 'No records found for the provided number' },
        { status: 404 }
      );
    }

    // Create timeline events from all the data
    const timeline = [];

    // ECR events
    traceabilityData.ecrs.forEach((ecr: {
      id: string;
      ecrNumber: string;
      title: string;
      createdAt: string;
      submittedAt?: string;
      approvedAt?: string;
      rejectedAt?: string;
      submitter: { name: string };
      assignee?: { name: string };
      approver?: { name: string };
    }) => {
      if (ecr.createdAt) {
        timeline.push({
          type: 'ECR_CREATED',
          date: ecr.createdAt,
          title: `ECR ${ecr.ecrNumber} Created`,
          description: ecr.title,
          user: ecr.submitter,
          status: 'DRAFT',
          recordId: ecr.id,
          recordType: 'ECR',
          recordNumber: ecr.ecrNumber,
        });
      }
      if (ecr.submittedAt) {
        timeline.push({
          type: 'ECR_SUBMITTED',
          date: ecr.submittedAt,
          title: `ECR ${ecr.ecrNumber} Submitted`,
          description: 'Submitted for review',
          user: ecr.submitter,
          status: 'SUBMITTED',
          recordId: ecr.id,
          recordType: 'ECR',
          recordNumber: ecr.ecrNumber,
        });
      }
      if (ecr.approvedAt) {
        timeline.push({
          type: 'ECR_APPROVED',
          date: ecr.approvedAt,
          title: `ECR ${ecr.ecrNumber} Approved`,
          description: 'Approved for implementation',
          user: ecr.approver,
          status: 'APPROVED',
          recordId: ecr.id,
          recordType: 'ECR',
          recordNumber: ecr.ecrNumber,
        });
      }
      if (ecr.rejectedAt) {
        timeline.push({
          type: 'ECR_REJECTED',
          date: ecr.rejectedAt,
          title: `ECR ${ecr.ecrNumber} Rejected`,
          description: 'Rejected by reviewer',
          user: ecr.approver,
          status: 'REJECTED',
          recordId: ecr.id,
          recordType: 'ECR',
          recordNumber: ecr.ecrNumber,
        });
      }
    });

    // ECO events
    if (traceabilityData.eco) {
      const eco = traceabilityData.eco;
      if (eco.createdAt) {
        timeline.push({
          type: 'ECO_CREATED',
          date: eco.createdAt,
          title: `ECO ${eco.ecoNumber} Created`,
          description: eco.title,
          user: eco.submitter,
          status: 'BACKLOG',
          recordId: eco.id,
          recordType: 'ECO',
          recordNumber: eco.ecoNumber,
        });
      }
      if (eco.submittedAt) {
        timeline.push({
          type: 'ECO_SUBMITTED',
          date: eco.submittedAt,
          title: `ECO ${eco.ecoNumber} Submitted`,
          description: 'Submitted for approval',
          user: eco.submitter,
          status: 'SUBMITTED',
          recordId: eco.id,
          recordType: 'ECO',
          recordNumber: eco.ecoNumber,
        });
      }
      if (eco.approvedAt) {
        timeline.push({
          type: 'ECO_APPROVED',
          date: eco.approvedAt,
          title: `ECO ${eco.ecoNumber} Approved`,
          description: 'Approved for implementation',
          user: eco.approver,
          status: 'APPROVED',
          recordId: eco.id,
          recordType: 'ECO',
          recordNumber: eco.ecoNumber,
        });
      }
      if (eco.completedAt) {
        timeline.push({
          type: 'ECO_COMPLETED',
          date: eco.completedAt,
          title: `ECO ${eco.ecoNumber} Completed`,
          description: 'Implementation completed',
          user: eco.assignee || eco.submitter,
          status: 'COMPLETED',
          recordId: eco.id,
          recordType: 'ECO',
          recordNumber: eco.ecoNumber,
        });
      }
    }

    // ECN events
    if (traceabilityData.ecn) {
      const ecn = traceabilityData.ecn;
      if (ecn.createdAt) {
        timeline.push({
          type: 'ECN_CREATED',
          date: ecn.createdAt,
          title: `ECN ${ecn.ecnNumber} Created`,
          description: ecn.title,
          user: ecn.submitter,
          status: 'DRAFT',
          recordId: ecn.id,
          recordType: 'ECN',
          recordNumber: ecn.ecnNumber,
        });
      }
      if (ecn.distributedAt) {
        timeline.push({
          type: 'ECN_DISTRIBUTED',
          date: ecn.distributedAt,
          title: `ECN ${ecn.ecnNumber} Distributed`,
          description: 'Change notice distributed',
          user: ecn.assignee || ecn.submitter,
          status: 'DISTRIBUTED',
          recordId: ecn.id,
          recordType: 'ECN',
          recordNumber: ecn.ecnNumber,
        });
      }
      if (ecn.effectiveDate) {
        timeline.push({
          type: 'ECN_EFFECTIVE',
          date: ecn.effectiveDate,
          title: `ECN ${ecn.ecnNumber} Effective`,
          description: 'Change notice became effective',
          user: ecn.assignee || ecn.submitter,
          status: 'EFFECTIVE',
          recordId: ecn.id,
          recordType: 'ECN',
          recordNumber: ecn.ecnNumber,
        });
      }
    }

    // Sort timeline by date
    timeline.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return NextResponse.json({
      ...traceabilityData,
      timeline,
    });
  } catch (error) {
    console.error('Error fetching traceability data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}