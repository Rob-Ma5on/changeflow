import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;

    // Get current month start/end for filtering
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // Fetch ECR stats
    const totalEcrs = await prisma.eCR.count({
      where: { organizationId }
    });

    const openEcrs = await prisma.eCR.count({
      where: {
        organizationId,
        status: {
          in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW']
        }
      }
    });

    // Fetch ECO stats
    const ecosInProgress = await prisma.eCO.count({
      where: {
        organizationId,
        status: 'IN_PROGRESS'
      }
    });

    // Fetch ECN stats
    const pendingEcns = await prisma.eCN.count({
      where: {
        organizationId,
        status: {
          in: ['DRAFT', 'PENDING_APPROVAL']
        }
      }
    });

    // Calculate completed changes this month
    const completedThisMonth = await prisma.$transaction(async (tx) => {
      const [completedEcrs, completedEcos, completedEcns] = await Promise.all([
        tx.eCR.count({
          where: {
            organizationId,
            status: 'CONVERTED',
            updatedAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        }),
        tx.eCO.count({
          where: {
            organizationId,
            status: 'COMPLETED',
            completedAt: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        }),
        tx.eCN.count({
          where: {
            organizationId,
            status: 'EFFECTIVE',
            effectiveDate: {
              gte: monthStart,
              lte: monthEnd
            }
          }
        })
      ]);

      return completedEcrs + completedEcos + completedEcns;
    });

    // Get priority breakdown
    const priorityBreakdown = await prisma.$transaction(async (tx) => {
      const [critical, high, medium, low] = await Promise.all([
        tx.eCR.count({ where: { organizationId, priority: 'CRITICAL' } }),
        tx.eCR.count({ where: { organizationId, priority: 'HIGH' } }),
        tx.eCR.count({ where: { organizationId, priority: 'MEDIUM' } }),
        tx.eCR.count({ where: { organizationId, priority: 'LOW' } })
      ]);
      return { critical, high, medium, low };
    });

    // Get customer impact summary
    const customerImpactSummary = await prisma.$transaction(async (tx) => {
      const [directImpact, indirectImpact, noImpact] = await Promise.all([
        tx.eCR.count({ where: { organizationId, customerImpact: 'DIRECT_IMPACT' } }),
        tx.eCR.count({ where: { organizationId, customerImpact: 'INDIRECT_IMPACT' } }),
        tx.eCR.count({ where: { organizationId, customerImpact: 'NO_IMPACT' } })
      ]);
      return { directImpact, indirectImpact, noImpact };
    });

    // Get implementation status
    const implementationStatus = await prisma.$transaction(async (tx) => {
      const [notStarted, inProgress, complete, verified] = await Promise.all([
        tx.eCN.count({ where: { organizationId, implementationStatus: 'NOT_STARTED' } }),
        tx.eCN.count({ where: { organizationId, implementationStatus: 'IN_PROGRESS' } }),
        tx.eCN.count({ where: { organizationId, implementationStatus: 'COMPLETE' } }),
        tx.eCN.count({ where: { organizationId, implementationStatus: 'VERIFIED' } })
      ]);
      return { notStarted, inProgress, complete, verified };
    });

    // Get this week's targets
    const weekStart = new Date(now.getTime() - now.getDay() * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
    
    const thisWeekTargets = await prisma.$transaction(async (tx) => {
      const [ecrTargets, ecoTargets] = await Promise.all([
        tx.eCR.findMany({
          where: {
            organizationId,
            targetImplementationDate: {
              gte: weekStart,
              lte: weekEnd
            }
          },
          select: {
            id: true,
            ecrNumber: true,
            title: true,
            targetImplementationDate: true,
            priority: true,
            assignee: { select: { name: true } }
          }
        }),
        tx.eCO.findMany({
          where: {
            organizationId,
            targetDate: {
              gte: weekStart,
              lte: weekEnd
            }
          },
          select: {
            id: true,
            ecoNumber: true,
            title: true,
            targetDate: true,
            priority: true,
            assignee: { select: { name: true } }
          }
        })
      ]);

      return [
        ...ecrTargets.map(ecr => ({
          id: ecr.id,
          type: 'ECR' as const,
          number: ecr.ecrNumber,
          title: ecr.title,
          targetDate: ecr.targetImplementationDate?.toISOString() || '',
          priority: ecr.priority || 'MEDIUM',
          assignee: ecr.assignee?.name
        })),
        ...ecoTargets.map(eco => ({
          id: eco.id,
          type: 'ECO' as const,
          number: eco.ecoNumber,
          title: eco.title,
          targetDate: eco.targetDate?.toISOString() || '',
          priority: eco.priority || 'MEDIUM',
          assignee: eco.assignee?.name
        }))
      ];
    });

    // Get user-specific stats
    const userId = session.user.id;
    const myItems = await prisma.$transaction(async (tx) => {
      const [assigned, submitted, needsApproval] = await Promise.all([
        tx.eCR.count({ where: { organizationId, assigneeId: userId } }),
        tx.eCR.count({ where: { organizationId, submitterId: userId } }),
        tx.eCR.count({ where: { organizationId, status: 'UNDER_REVIEW' } })
      ]);
      return { assigned, submitted, needsApproval };
    });

    // Additional quick filter stats
    const highPriorityItems = priorityBreakdown.critical + priorityBreakdown.high;
    const customerImpactItems = customerImpactSummary.directImpact;
    const dueThisWeek = thisWeekTargets.length;

    // Fetch recent activity
    const recentActivity = await prisma.$transaction(async (tx) => {
      const [recentEcrs, recentEcos, recentEcns] = await Promise.all([
        tx.eCR.findMany({
          where: { organizationId },
          orderBy: { updatedAt: 'desc' },
          take: 3,
          include: {
            submitter: { select: { id: true, name: true, email: true } }
          }
        }),
        tx.eCO.findMany({
          where: { organizationId },
          orderBy: { updatedAt: 'desc' },
          take: 3,
          include: {
            assignee: { select: { id: true, name: true, email: true } }
          }
        }),
        tx.eCN.findMany({
          where: { organizationId },
          orderBy: { updatedAt: 'desc' },
          take: 3,
          include: {
            eco: {
              include: {
                assignee: true
              }
            }
          }
        })
      ]);

      // Combine and format activities
      const activities = [
        ...recentEcrs.map(ecr => ({
          id: ecr.id,
          type: 'ECR' as const,
          number: ecr.ecrNumber,
          title: ecr.title,
          status: ecr.status,
          priority: ecr.priority,
          customerImpact: ecr.customerImpact,
          date: ecr.updatedAt.toISOString(),
          user: ecr.submitter.name
        })),
        ...recentEcos.map(eco => ({
          id: eco.id,
          type: 'ECO' as const,
          number: eco.ecoNumber,
          title: eco.title,
          status: eco.status,
          priority: eco.priority,
          date: eco.updatedAt.toISOString(),
          user: eco.assignee?.name || 'Unassigned'
        })),
        ...recentEcns.map(ecn => ({
          id: ecn.id,
          type: 'ECN' as const,
          number: ecn.ecnNumber,
          title: ecn.title,
          status: ecn.status,
          date: ecn.updatedAt.toISOString(),
          user: ecn.eco?.assignee?.name || 'Unassigned'
        }))
      ];

      // Sort by date and take the 5 most recent
      return activities
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);
    });

    const dashboardStats = {
      totalEcrs,
      openEcrs,
      ecosInProgress,
      pendingEcns,
      completedThisMonth,
      priorityBreakdown,
      customerImpactSummary,
      implementationStatus,
      thisWeekTargets,
      recentActivity,
      myItems,
      highPriorityItems,
      customerImpactItems,
      dueThisWeek
    };

    return NextResponse.json(dashboardStats);

  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}