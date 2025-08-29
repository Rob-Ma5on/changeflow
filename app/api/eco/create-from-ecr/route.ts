import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { generateNumber } from '@/lib/numbering';

export async function POST(request: NextRequest) {
  // This endpoint has been deprecated in favor of the form-based workflow
  // ECOs should now be created via /api/eco with ECR linking
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use the ECO creation form to convert ECRs to ECOs.',
      redirectTo: '/dashboard/eco/new'
    },
    { status: 410 } // Gone
  );
}