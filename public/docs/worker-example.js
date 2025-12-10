/**
 * MusicScan Fly.io Worker - GIF Render Queue Processor
 * 
 * This worker polls for render jobs and processes them using ffmpeg.
 * Deploy to Fly.io and set these environment variables:
 * - SUPABASE_URL: Your Supabase project URL
 * - WORKER_SECRET: The secret key for authentication
 */

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ssxbpyqnjfiyubsuonar.supabase.co';
const WORKER_SECRET = process.env.WORKER_SECRET;
const WORKER_ID = process.env.WORKER_ID || 'fly-worker';
const POLL_INTERVAL_MS = 5000; // 5 seconds between polls
const HEARTBEAT_INTERVAL_MS = 30000; // 30 seconds between heartbeats

if (!WORKER_SECRET) {
  console.error('❌ WORKER_SECRET environment variable is required');
  process.exit(1);
}

console.log(`🚀 MusicScan Worker starting...`);
console.log(`   Supabase URL: ${SUPABASE_URL}`);
console.log(`   Worker ID: ${WORKER_ID}`);

// Send heartbeat to let the system know worker is alive
async function sendHeartbeat() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/worker_heartbeat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WORKER-KEY': WORKER_SECRET
      },
      body: JSON.stringify({
        id: WORKER_ID,
        ts: new Date().toISOString(),
        status: 'active',
        polling_interval_ms: POLL_INTERVAL_MS
      })
    });
    
    if (response.ok) {
      console.log(`💓 Heartbeat sent`);
    } else {
      console.warn(`⚠️ Heartbeat failed: ${response.status}`);
    }
  } catch (error) {
    console.error(`❌ Heartbeat error:`, error.message);
  }
}

// Poll for the next available job using claim_next_render_job
async function pollForJob() {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/claim_next_render_job`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WORKER-KEY': WORKER_SECRET
      },
      body: JSON.stringify({
        worker_id: WORKER_ID,
        job_types: ['gif', 'render_gif']
      })
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Poll failed: ${response.status} - ${text}`);
      return null;
    }

    const data = await response.json();
    return data.job || null;
  } catch (error) {
    console.error(`❌ Poll error:`, error.message);
    return null;
  }
}

// Update job status using update_render_job_status
async function updateJob(jobId, status, result = null, errorMessage = null) {
  try {
    const body = {
      id: jobId,
      status: status
    };
    
    if (result) body.result = result;
    if (errorMessage) body.error_message = errorMessage;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/update_render_job_status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-WORKER-KEY': WORKER_SECRET
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const text = await response.text();
      console.error(`❌ Update failed: ${response.status} - ${text}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Update error:`, error.message);
    return false;
  }
}

// Process a single job
async function processJob(job) {
  console.log(`\n🎬 Processing job ${job.id}`);
  console.log(`   Type: ${job.type}`);
  console.log(`   Image: ${job.image_url || job.payload?.album_cover_url}`);

  try {
    // TODO: Implement your rendering logic here
    // This is where you would:
    // 1. Download the image from job.image_url or job.payload.album_cover_url
    // 2. Generate the GIF using ffmpeg
    // 3. Upload the result to Supabase Storage
    // 4. Return the output URL

    // Placeholder: simulate work
    console.log(`   ⏳ Rendering...`);
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Example result
    const outputUrl = `https://example.com/rendered/${job.id}.gif`;
    
    await updateJob(job.id, 'done', { output_url: outputUrl });
    console.log(`✅ Job ${job.id} completed`);
    
  } catch (error) {
    // Mark as error - retry will come from retry_failed_jobs externally
    console.error(`❌ Job ${job.id} failed. Marked error. Will retry externally.`);
    console.error(`   Error: ${error.message}`);
    await updateJob(job.id, 'error', null, error.message);
    // Do NOT requeue here - retry_failed_jobs handles retry logic
  }
}

// Main worker loop
async function mainLoop() {
  console.log(`\n🔄 Worker loop started`);
  
  // Initial heartbeat
  await sendHeartbeat();
  
  // Start heartbeat interval
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);

  while (true) {
    try {
      const job = await pollForJob();
      
      if (job) {
        await processJob(job);
      } else {
        console.log(`📭 No jobs available, waiting ${POLL_INTERVAL_MS / 1000}s...`);
      }
    } catch (error) {
      console.error(`❌ Loop error:`, error.message);
    }

    await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS));
  }
}

// Start the worker
mainLoop().catch(error => {
  console.error(`💥 Fatal error:`, error);
  process.exit(1);
});
