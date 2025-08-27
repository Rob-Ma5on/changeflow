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
          date: ecr.updatedAt.toISOString(),
          user: ecr.submitter.name
        })),
        ...recentEcos.map(eco => ({
          id: eco.id,
          type: 'ECO' as const,
          number: eco.ecoNumber,
          title: eco.title,
          status: eco.status,
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
          user: ecn.eco.assignee?.name || 'Unassigned'
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
      recentActivity
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