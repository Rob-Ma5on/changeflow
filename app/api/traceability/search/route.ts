import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

interface TraceabilityChain {
  id: string;
  number: string;
  type: 'ECR' | 'ECO' | 'ECN';
  title: string;
  status: string;
  createdAt: string;
  submitter: { name: string };
  linkedECRs?: Array<{
    id: string;
    ecrNumber: string;
    title: string;
    status: string;
    submitter: { name: string };
  }>;
  parentECO?: {
    id: string;
    ecoNumber: string;
    title: string;
    status: string;
  };
  childECO?: {
    id: string;
    ecoNumber: string;
    title: string;
    status: string;
  };
  childECNs?: Array<{
    id: string;
    ecnNumber: string;
    title: string;
    status: string;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const organizationId = session.user.organizationId;
    const chains: TraceabilityChain[] = [];

    // Search ECRs
    const ecrs = await prisma.eCR.findMany({
      where: {
        organizationId,
        OR: [
          { ecrNumber: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        submitter: { select: { name: true } },
        eco: {
          select: {
            id: true,
            ecoNumber: true,
            title: true,
            status: true,
            ecns: {
              select: {
                id: true,
                ecnNumber: true,
                title: true,
                status: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add ECR chains
    for (const ecr of ecrs) {
      chains.push({
        id: ecr.id,
        number: ecr.ecrNumber,
        type: 'ECR',
        title: ecr.title,
        status: ecr.status,
        createdAt: ecr.createdAt.toISOString(),
        submitter: ecr.submitter,
        childECO: ecr.eco ? {
          id: ecr.eco.id,
          ecoNumber: ecr.eco.ecoNumber,
          title: ecr.eco.title,
          status: ecr.eco.status
        } : undefined,
        childECNs: ecr.eco?.ecns || []
      });
    }

    // Search ECOs
    const ecos = await prisma.eCO.findMany({
      where: {
        organizationId,
        OR: [
          { ecoNumber: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        submitter: { select: { name: true } },
        ecrs: {
          select: {
            id: true,
            ecrNumber: true,
            title: true,
            status: true,
            submitter: { select: { name: true } }
          }
        },
        ecns: {
          select: {
            id: true,
            ecnNumber: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add ECO chains
    for (const eco of ecos) {
      chains.push({
        id: eco.id,
        number: eco.ecoNumber,
        type: 'ECO',
        title: eco.title,
        status: eco.status,
        createdAt: eco.createdAt.toISOString(),
        submitter: eco.submitter,
        linkedECRs: eco.ecrs,
        childECNs: eco.ecns
      });
    }

    // Search ECNs
    const ecns = await prisma.eCN.findMany({
      where: {
        organizationId,
        OR: [
          { ecnNumber: { contains: query, mode: 'insensitive' } },
          { title: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } }
        ]
      },
      include: {
        submitter: { select: { name: true } },
        eco: {
          select: {
            id: true,
            ecoNumber: true,
            title: true,
            status: true,
            ecrs: {
              select: {
                id: true,
                ecrNumber: true,
                title: true,
                status: true,
                submitter: { select: { name: true } }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add ECN chains
    for (const ecn of ecns) {
      chains.push({
        id: ecn.id,
        number: ecn.ecnNumber,
        type: 'ECN',
        title: ecn.title,
        status: ecn.status,
        createdAt: ecn.createdAt.toISOString(),
        submitter: ecn.submitter,
        parentECO: ecn.eco ? {
          id: ecn.eco.id,
          ecoNumber: ecn.eco.ecoNumber,
          title: ecn.eco.title,
          status: ecn.eco.status
        } : undefined,
        linkedECRs: ecn.eco?.ecrs || []
      });
    }

    // Remove duplicates and sort by creation date
    const uniqueChains = chains.filter((chain, index, self) => 
      index === self.findIndex(c => c.id === chain.id && c.type === chain.type)
    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({
      query,
      totalResults: uniqueChains.length,
      chains: uniqueChains
    });

  } catch (error) {
    console.error('Error searching traceability:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}