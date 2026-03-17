/**
 * ASYNC JOB QUEUE FOR DEEP SEARCH
 * Prevents 504 timeouts by using background processing
 */

export interface SearchJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  type: 'quick' | 'deep' | 'split';
  params: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    travelClass?: string;
  };
  results?: any;
  error?: string;
  progress: number;
  createdAt: number;
  updatedAt: number;
}

// In-memory job store (use Redis in production)
const jobs = new Map<string, SearchJob>();

export function createJob(type: 'quick' | 'deep' | 'split', params: SearchJob['params']): SearchJob {
  const job: SearchJob = {
    id: `job-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    type,
    params,
    progress: 0,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): SearchJob | undefined {
  return jobs.get(id);
}

export function updateJob(id: string, updates: Partial<SearchJob>): SearchJob | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  
  Object.assign(job, updates, { updatedAt: Date.now() });
  jobs.set(id, job);
  return job;
}

export function deleteJob(id: string): boolean {
  return jobs.delete(id);
}

// Clean old jobs (older than 1 hour)
export function cleanupOldJobs(): void {
  const oneHourAgo = Date.now() - 3600000;
  for (const [id, job] of jobs) {
    if (job.createdAt < oneHourAgo) {
      jobs.delete(id);
    }
  }
}

/**
 * Process job with progress updates
 */
export async function processJob(
  jobId: string,
  processor: (job: SearchJob, updateProgress: (p: number) => void) => Promise<any>
): Promise<void> {
  const job = getJob(jobId);
  if (!job) return;
  
  updateJob(jobId, { status: 'processing' });
  
  try {
    const results = await processor(job, (progress) => {
      updateJob(jobId, { progress });
    });
    
    updateJob(jobId, { 
      status: 'completed', 
      progress: 100,
      results 
    });
  } catch (error: any) {
    updateJob(jobId, { 
      status: 'failed', 
      error: error.message 
    });
  }
}

/**
 * Get job status response for API
 */
export function getJobStatusResponse(job: SearchJob) {
  return {
    jobId: job.id,
    status: job.status,
    progress: job.progress,
    type: job.type,
    createdAt: job.createdAt,
    ...(job.status === 'completed' && { results: job.results }),
    ...(job.status === 'failed' && { error: job.error })
  };
}
