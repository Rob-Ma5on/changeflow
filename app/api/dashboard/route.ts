import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const organizationId = session.user.organizationId;
    const userId = session.user.id;
    const userRole = session.user.role as UserRole;

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

    // Get role-specific action items
    const actionItems = await getRoleSpecificActionItems(organizationId, userId, userRole);
    
    // Get role-specific metrics
    const roleMetrics = await getRoleSpecificMetrics(organizationId, userId, userRole, monthStart, monthEnd);
    
    // Get user-specific stats
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
      dueThisWeek,
      actionItems,
      roleMetrics,
      userRole
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

// Helper function to get role-specific action items
async function getRoleSpecificActionItems(organizationId: string, userId: string, userRole: UserRole) {
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  switch (userRole) {
    case 'REQUESTOR':
      return await prisma.$transaction(async (tx) => {
        const [myECRs, needsMoreInfo] = await Promise.all([
          tx.eCR.findMany({
            where: { 
              organizationId, 
              submitterId: userId,
              status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] }
            },
            select: {
              id: true, ecrNumber: true, title: true, status: true, priority: true,
              createdAt: true, targetImplementationDate: true, assignee: { select: { name: true } }
            },
            orderBy: { updatedAt: 'desc' },
            take: 10
          }),
          tx.eCR.findMany({
            where: { 
              organizationId, 
              submitterId: userId,
              status: 'MORE_INFO_REQUIRED'
            },
            select: {
              id: true, ecrNumber: true, title: true, status: true, priority: true,
              createdAt: true, assignee: { select: { name: true } }
            },
            orderBy: { updatedAt: 'desc' },
            take: 5
          })
        ]);
        
        return [
          ...myECRs.map(ecr => ({
            id: ecr.id,
            type: 'ECR' as const,
            number: ecr.ecrNumber,
            title: ecr.title,
            status: ecr.status,
            priority: ecr.priority,
            age: Math.floor((now.getTime() - ecr.createdAt.getTime()) / (1000 * 60 * 60)),
            dueDate: ecr.targetImplementationDate?.toISOString(),
            assignee: ecr.assignee?.name,
            actionUrl: `/dashboard/ecr/${ecr.id}`,
            actionLabel: ecr.status === 'DRAFT' ? 'Complete' : 'View Status'
          })),
          ...needsMoreInfo.map(ecr => ({
            id: ecr.id,
            type: 'ECR' as const,
            number: ecr.ecrNumber,
            title: ecr.title,
            status: ecr.status,
            priority: ecr.priority || 'MEDIUM',
            age: Math.floor((now.getTime() - ecr.createdAt.getTime()) / (1000 * 60 * 60)),
            assignee: ecr.assignee?.name,
            actionUrl: `/dashboard/ecr/${ecr.id}/edit`,
            actionLabel: 'Provide Info'
          }))
        ];
      });

    case 'ENGINEER':
      return await prisma.$transaction(async (tx) => {
        const [reviewECRs, analysisECRs, activeECOs, overdueTasks] = await Promise.all([
          tx.eCR.findMany({
            where: { 
              organizationId, 
              assigneeId: userId,
              status: { in: ['SUBMITTED', 'UNDER_REVIEW'] }
            },
            select: {
              id: true, ecrNumber: true, title: true, status: true, priority: true,
              createdAt: true, targetImplementationDate: true
            },
            orderBy: { createdAt: 'asc' },
            take: 10
          }),
          tx.eCR.findMany({
            where: { 
              organizationId, 
              status: 'ANALYSIS',
              OR: [
                { assigneeId: userId },
                { implementationTeam: { has: userId } }
              ]
            },
            select: {
              id: true, ecrNumber: true, title: true, status: true, priority: true,
              createdAt: true
            },
            take: 5
          }),
          tx.eCO.findMany({
            where: { 
              organizationId, 
              OR: [
                { assigneeId: userId },
                { implementationTeam: { has: userId } }
              ],
              status: { in: ['PLANNING', 'IN_PROGRESS'] }
            },
            select: {
              id: true, ecoNumber: true, title: true, status: true, priority: true,
              createdAt: true, targetDate: true
            },
            take: 5
          }),
          tx.task.findMany({
            where: {
              assignedTo: userId,
              status: { in: ['NOT_STARTED', 'IN_PROGRESS'] },
              endDate: { lt: now }
            },
            select: {
              id: true, description: true, endDate: true, status: true,
              eco: { select: { ecoNumber: true, title: true } }
            },
            take: 5
          })
        ]);
        
        return [
          ...reviewECRs.map(ecr => ({
            id: ecr.id,
            type: 'ECR' as const,
            number: ecr.ecrNumber,
            title: ecr.title,
            status: ecr.status,
            priority: ecr.priority,
            age: Math.floor((now.getTime() - ecr.createdAt.getTime()) / (1000 * 60 * 60)),
            dueDate: ecr.targetImplementationDate?.toISOString(),
            actionUrl: `/dashboard/ecr/${ecr.id}/review`,
            actionLabel: 'Review'
          })),
          ...analysisECRs.map(ecr => ({
            id: ecr.id,
            type: 'ECR' as const,
            number: ecr.ecrNumber,
            title: ecr.title,
            status: ecr.status,
            priority: ecr.priority,
            age: Math.floor((now.getTime() - ecr.createdAt.getTime()) / (1000 * 60 * 60)),
            actionUrl: `/dashboard/ecr/${ecr.id}/analysis`,
            actionLabel: 'Analyze'
          })),
          ...activeECOs.map(eco => ({
            id: eco.id,
            type: 'ECO' as const,
            number: eco.ecoNumber,
            title: eco.title,
            status: eco.status,
            priority: eco.priority || 'MEDIUM',
            age: Math.floor((now.getTime() - eco.createdAt.getTime()) / (1000 * 60 * 60)),
            dueDate: eco.targetDate?.toISOString(),
            actionUrl: `/dashboard/eco/${eco.id}`,
            actionLabel: eco.status === 'PLANNING' ? 'Plan' : 'Execute'
          })),
          ...overdueTasks.map(task => ({
            id: task.id,
            type: 'ECO' as const,
            number: task.eco?.ecoNumber || 'Task',
            title: task.description,
            status: task.status,
            priority: 'HIGH' as const,
            age: Math.floor((now.getTime() - task.endDate.getTime()) / (1000 * 60 * 60)),
            dueDate: task.endDate.toISOString(),
            actionUrl: `/dashboard/eco/${task.id}/execute`,
            actionLabel: 'Complete'
          }))
        ];
      });

    case 'QUALITY':
      return await prisma.$transaction(async (tx) => {
        const [verificationECOs, qualityGates, nonConformances] = await Promise.all([
          tx.eCO.findMany({
            where: { 
              organizationId, 
              status: 'VERIFICATION'
            },
            select: {
              id: true, ecoNumber: true, title: true, status: true, priority: true,
              createdAt: true, targetDate: true
            },
            take: 10
          }),
          tx.qualityGate.findMany({
            where: {
              eco: { organizationId },
              completed: false,
              targetDate: { lte: tomorrow }
            },
            select: {
              id: true, milestone: true, targetDate: true, completed: true,
              eco: { select: { ecoNumber: true, title: true } }
            },
            take: 5
          }),
          tx.issue.findMany({
            where: {
              eco: { organizationId },
              status: 'OPEN',
              impact: { in: ['HIGH', 'CRITICAL'] }
            },
            select: {
              id: true, title: true, impact: true, reportedDate: true,
              eco: { select: { ecoNumber: true, title: true } }
            },
            take: 5
          })
        ]);
        
        return [
          ...verificationECOs.map(eco => ({
            id: eco.id,
            type: 'ECO' as const,
            number: eco.ecoNumber,
            title: eco.title,
            status: eco.status,
            priority: eco.priority || 'MEDIUM',
            age: Math.floor((now.getTime() - eco.createdAt.getTime()) / (1000 * 60 * 60)),
            dueDate: eco.targetDate?.toISOString(),
            actionUrl: `/dashboard/eco/${eco.id}/verify`,
            actionLabel: 'Verify'
          })),
          ...qualityGates.map(gate => ({
            id: gate.id,
            type: 'ECO' as const,
            number: gate.eco?.ecoNumber || 'QG',
            title: gate.milestone,
            status: 'QUALITY_GATE',
            priority: 'HIGH' as const,
            age: Math.floor((now.getTime() - gate.targetDate.getTime()) / (1000 * 60 * 60)),
            dueDate: gate.targetDate.toISOString(),
            actionUrl: `/dashboard/eco/${gate.id}/execute`,
            actionLabel: 'Review Gate'
          })),
          ...nonConformances.map(issue => ({
            id: issue.id,
            type: 'ECO' as const,
            number: issue.eco?.ecoNumber || 'Issue',
            title: issue.title,
            status: 'NON_CONFORMANCE',
            priority: issue.impact as any,
            age: Math.floor((now.getTime() - issue.reportedDate.getTime()) / (1000 * 60 * 60)),
            actionUrl: `/dashboard/eco/${issue.id}/execute`,
            actionLabel: 'Resolve'
          }))
        ];
      });

    case 'MANUFACTURING':
      return await prisma.$transaction(async (tx) => {
        const [readyECOs, todayChanges, impactAssessments] = await Promise.all([
          tx.eCO.findMany({
            where: { 
              organizationId, 
              status: 'READY_FOR_IMPLEMENTATION'
            },
            select: {
              id: true, ecoNumber: true, title: true, status: true, priority: true,
              createdAt: true, implementationDate: true
            },
            take: 10
          }),
          tx.eCO.findMany({
            where: { 
              organizationId, 
              implementationDate: {
                gte: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
                lt: new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
              }
            },
            select: {
              id: true, ecoNumber: true, title: true, status: true, priority: true,
              implementationDate: true
            },
            take: 5
          }),
          tx.eCR.findMany({
            where: { 
              organizationId, 
              status: 'ANALYSIS',
              manufacturingImpact: { not: null }
            },
            select: {
              id: true, ecrNumber: true, title: true, priority: true, createdAt: true
            },
            take: 5
          })
        ]);
        
        return [
          ...readyECOs.map(eco => ({
            id: eco.id,
            type: 'ECO' as const,
            number: eco.ecoNumber,
            title: eco.title,
            status: eco.status,
            priority: eco.priority || 'MEDIUM',
            age: Math.floor((now.getTime() - eco.createdAt.getTime()) / (1000 * 60 * 60)),
            dueDate: eco.implementationDate?.toISOString(),
            actionUrl: `/dashboard/eco/${eco.id}/execute`,
            actionLabel: 'Implement'
          })),
          ...todayChanges.map(eco => ({
            id: eco.id,
            type: 'ECO' as const,
            number: eco.ecoNumber,
            title: eco.title,
            status: eco.status,
            priority: 'HIGH' as const,
            age: 0,
            dueDate: eco.implementationDate?.toISOString(),
            actionUrl: `/dashboard/eco/${eco.id}/execute`,
            actionLabel: 'Execute Today'
          })),
          ...impactAssessments.map(ecr => ({
            id: ecr.id,
            type: 'ECR' as const,
            number: ecr.ecrNumber,
            title: ecr.title,
            status: 'NEEDS_ASSESSMENT',
            priority: ecr.priority || 'MEDIUM',
            age: Math.floor((now.getTime() - ecr.createdAt.getTime()) / (1000 * 60 * 60)),
            actionUrl: `/dashboard/ecr/${ecr.id}/analysis`,
            actionLabel: 'Assess Impact'
          }))
        ];
      });

    case 'MANAGER':
      return await prisma.$transaction(async (tx) => {
        const [pendingApprovals, budgetItems] = await Promise.all([
          tx.eCR.findMany({
            where: { 
              organizationId, 
              status: 'PENDING_APPROVAL'
            },
            select: {
              id: true, ecrNumber: true, title: true, status: true, priority: true,
              createdAt: true, estimatedCost: true
            },
            orderBy: { createdAt: 'asc' },
            take: 10
          }),
          tx.eCO.findMany({
            where: { 
              organizationId, 
              status: 'PENDING_BUDGET_APPROVAL'
            },
            select: {
              id: true, ecoNumber: true, title: true, status: true, priority: true,
              createdAt: true, estimatedCost: true
            },
            take: 5
          })
        ]);
        
        return [
          ...pendingApprovals.map(ecr => ({
            id: ecr.id,
            type: 'ECR' as const,
            number: ecr.ecrNumber,
            title: ecr.title,
            status: ecr.status,
            priority: ecr.priority,
            age: Math.floor((now.getTime() - ecr.createdAt.getTime()) / (1000 * 60 * 60)),
            actionUrl: `/dashboard/ecr/${ecr.id}/approve`,
            actionLabel: 'Approve'
          })),
          ...budgetItems.map(eco => ({
            id: eco.id,
            type: 'ECO' as const,
            number: eco.ecoNumber,
            title: eco.title,
            status: eco.status,
            priority: eco.priority || 'MEDIUM',
            age: Math.floor((now.getTime() - eco.createdAt.getTime()) / (1000 * 60 * 60)),
            actionUrl: `/dashboard/eco/${eco.id}/approve`,
            actionLabel: 'Budget Approval'
          }))
        ];
      });

    case 'DOCUMENT_CONTROL':
      return await prisma.$transaction(async (tx) => {
        const [readyECNs, pendingAcks, overdueResponses] = await Promise.all([
          tx.eCO.findMany({
            where: { 
              organizationId, 
              status: 'VERIFIED'
            },
            select: {
              id: true, ecoNumber: true, title: true, status: true, priority: true,
              createdAt: true
            },
            take: 10
          }),
          tx.eCN.findMany({
            where: { 
              organizationId, 
              status: 'DISTRIBUTED'
            },
            select: {
              id: true, ecnNumber: true, title: true, status: true, createdAt: true,
              distributionDate: true
            },
            take: 10
          }),
          tx.eCNRecipient.findMany({
            where: {
              ecn: { organizationId },
              acknowledgedDate: null,
              responseDeadline: { lt: now }
            },
            select: {
              id: true, email: true, responseDeadline: true,
              ecn: { select: { ecnNumber: true, title: true } }
            },
            take: 5
          })
        ]);
        
        return [
          ...readyECNs.map(eco => ({
            id: eco.id,
            type: 'ECO' as const,
            number: eco.ecoNumber,
            title: eco.title,
            status: 'READY_FOR_ECN',
            priority: eco.priority || 'MEDIUM',
            age: Math.floor((now.getTime() - eco.createdAt.getTime()) / (1000 * 60 * 60)),
            actionUrl: `/ecn/create-from-eco?ecoId=${eco.id}`,
            actionLabel: 'Create ECN'
          })),
          ...pendingAcks.map(ecn => ({
            id: ecn.id,
            type: 'ECN' as const,
            number: ecn.ecnNumber,
            title: ecn.title,
            status: ecn.status,
            priority: 'MEDIUM' as const,
            age: Math.floor((now.getTime() - (ecn.distributionDate || ecn.createdAt).getTime()) / (1000 * 60 * 60)),
            actionUrl: `/dashboard/ecn/${ecn.id}/tracking`,
            actionLabel: 'Track'
          })),
          ...overdueResponses.map(recipient => ({
            id: recipient.id,
            type: 'ECN' as const,
            number: recipient.ecn?.ecnNumber || 'ECN',
            title: `${recipient.email} - ${recipient.ecn?.title}`,
            status: 'OVERDUE_RESPONSE',
            priority: 'HIGH' as const,
            age: Math.floor((now.getTime() - recipient.responseDeadline.getTime()) / (1000 * 60 * 60)),
            dueDate: recipient.responseDeadline.toISOString(),
            actionUrl: `/dashboard/ecn/${recipient.id}/tracking`,
            actionLabel: 'Follow Up'
          }))
        ];
      });

    default:
      return [];
  }
}

