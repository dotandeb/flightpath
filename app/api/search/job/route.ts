/**
 * JOB STATUS API
 * For polling async deep search results
 */

import { NextRequest, NextResponse } from 'next/server';
import { getJob, getJobStatusResponse } from '@/lib/job-queue';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const jobId = searchParams.get('id');
  
  if (!jobId) {
    return NextResponse.json(
      { error: 'Missing job ID' },
      { status: 400 }
    );
  }
  
  const job = getJob(jobId);
  
  if (!job) {
    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(getJobStatusResponse(job));
}
