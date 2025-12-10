/**
 * Fly.io Worker Example - MusicScan Render Queue
 * 
 * Copy this code to your Fly.io worker to process render jobs.
 * 
 * Environment variables required:
 * - WORKER_API_URL: https://ssxbpyqnjfiyubsuonar.supabase.co
 * - WORKER_SECRET: Your worker secret key
 */

import fetch from "node-fetch";

const API_URL = process.env.WORKER_API_URL || "https://ssxbpyqnjfiyubsuonar.supabase.co";
const WORKER_SECRET = process.env.WORKER_SECRET;
const WORKER_ID = process.env.FLY_ALLOC_ID || "fly-worker-" + Date.now();
const POLL_INTERVAL = parseInt(process.env.POLL_INTERVAL || "5000");
const HEARTBEAT_INTERVAL = 60000; // 1 minute

if (!WORKER_SECRET) {
  console.error("❌ WORKER_SECRET is required");
  process.exit(1);
}

// Send heartbeat to server every minute
async function sendHeartbeat() {
  try {
    const res = await fetch(`${API_URL}/functions/v1/worker_heartbeat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-WORKER-KEY": WORKER_SECRET
      },
      body: JSON.stringify({
        id: WORKER_ID,
        ts: new Date().toISOString(),
        status: "active",
        polling_interval_ms: POLL_INTERVAL
      })
    });

    if (res.ok) {
      console.log("💓 Heartbeat sent");
    } else {
      console.error("❌ Heartbeat failed:", await res.text());
    }
  } catch (error) {
    console.error("❌ Heartbeat error:", error.message);
  }
}

async function pollForJob() {
  try {
    const res = await fetch(`${API_URL}/functions/v1/worker-poll`, {
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
    const res = await fetch(`${API_URL}/functions/v1/worker-update`, {
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
  console.log(`🎬 Processing job ${job.id} (type: ${job.type})`);
  console.log(`📦 Payload:`, JSON.stringify(job.payload, null, 2));

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
    console.log(`✅ Job ${job.id} completed`);
    
  } catch (error) {
    console.error(`❌ Job ${job.id} failed:`, error.message);
    await updateJob(job.id, "error", null, error.message);
  }
}

async function mainLoop() {
  console.log(`🚀 Worker ${WORKER_ID} starting...`);
  console.log(`🔗 API URL: ${API_URL}`);
  console.log(`⏱️ Poll interval: ${POLL_INTERVAL}ms`);
  console.log(`💓 Heartbeat interval: ${HEARTBEAT_INTERVAL}ms`);

  // Send initial heartbeat
  await sendHeartbeat();

  // Start heartbeat interval
  setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  while (true) {
    const job = await pollForJob();

    if (job) {
      await processJob(job);
    } else {
      // No job available, wait before polling again
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL));
    }
  }
}

// Start the worker
mainLoop().catch(console.error);
