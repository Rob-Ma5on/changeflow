import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  // This endpoint has been deprecated in favor of the form-based workflow
  // ECNs should now be created via /api/ecn with ECO linking
  return NextResponse.json(
    { 
      error: 'This endpoint is deprecated. Please use the ECN creation form to generate ECNs from ECOs.',
      redirectTo: '/dashboard/ecn/new'
    },
    { status: 410 } // Gone
  );
}