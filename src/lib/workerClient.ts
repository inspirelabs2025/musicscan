/**
 * Worker Client - Utility for Fly.io workers to interact with render queue
 * 
 * This module provides functions to:
 * - Poll for new render jobs
 * - Update job status
 * - Push new render jobs
 */

const SUPABASE_URL = 'https://ssxbpyqnjfiyubsuonar.supabase.co';

interface RenderJob {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  priority: number;
  attempts: number;
  created_at: string;
}

interface JobUpdateResult {
  ok: boolean;
  error?: string;
}

interface JobCreateResult {
  ok: boolean;
  id?: string;
  error?: string;
}

/**
 * Fetch the next available render job
 * Uses atomic locking to prevent race conditions
 */
export async function fetchNextRenderJob(
  workerSecret: string,
  workerId?: string,
  jobTypes?: string[]
): Promise<RenderJob | null> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/worker-poll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WORKER-KEY': workerSecret,
    },
    body: JSON.stringify({
      worker_id: workerId,
      job_types: jobTypes,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to fetch job: ${error}`);
  }

  const data = await response.json();
  return data.job || null;
}

/**
 * Update render job status
 */
export async function updateRenderJob(
  workerSecret: string,
  jobId: string,
  status: 'done' | 'error' | 'pending' | 'running',
  result?: Record<string, unknown>,
  errorMessage?: string
): Promise<JobUpdateResult> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/worker-update`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WORKER-KEY': workerSecret,
    },
    body: JSON.stringify({
      id: jobId,
      status,
      result,
      error_message: errorMessage,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { ok: false, error };
  }

  return await response.json();
}

/**
 * Push a new render job to the queue
 */
export async function pushNewRenderJob(
  workerSecret: string,
  type: string,
  payload: Record<string, unknown>,
  priority: number = 0
): Promise<JobCreateResult> {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/create-render-job`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WORKER-KEY': workerSecret,
    },
    body: JSON.stringify({
      type,
      payload,
      priority,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    return { ok: false, error };
  }

  return await response.json();
}

/**
 * Generate worker example code for Fly.io
 */
export function generateWorkerExampleCode(apiUrl: string): string {
  return `/**
 * Fly.io Worker Example - MusicScan Render Queue
 * 
 * Copy this code to your Fly.io worker to process render jobs.
 * 
 * Environment variables required:
 * - WORKER_API_URL: ${apiUrl}
 * - WORKER_SECRET: Your worker secret key
 */

import fetch from "node-fetch";

const API_URL = process.env.WORKER_API_URL || "${apiUrl}";
const WORKER_SECRET = process.env.WORKER_SECRET;
const WORKER_ID = process.env.FLY_ALLOC_ID || "fly-worker-" + Date.now();

if (!WORKER_SECRET) {
  console.error("❌ WORKER_SECRET is required");
  process.exit(1);
}

async function pollForJob() {
  try {
    const res = await fetch(\`\${API_URL}/functions/v1/worker-poll\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WORKER-KEY": WORKER_SECRET
      },
      body: JSON.stringify({
        worker_id: WORKER_ID,
        job_types: null // or ["gif", "video"] to filter
      })
    });

    if (!res.ok) {
      console.error("❌ Poll failed:", await res.text());
      return null;
    }

    const data = await res.json();
    return data.job;
  } catch (error) {
    console.error("❌ Poll error:", error.message);
    return null;
  }
}

async function updateJob(jobId, status, result = null, errorMessage = null) {
  try {
    const res = await fetch(\`\${API_URL}/functions/v1/worker-update\`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WORKER-KEY": WORKER_SECRET
      },
      body: JSON.stringify({
        id: jobId,
        status,
        result,
        error_message: errorMessage
      })
    });

    if (!res.ok) {
      console.error("❌ Update failed:", await res.text());
      return false;
    }

    const data = await res.json();
    return data.ok;
  } catch (error) {
    console.error("❌ Update error:", error.message);
    return false;
  }
}

async function processJob(job) {
  console.log(\`🎬 Processing job \${job.id} (type: \${job.type})\`);
  console.log(\`📦 Payload:\`, JSON.stringify(job.payload, null, 2));

  try {
    // ============================================
    // YOUR RENDERING LOGIC HERE
    // ============================================
    // Example for GIF rendering:
    // const outputUrl = await renderGif(job.payload);
    
    // Simulate work for demo
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const outputUrl = "https://example.com/output.gif";
    // ============================================

    // Report success
    await updateJob(job.id, "done", { output_url: outputUrl });
    console.log(\`✅ Job \${job.id} completed\`);
    
  } catch (error) {
    console.error(\`❌ Job \${job.id} failed:\`, error.message);
    await updateJob(job.id, "error", null, error.message);
  }
}

async function mainLoop() {
  console.log(\`🚀 Worker \${WORKER_ID} starting...\`);
  console.log(\`🔗 API URL: \${API_URL}\`);

  while (true) {
    const job = await pollForJob();

    if (job) {
      await processJob(job);
    } else {
      // No job available, wait before polling again
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}

// Start the worker
mainLoop().catch(console.error);
`;
}
