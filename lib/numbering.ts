import { prisma } from '@/lib/prisma';

export async function generateNumber(
  prefix: 'ECR' | 'ECO' | 'ECN',
  organizationId: string
): Promise<string> {
  const year = new Date().getFullYear().toString().slice(-2);
  const searchPattern = `${prefix}-${year}-`;

  // Find the latest number for this prefix, organization, and year
  let latestRecord: { number: string } | null = null;

  if (prefix === 'ECR') {
    const latest = await prisma.eCR.findFirst({
      where: {
        organizationId,
        ecrNumber: {
          startsWith: searchPattern
        }
      },
      orderBy: { ecrNumber: 'desc' },
      select: { ecrNumber: true }
    });
    if (latest) latestRecord = { number: latest.ecrNumber };
  } else if (prefix === 'ECO') {
    const latest = await prisma.eCO.findFirst({
      where: {
        organizationId,
        ecoNumber: {
          startsWith: searchPattern
        }
      },
      orderBy: { ecoNumber: 'desc' },
      select: { ecoNumber: true }
    });
    if (latest) latestRecord = { number: latest.ecoNumber };
  } else if (prefix === 'ECN') {
    const latest = await prisma.eCN.findFirst({
      where: {
        organizationId,
        ecnNumber: {
          startsWith: searchPattern
        }
      },
      orderBy: { ecnNumber: 'desc' },
      select: { ecnNumber: true }
    });
    if (latest) latestRecord = { number: latest.ecnNumber };
  }

  let nextSequence = 1;
  
  if (latestRecord) {
    const parts = latestRecord.number.split('-');
    if (parts.length === 3 && parts[0] === prefix && parts[1] === year) {
      const currentSequence = parseInt(parts[2], 10);
      if (!isNaN(currentSequence)) {
        nextSequence = currentSequence + 1;
      }
    }
  }

  return `${prefix}-${year}-${String(nextSequence).padStart(3, '0')}`;
}