// Helper function to get role-specific metrics
async function getRoleSpecificMetrics(organizationId: string, userId: string, userRole: UserRole, monthStart: Date, monthEnd: Date) {
  const now = new Date();
  const lastMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
  const lastMonthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth(), 0);

  switch (userRole) {
    case 'REQUESTOR':
      return await prisma.$transaction(async (tx) => {
        const [currentMonth, lastMonth] = await Promise.all([
          tx.eCR.aggregate({
            where: { organizationId, submitterId: userId, createdAt: { gte: monthStart, lte: monthEnd } },
            _count: { id: true }
          }),
          tx.eCR.aggregate({
            where: { organizationId, submitterId: userId, createdAt: { gte: lastMonthStart, lte: lastMonthEnd } },
            _count: { id: true }
          })
        ]);
        
        const approvedCount = await tx.eCR.count({
          where: { organizationId, submitterId: userId, status: { in: ['APPROVED', 'CONVERTED'] } }
        });
        const totalSubmitted = await tx.eCR.count({
          where: { organizationId, submitterId: userId }
        });
        
        return {
          ecrsCreated: { 
            value: currentMonth._count.id, 
            trend: currentMonth._count.id > lastMonth._count.id ? 'up' : 'down',
            trendValue: lastMonth._count.id > 0 ? Math.round(((currentMonth._count.id - lastMonth._count.id) / lastMonth._count.id) * 100) : 0
          },
          approvalRate: { 
            value: totalSubmitted > 0 ? Math.round((approvedCount / totalSubmitted) * 100) : 0 
          },
          implementedChanges: { value: approvedCount },
          costSavings: { value: 0 } // Would need to calculate from implemented ECRs
        };
      });

    case 'ENGINEER':
      return await prisma.$transaction(async (tx) => {
        const processedCount = await tx.eCR.count({
          where: { 
            organizationId, 
            assigneeId: userId,
            status: { in: ['APPROVED', 'REJECTED', 'CONVERTED'] },
            updatedAt: { gte: monthStart, lte: monthEnd }
          }
        });
        
        const completedECOs = await tx.eCO.count({
          where: { 
            organizationId, 
            assigneeId: userId,
            status: 'COMPLETED',
            completedAt: { gte: monthStart, lte: monthEnd }
          }
        });
        
        const totalECOs = await tx.eCO.count({
          where: { organizationId, assigneeId: userId }
        });
        
        const overdueTasks = await tx.task.count({
          where: { assignedTo: userId, status: { in: ['NOT_STARTED', 'IN_PROGRESS'] }, endDate: { lt: now } }
        });
        
        return {
          ecrsProcessed: { value: processedCount },
          ecoCompletionRate: { 
            value: totalECOs > 0 ? Math.round((completedECOs / totalECOs) * 100) : 100 
          },
          overdueTasks: { value: overdueTasks },
          avgProcessingTime: { value: 4.2 }, // Would calculate from actual data
          technicalComplexity: { value: 3.1 }
        };
      });

    case 'QUALITY':
      return await prisma.$transaction(async (tx) => {
        const verificationsCompleted = await tx.eCO.count({
          where: { 
            organizationId,
            status: 'VERIFIED',
            completedAt: { gte: monthStart, lte: monthEnd }
          }
        });
        
        const qualityGatesSet = await tx.qualityGate.count({
          where: {
            eco: { organizationId },
            createdAt: { gte: monthStart, lte: monthEnd }
          }
        });
        
        return {
          verificationsCompleted: { value: verificationsCompleted },
          firstPassRate: { value: 94 }, // Would calculate from actual verification results
          avgTurnaroundTime: { value: 1.8 },
          nonConformances: { value: 2 },
          qualityGatesSets: { value: qualityGatesSet }
        };
      });

    case 'MANUFACTURING':
      const implementationsCompleted = await prisma.eCO.count({
        where: { 
          organizationId,
          status: 'IMPLEMENTED',
          implementationDate: { gte: monthStart, lte: monthEnd }
        }
      });
      
      return {
        implementationsCompleted: { value: implementationsCompleted },
        successRate: { value: 97 },
        avgImplementationTime: { value: 5.2 },
        productionImpact: { value: 24 }, // hours
        costsAvoided: { value: 15000 }
      };

    case 'MANAGER':
      return await prisma.$transaction(async (tx) => {
        const approvalsCompleted = await tx.eCR.count({
          where: { 
            organizationId,
            status: { in: ['APPROVED', 'REJECTED'] },
            updatedAt: { gte: monthStart, lte: monthEnd }
          }
        });
        
        const budgetUsed = await tx.eCO.aggregate({
          where: { 
            organizationId,
            status: { in: ['IN_PROGRESS', 'COMPLETED'] }
          },
          _sum: { actualCost: true }
        });
        
        const budgetAllocated = await tx.organization.findUnique({
          where: { id: organizationId },
          select: { monthlyBudget: true }
        });
        
        return {
          approvalsCompleted: { value: approvalsCompleted },
          avgApprovalTime: { value: 1.3 },
          budgetUtilization: { 
            value: budgetAllocated?.monthlyBudget 
              ? Math.round(((budgetUsed._sum.actualCost || 0) / budgetAllocated.monthlyBudget) * 100) 
              : 0 
          },
          teamWorkload: { value: 78 },
          priorityDistribution: { value: 12 }
        };
      });

    case 'DOCUMENT_CONTROL':
      return await prisma.$transaction(async (tx) => {
        const ecnsDistributed = await tx.eCN.count({
          where: { 
            organizationId,
            status: { in: ['DISTRIBUTED', 'ACKNOWLEDGED'] },
            distributionDate: { gte: monthStart, lte: monthEnd }
          }
        });
        
        const totalRecipients = await tx.eCNRecipient.count({
          where: {
            ecn: { organizationId },
            ecn: { distributionDate: { gte: monthStart, lte: monthEnd } }
          }
        });
        
        const acknowledgedRecipients = await tx.eCNRecipient.count({
          where: {
            ecn: { organizationId },
            ecn: { distributionDate: { gte: monthStart, lte: monthEnd } },
            acknowledgedDate: { not: null }
          }
        });
        
        const overdueResponses = await tx.eCNRecipient.count({
          where: {
            ecn: { organizationId },
            acknowledgedDate: null,
            responseDeadline: { lt: now }
          }
        });
        
        return {
          ecnsDistributed: { value: ecnsDistributed },
          acknowledgmentRate: { 
            value: totalRecipients > 0 ? Math.round((acknowledgedRecipients / totalRecipients) * 100) : 100 
          },
          avgDistributionTime: { value: 4.2 },
          overdueResponses: { value: overdueResponses },
          documentsUpdated: { value: 28 }
        };
      });

    default:
      return {};
  }
}